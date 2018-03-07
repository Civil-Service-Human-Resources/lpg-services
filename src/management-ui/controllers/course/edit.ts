import * as azure from 'azure-storage'
import * as express from 'express'
import * as fs from 'fs'
import * as extended from 'lib/extended'
import * as model from 'lib/model'
import * as catalog from 'lib/service/catalog'
import * as template from 'lib/ui/template'
import * as youtube from 'lib/youtube'
import * as log4js from 'log4js'
import * as path from 'path'
import {Readable, Writable} from 'stream'
import * as streamifier from 'streamifier'
import * as unzip from 'unzip'
import * as xml2js from 'xml2js'

const logger = log4js.getLogger('controllers/course/edit')
const blob = azure.createBlobService()

const filesToSubstitute: Record<string, {data: string | null; set: boolean}> = {
	'close_methods.js': {
		data: null,
		set: false,
	},
	'player_overrides.js': {
		data: null,
		set: false,
	},
}

async function parseMetadata(entry: unzip.Entry) {
	return new Promise((resolve, reject) => {
		let content = ''
		entry.pipe(
			new Writable({
				final: () => {
					resolve(content)
				},
				write: (chunk: any, encoding: any, next: any) => {
					content += chunk.toString()
					next()
				},
			})
		)
	})
		.then(content => {
			return new Promise((resolve, reject) => {
				xml2js.parseString(content, (err, data) => {
					if (err) {
						reject(err)
					} else {
						resolve(data)
					}
				})
			})
		})
		.then((data: any) => {
			if (data.manifest) {
				let identifier
				let title
				let launchPage
				if (data.manifest.organizations) {
					for (const wrapper of data.manifest.organizations) {
						const organization = wrapper.organization
						if (organization.length) {
							identifier = organization[0].$.identifier
							if (organization[0].title && organization[0].title.length) {
								title = organization[0].title[0]
							}
							break
						}
					}
				}
				if (data.manifest.resources) {
					for (const wrapper of data.manifest.resources) {
						const resource = wrapper.resource
						if (resource.length) {
							const type = resource[0].$['adlcp:scormtype']
							const href = resource[0].$.href
							if (type === 'sco') {
								launchPage = href
								break
							}
						}
					}
				}
				return {
					identifier,
					launchPage,
					launchUrl: '',
					title,
				}
			}
			return {}
		})
}

async function saveContent(uid: string, file: any) {
	let metadata: any = {}

	const responses = await uploadEntries(uid, file)
	responses.forEach(response => {
		if (response.metadata && response.metadata.identifier) {
			metadata = response.metadata
			return
		}
	})

	if (!metadata || !metadata.launchPage) {
		// 	// TODO: if no launch page...
		throw new Error(`No launch page found for course ${uid}`)
	}

	responses.forEach(response => {
		if (
			response.metadata &&
			response.metadata.path &&
			response.metadata.path.endsWith(metadata.launchPage)
		) {
			metadata.launchUrl = response.metadata.path
			return
		}
	})

	return metadata
}

async function getFile(filename: string) {
	const fpath = path.join(
		__dirname,
		'..',
		'..',
		'..',
		'..',
		'ui',
		'assets',
		'js',
		filename
	)

	return new Promise(async (resolve, reject) => {
		let readStream: fs.ReadStream
		let data = ''
		if (filesToSubstitute[filename].set) {
			resolve(filesToSubstitute[filename].data as string)
		} else {
			try {
				readStream = fs.createReadStream(fpath)
				readStream
					.on('data', chunk => {
						data += chunk
					})
					.on('end', () => {
						filesToSubstitute[filename].set = true
						filesToSubstitute[filename].data = data
						resolve(data)
					})
			} catch (e) {
				reject(e)
			}
		}
	})
		.then(data => {
			return new Readable({
				read(size) {
					this.push(filesToSubstitute[filename].data)
					this.push(null)
				},
			})
		})
		.catch(data => {
			throw new Error('Error reading data')
		})
}

async function upload(uid: string, entry: unzip.Entry) {
	return new Promise<azure.BlobService.BlobResult>(async (resolve, reject) => {
		let metadata = {}
		// have to parse data going in rather than coming back
		// AFAIK type defs define return as azure.BlobService.BlobResult  which is
		// rich data but api actualy just populates blockID

		logger.debug(`uploading : ${entry.path}`)
		const filename = entry.path.substring(entry.path.lastIndexOf('/') + 1)

		if (Object.keys(filesToSubstitute).indexOf(filename) >= 0) {
			const fileData = (await getFile(filename)) as fs.ReadStream
			fileData.pipe(
				blob.createWriteStreamToBlockBlob(
					'lpgdevcontent',
					entry.path,
					(err, blobData) => {
						if (err) {
							reject(err)
						} else {
							resolve(blobData)
						}
					}
				)
			)
		} else {
			// buisness as usual
			if (entry.path.endsWith('imsmanifest.xml')) {
				metadata = await parseMetadata(entry)
			}

			entry.pipe(
				blob.createWriteStreamToBlockBlob(
					'lpgdevcontent',
					entry.path,
					(err, blobData) => {
						if (err) {
							reject(err)
						} else {
							if (Object.keys(metadata).length > 0) {
								blobData.metadata = metadata
							} else {
								blobData.metadata = {
									path: entry.path,
								}
							}
							resolve(blobData)
						}
					}
				)
			)
		}
	})
}

async function uploadEntries(uid: string, file: any) {
	return new Promise<azure.BlobService.BlobResult[]>((resolve, reject) => {
		const promises: any[] = []
		streamifier
			.createReadStream(file.data)
			.pipe(unzip.Parse())
			.on('entry', (entry: unzip.Entry) => {
				if (entry.type === 'Directory') {
					entry.autodrain()
					return
				}
				promises.push(upload(uid, entry))
			})
			.on('close', () => {
				Promise.all(promises)
					.then(resolve)
					.catch(reject)
			})
			.on('error', reject)
	})
}

export function addCourse(req: express.Request, res: express.Response) {
	res.send(template.render('courses/add', req, {}))
}

export async function doAddCourse(req: express.Request, res: express.Response) {
	const session = req.session!
	const type = req.body.type
	session.course = {
		type,
	}
	logger.debug(`Adding ${type} course`)
	session.save(() => {
		res.redirect('/courses/new/edit')
	})
}

export async function doEditCourse(
	ireq: express.Request,
	res: express.Response
) {
	const req = ireq as extended.CourseRequest & {files: any}
	const data = {
		...req.body,
		requiredBy: req.body.requiredBy ? new Date(req.body.requiredBy) : null,
		tags: ((req.body.tags as string) || '').split(/,/).map(tag => tag.trim()),
		type: req.course.type || req.body.type,
		uid: req.course.uid,
	}

	const availability: string[] = []
	for (const key of Object.keys(req.body)) {
		if (key.startsWith('availability')) {
			const parts = key.split(/\./)
			if (req.body[key]) {
				availability[parseInt(parts[1], 10)] = req.body[key]
			}
		}
	}
	data.availability = availability

	const entry = model.Course.create(data)

	if (req.body['add-availability']) {
		const session = req.session!
		session.course = entry
		session.save(() => {
			res.redirect(req.path)
		})
	} else {
		const id = await catalog.add(entry)
		entry.uid = id

		if (req.files && req.files.content) {
			logger.debug('Uploading zip content')
			const {launchUrl, title} = await saveContent(id, req.files.content)
			if (!launchUrl) {
				logger.error(`Unable to get the launchUrl for course ${id}`)
				res.sendStatus(500)
				return
			}
			entry.uri = launchUrl
			if (!entry.title) {
				entry.title = title
			}
			await catalog.add(entry)
		}
		if (entry.type === 'video') {
			const info = await youtube.getBasicInfo(entry.uri)
			if (!info) {
				logger.error(`Unable to get info on course ${id} via the YouTube API`)
				res.sendStatus(500)
				return
			}
			const duration = await youtube.getDuration(info.id)
			if (!duration) {
				logger.error(
					`Unable to get duration of course ${id} via the YouTube API`
				)
				res.sendStatus(500)
				return
			}
			entry.duration = duration
			entry.title = entry.title || info.title
			await catalog.add(entry)
		}

		logger.debug(`Course ${id} updated`)
		res.redirect('/courses')
	}
}

export function editCourse(ireq: express.Request, res: express.Response) {
	const req = ireq as extended.CourseRequest
	const {course} = req
	const page = `courses/edit/${course.type}`
	res.send(
		template.render(page, req, {
			course,
		})
	)
}

export async function loadCourse(
	ireq: express.Request,
	res: express.Response,
	next: express.NextFunction
) {
	const req = ireq as extended.CourseRequest
	const courseId: string = req.params.courseId
	const session = req.session!
	if (courseId === 'new') {
		if (session.course) {
			req.course = model.Course.create(session.course)
		} else {
			// TODO(tav): Is this okay? Does code not rely on this being a
			// fleshed out Course object?
			req.course = {} as model.Course
		}
	} else {
		if (session.course && session.course.uid === courseId) {
			req.course = model.Course.create(session.course)
		} else {
			const course = await catalog.get(courseId)
			if (!course) {
				res.sendStatus(404)
				return
			}
			req.course = course
		}
	}
	next()
}

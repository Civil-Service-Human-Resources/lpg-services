import * as aws from 'aws-sdk'
import * as express from 'express'
import * as config from 'lib/config'
import * as extended from 'lib/extended'
import * as model from 'lib/model'
import * as catalog from 'lib/service/catalog'
import * as template from 'lib/ui/template'
import * as youtube from 'lib/youtube'
import * as log4js from 'log4js'
import * as streamifier from 'streamifier'
import * as unzip from 'unzip'
import * as xml2js from 'xml2js'

const logger = log4js.getLogger('controllers/course/edit')
const s3 = new aws.S3(config.AWS)

function getContentType(path: string) {
	switch (true) {
		case /.*\.htm(l)?$/.test(path):
			return 'text/html'
		case /.*\.js$/.test(path):
			return 'application/javascript'
		case /.*\.css$/.test(path):
			return 'text/css'
		case /.*\.xml/.test(path):
			return 'application/xml'
		case /.*\.pdf/.test(path):
			return 'application/pdf'
		default:
			return ''
	}
}

async function parseMetadata(uploadResponse: aws.S3.ManagedUpload.SendData) {
	return new Promise((resolve, reject) => {
		s3.getObject(
			{
				Bucket: 'csl-learning-content',
				Key: uploadResponse.Key,
			},
			(err, data) => {
				if (err) {
					reject(err)
				} else {
					resolve(data.Body)
				}
			}
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
	let metadata
	const responses = await uploadEntries(uid, file)
	for (const response of responses) {
		if (response.Key.endsWith('imsmanifest.xml')) {
			metadata = await parseMetadata(response)
			break
		}
	}
	if (!metadata || !metadata.launchPage) {
		// TODO: if no launch page...
		throw new Error(`No launch page found for course ${uid}`)
	}
	for (const response of responses) {
		if (response.Key.endsWith(`/${metadata.launchPage}`)) {
			metadata.launchUrl = response.Location
			break
		}
	}
	return metadata
}

async function upload(uid: string, entry: unzip.Entry) {
	return new Promise<aws.S3.ManagedUpload.SendData>((resolve, reject) => {
		logger.debug(`Uploading ${uid}/${entry.path}`)
		s3.upload(
			{
				Body: entry,
				Bucket: 'csl-learning-content',
				ContentType: getContentType(entry.path),
				Key: `${uid}/${entry.path}`,
			},
			(err, data) => {
				if (err) {
					reject(err)
				} else {
					resolve(data)
				}
			}
		)
	})
}

async function uploadEntries(uid: string, file: any) {
	return new Promise<aws.S3.ManagedUpload.SendData[]>((resolve, reject) => {
		const promises: Array<Promise<aws.S3.ManagedUpload.SendData>> = []
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

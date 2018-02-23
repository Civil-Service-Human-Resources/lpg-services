import * as aws from 'aws-sdk'
import * as config from 'lib/config'
import {Request, Response, NextFunction} from 'express'
import * as streamifier from 'streamifier'
import * as unzip from 'unzip'
import * as catalog from 'lib/service/catalog'
import * as log4js from 'log4js'
import * as model from 'lib/model'
import * as template from 'lib/ui/template'
import * as youtube from 'lib/youtube'
import {parseString} from 'xml2js'

const logger = log4js.getLogger('controllers/course/edit')

const s3 = new aws.S3(config.AWS)

export let loadCourse = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	const courseId: string = req.params.courseId
	if (courseId === 'new') {
		if (req.session.course) {
			req.course = model.Course.create(req.session.course)
		} else {
			req.course = {}
		}
	} else {
		if (req.session.course && req.session.course.uid === courseId) {
			req.course = model.Course.create(req.session.course)
		} else {
			req.course = await catalog.get(courseId)
		}
		if (!req.course) {
			return res.sendStatus(404)
		}
	}
	next()
}

export let addCourse = (req: Request, res: Response) => {
	res.send(template.render('courses/add', req, {}))
}

export let doAddCourse = async (req: Request, res: Response) => {
	const type = req.body.type

	req.session.course = {
		type,
	}

	logger.debug(`Adding ${type} course`)
	req.session.save(() => {
		res.redirect('/courses/new/edit')
	})
}

export let editCourse = (req: Request, res: Response) => {
	const {course} = req
	const page = `courses/edit/${course.type}`

	res.send(
		template.render(page, req, {
			course,
		})
	)
}

export let doEditCourse = async (req: Request, res: Response) => {
	const data = {
		...req.body,
		requiredBy: req.body.requiredBy ? new Date(req.body.requiredBy) : null,
		tags: (req.body.tags || '').split(/,/).map(tag => tag.trim()),
		type: req.course.type || req.body.type,
		uid: req.course.uid,
	}

	const availability = []
	for (const key of Object.keys(req.body)) {
		if (key.startsWith('availability')) {
			const parts = key.split(/\./)
			if (req.body[key]) {
				availability[parts[1]] = req.body[key]
			}
		}
	}
	data.availability = availability

	const entry = model.Course.create(data)

	if (req.body['add-availability']) {
		req.session.course = entry
		req.session.save(() => {
			res.redirect(req.path)
		})
	} else {
		const id = await catalog.add(entry)
		entry.uid = id

		if (req.files && req.files.content) {
			logger.debug('Uploading zip content')
			const {launchUrl, title} = await saveContent(id, req.files.content)
			entry.uri = launchUrl
			if (!entry.title) {
				entry.title = title
			}
			await catalog.add(entry)
		}
		if (entry.type === 'video') {
			const info = await youtube.getBasicInfo(entry.uri)
			entry.duration = await youtube.getDuration(info.id)
			entry.title = entry.title || info.title
			await catalog.add(entry)
		}

		logger.debug(`Course ${id} updated`)
		res.redirect('/courses')
	}
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
	// TODO: if no launch page...
	for (const response of responses) {
		if (response.Key.endsWith(`/${metadata.launchPage}`)) {
			metadata.launchUrl = response.Location
			break
		}
	}
	return metadata
}

async function upload(uid, entry) {
	return new Promise((resolve, reject) => {
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
	return new Promise((resolve, reject) => {
		let promises = []
		streamifier
			.createReadStream(file.data)
			.pipe(unzip.Parse())
			.on('entry', entry => {
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

async function parseMetadata(uploadResponse) {
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
				parseString(content, (err, data) => {
					if (err) {
						reject(err)
					} else {
						resolve(data)
					}
				})
			})
		})
		.then(data => {
			if (data.manifest) {
				let identifier
				let title
				let launchPage

				if (data.manifest.organizations) {
					for (const wrapper of data.manifest.organizations) {
						const organization = wrapper.organization
						if (organization.length) {
							identifier = organization[0]['$']['identifier']
							if (organization[0]['title'] && organization[0]['title'].length) {
								title = organization[0]['title'][0]
							}
							break
						}
					}
				}

				if (data.manifest.resources) {
					for (const wrapper of data.manifest.resources) {
						const resource = wrapper.resource
						if (resource.length) {
							const type = resource[0]['$']['adlcp:scormtype']
							const href = resource[0]['$']['href']
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
					title,
				}
			}
			return {}
		})
}

function getContentType(path) {
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
			return null
	}
}

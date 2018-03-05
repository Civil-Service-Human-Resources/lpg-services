import * as aws from 'aws-sdk'
import * as express from 'express'
import * as fs from 'fs'
import * as concat from 'lib/concat'
import * as config from 'lib/config'
import * as extended from 'lib/extended'
import * as log4js from 'log4js'

const logger = log4js.getLogger('controllers/course/player')
const s3 = new aws.S3(config.AWS)

export async function play(ireq: express.Request, res: express.Response) {
	logger.debug(
		`Loading course resource, courseId: ${ireq.params.courseId}, moduleId: ${
			ireq.params.moduleId
		}`
	)

	const req = ireq as extended.CourseRequest
	const course = req.course
	const module = course.modules.find(m => m.id === req.params.moduleId)

	if (!module || !module.startPage) {
		logger.debug(`module or module startPage not found - ${module}`)
		res.sendStatus(404)
	} else {
		let path = req.path

		if (path === '/') {
			if (!req.originalUrl.endsWith('/')) {
				return res.redirect(`${req.originalUrl}/`)
			}
			path = `${course.id}/${module.id}/${module.startPage}`
		} else {
			path = path.substring(1)
		}

		s3.getObject(
			{
				Bucket: 'csl-learning-content',
				Key: path,
			},
			(err, data) => {
				if (err) {
					logger.error('Error retrieving course content', err)
					res.sendStatus(err.statusCode || 500)
				} else {
					if (data.ContentType) {
						res.setHeader('Content-Type', data.ContentType)
					}
					if (data.ETag) {
						res.setHeader('ETag', data.ETag)
					}
					if (data.LastModified) {
						res.setHeader('Last-Modified', data.LastModified.toUTCString())
					}
					res.send(data.Body)
				}
			}
		)
	}
}

let scormJS = ''

function getScormJS() {
	if (scormJS) {
		return scormJS
	}
	scormJS = `
window.activity = document.location.protocol + "//" + document.location.host + document.location.pathname;

window.xapiConfig = {
	lrs: {
		endpoint: window.location.origin + "/xapi/",
		user: "",
		password: ""
	},
	courseId: window.activity,
	lmsHomePage: "https://cslearning.gov.uk/",
	isScorm2004: false
};

${concat.files([
		'assets/js/xapiwrapper.min.js',
		'assets/js/APIWrapper.js',
		'assets/js/SCORMToXApiFunctions.js',
		'assets/js/Scorm.js',
	])}
`
	return scormJS
}

export function scormApi(req: express.Request, res: express.Response) {
	res.set('Content-Type', 'application/javascript')
	res.send(getScormJS())
}

export function portalOverrides(req: express.Request, res: express.Response) {
	res.set('Content-Type', 'application/javascript')
	fs.createReadStream('assets/js/player_overrides.js').pipe(res)
}

export function closeMethods(req: express.Request, res: express.Response) {
	res.set('Content-Type', 'application/javascript')
	fs.createReadStream('assets/js/close_methods.js').pipe(res)
}

export function tincanWrapper(req: express.Request, res: express.Response) {
	res.set('Content-Type', 'application/javascript')
	fs.createReadStream('assets/js/tincan_wrapper.js').pipe(res)
}

import * as aws from 'aws-sdk'
import {Request, Response} from 'express'
import * as fs from 'fs'
import * as url from 'url'
import * as concat from 'concat'
import * as config from 'lib/config'
import * as log4js from 'log4js'

const s3 = new aws.S3(config.AWS)

const logger = log4js.getLogger('controllers/course/player')

export async function play(req: Request, res: Response) {
	logger.debug(`Loading course resource, courseId: ${req.params.courseId}`)

	const course = req.course

	if (!course || !course.uri) {
		res.sendStatus(404)
	} else {
		// TODO: If website content record completion and redirect to site
		// TODO: Caching

		let location
		const path = req.path

		if (path === '/') {
			if (!req.originalUrl.endsWith('/')) {
				return res.redirect(`${req.originalUrl}/`)
			}
			location = course.uri
		} else {
			location = course.uri.substring(0, course.uri.lastIndexOf('/')) + path
		}

		let parsedLocation = url.parse(location)

		s3.getObject(
			{
				Bucket: 'csl-learning-content',
				Key: parsedLocation.path.substring(1),
			},
			(err, data) => {
				if (err) {
					logger.error('Error retrieving course content', err)
					res.sendStatus(err.statusCode || 500)
				} else {
					res.setHeader('Content-Type', data.ContentType)
					res.setHeader('ETag', data.ETag)
					res.setHeader('Last-Modified', data.LastModified)
					res.send(data.Body)
				}
			}
		)
	}
}

export async function scormApi(req: Request, res: Response) {
	res.set('Content-Type', 'application/javascript')

	const fileContent = await concat([
		'assets/js/xapiwrapper.min.js',
		'assets/js/APIWrapper.js',
		'assets/js/SCORMToXApiFunctions.js',
		'assets/js/Scorm.js',
	])

	res.send(`
window.activity = document.location.protocol + "//" + document.location.host + document.location.pathname;
	
window.xapiConfig = {
	lrs: {
		endpoint: window.location.origin + "/xapi/",
		user: "",
		password: ""
	},
	courseId: window.activity,
	lmsHomePage: "http://localhost:3001/",
	isScorm2004: false
};

${fileContent}
`)
}

export function portalOverrides(req: Request, res: Response) {
	res.set('Content-Type', 'application/javascript')
	fs.createReadStream('assets/js/player_overrides.js').pipe(res)
}

export function closeMethods(req: Request, res: Response) {
	res.set('Content-Type', 'application/javascript')
	fs.createReadStream('assets/js/close_methods.js').pipe(res)
}

export function tincanWrapper(req: Request, res: Response) {
	res.set('Content-Type', 'application/javascript')
	fs.createReadStream('assets/js/tincan_wrapper.js').pipe(res)
}

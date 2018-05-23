import * as express from 'express'
import * as fs from 'fs'
import * as datetime from 'lib/datetime'
import * as extended from 'lib/extended'
import * as model from 'lib/model'
import * as template from 'lib/ui/template'
import * as youtube from 'lib/youtube'
import * as log4js from 'log4js'
import * as path from 'path'
import * as shortid from 'shortid'
import {Readable} from 'stream'
import * as tmp from 'tmp'
/*tslint:disable*/
const exiftool = require('node-exiftool')
const exiftoolBin = require('dist-exiftool')
/*tslint:enable*/

import * as editCourseController from '../course/edit'

const logger = log4js.getLogger('controllers/course/edit')

function missingCourse() {
	throw new Error('Missing course')
}

function missingModule() {
	throw new Error('Missing module')
}

export interface AcceptableMetaInfo {
	keys: string[]
	values: string[]
}

const acceptedFileTypes: {[fileExtension: string]: AcceptableMetaInfo} = {
	'.doc': {
		keys: ['CompObjUserType'],
		values: ['Microsoft Office Word 97-2003 Document'],
	},
	'.docx': {keys: ['ZipFileName'], values: ['word/numbering.xml']},
	'.mp4': {keys: [], values: []},
	'.pdf': {keys: ['PDFVersion'], values: []},
	'.ppsm': {keys: ['Application'], values: ['Microsoft Office PowerPoint']},
	'.pptx': {keys: ['ZipFileName'], values: ['ppt/theme/theme1.xml']},
	'.xls': {
		keys: ['CompObjUserType'],
		values: ['Microsoft Office Excel 2003 Worksheet'],
	},
	'.xlsx': {keys: ['ZipFileName'], values: ['xl/drawings/drawing1.xml']},
	'.zip': {keys: ['ZipFileName'], values: []},
}

function courseModuleCheck(req: extended.CourseRequest) {
	if (!req.course) {
		missingCourse()
	}
	if (!req.module) {
		missingModule()
	}
}

function validator(extension: string, metaData: any): boolean {
	const acceptedForFile = acceptedFileTypes[extension]

	/* doing this so it typecasts */
	const metaDataKeys: string[] = Object.keys(metaData.data[0])
	const metaDataValues: string[] = Object.values(metaData.data[0])

	return (
		metaDataKeys.some(r => acceptedForFile.keys.indexOf(r) >= 0) &&
		(!acceptedForFile.values.length ||
			metaDataValues.some(r => acceptedForFile.values.indexOf(r) >= 0))
	)
}

async function pendingFileHandler(
	req: express.Request,
	moduleIndex: string | null,
	fileData: any,
	fileName: string
): Promise<boolean> {
	//save file temporarily rather than upload straight away to prevent orphans
	const tmpObj = tmp.dirSync()
	const filePath = `${tmpObj.name}/${fileName}`

	const session = req.session!

	await new Readable({
		read(size) {
			this.push(fileData)
			this.push(null)
		},
	}).pipe(fs.createWriteStream(filePath))

	const ep = new exiftool.ExiftoolProcess(exiftoolBin)
	const metaData = await ep
		.open()
		// display pid
		.then((pid: any) => console.log('Started exiftool process %s', pid))
		.then(() => ep.readMetadata(filePath, ['-File:all']))
	ep.close()

	if (!validator(path.extname(filePath), metaData)) {
		tmp.setGracefulCleanup()
		return false
	}

	if (!session.pendingFiles || !session.pendingFiles.length) {
		session.pendingFiles = []
	}

	// check to see if pending files has this index
	const index = (session.pendingFiles as Array<{}>).findIndex(
		(m: any) => m.moduleIndex === moduleIndex
	)
	if (index > -1) {
		session.pendingFiles.splice(index, 1)
	}

	const pendingFile = {
		duration: null,
		moduleIndex,
		name: fileName,
		path: filePath,
	}

	if (path.extname(filePath) === '.mp4') {
		pendingFile.duration = datetime.parseMP4Duration(
			metaData.data[0].MediaDuration
		) as any
	}

	session.pendingFiles.push(pendingFile)
	return true
}

export async function removeModule(
	ireq: express.Request,
	res: express.Response
) {
	const req = ireq as extended.CourseRequest & {files: any}
	const {course, module} = req
	const session = req.session!

	courseModuleCheck(req)
	let index = course.modules.findIndex(m => m.id === module!.id)
	if (index > -1) {
		course.modules.splice(index, 1)
	}

	if (session.pendingFiles) {
		// remove any pending files
		index = (session.pendingFiles as Array<{}>).findIndex(
			(m: any) => m.id === module!.id
		)
		if (index > -1) {
			fs.unlinkSync(session.pendingFiles[index].name)
			session.pendingFiles.splice(index, 1)
		}
	}
	await editCourseController.saveCourse(ireq, course)
	session.squash_session_clear = true
	res.redirect(`/courses/${course.id}`)
}

export async function setModule(ireq: express.Request, res: express.Response) {
	let redirect = null
	const req = ireq as extended.CourseRequest & {files: any}
	const submit = ireq.body.submit
	const {course, module} = req
	const session = req.session!

	req.body.location = req.sanitizeBody('location').unescape()

	const data = {
		...req.body,
		events: module!.events || [],
		id: module!.id || 'add-module', //temp id for persistance
		type: module!.type || req.params.moduleType,
	}

	if (!data.startPage && data.type === 'elearning') {
		data.startPage = module!.startPage ? module!.startPage : 'not set' // need this as placeholder or java falls over
	}

	data.audiences =
		module!.audiences && module!.audiences.length > 0
			? module!.audiences
			: [model.Audience.create({})]

	if (data.type === 'face-to-face') {
		// handle events
		if (Array.isArray(req.body.event_date)) {
			data.events = []
			for (const index of Object.keys(req.body.event_date)) {
				const event = {
					date: req.body.event_date[index],
					id: null,
					location: req.body.event_location[index],
				}
				event.id = req.body.event_id ? req.body.event_id[index] : null
				data.events.push(model.Event.create(event))
			}
		} else {
			//singular

			const event = {
				date: req.body.event_date,
				id: req.body.event_id || null,
				location: req.body.event_location,
			}
			data.events = [model.Event.create(event)]
		}
	}

	courseModuleCheck(req)

	// handler start

	if (submit === 'Back') {
		if (data.id !== 'add-module') {
			session.squash_session_clear = true
			redirect = `/courses/${course.id}`
		} else {
			redirect = `/courses/${course.id}/add-module`
		}
	}
	if (submit.startsWith('change')) {
		const node = submit.split('_')[2]
		const index = submit.split('_')[1]
		const id = await storeModule(ireq, model.Module.create(data))
		redirect = `/courses/${course.id}/${id}/audience/${index}/${node}`
	}

	if (submit.startsWith('add_audience')) {
		data.audiences.push(model.Audience.create({}))
		const id = await storeModule(ireq, model.Module.create(data))
		redirect = `/courses/${course.id}/${id}/${data.type}`
	}

	if (submit.startsWith('remove_audience')) {
		const index = submit.split('_')[2]

		data.audiences.splice(index, 1)
		const id = await storeModule(ireq, model.Module.create(data))
		redirect = `/courses/${course.id}/${id}/${data.type}`
	}

	if (submit.startsWith('remove_event')) {
		const index = submit.split('_')[2]
		data.events.splice(index, 1)
		const id = await storeModule(ireq, model.Module.create(data))
		redirect = `/courses/${course.id}/${id}/${data.type}`
	}

	if (submit.startsWith('add_event')) {
		data.events.push(model.Event.create({}))
		const id = await storeModule(ireq, model.Module.create(data))
		redirect = `/courses/${course.id}/${id}/${data.type}`
	}

	// handler end

	if (redirect) {
		logger.debug('Redirecting')
		res.redirect(redirect)
	} else {
		if (data.type === 'video' && !req.files) {
			logger.debug('Getting video duration')

			const info = await youtube.getBasicInfo(data.location)
			if (!info) {
				logger.error(`Unable to get info on module via the YouTube API`)
				res.sendStatus(500)
				return
			}

			const duration = (await youtube.getDuration(info.id)) || 0
			if (!duration) {
				logger.error(`Unable to get duration of module via the YouTube API`)
				res.sendStatus(500)
				return
			}

			data.duration = duration
			data.title = data.title || info.title
		}

		let moduleIndex: string | null = null
		if (req.params.moduleId === 'add-module') {
			data.type = req.params.moduleType
			data.startPage = 'Not set' // need this as placeholder or java falls over

			let rand = shortid.generate()
			while (rand.indexOf('new_') > -1) {
				rand = shortid.generate() // lets just makes sure it never randomly generates the new module id prefixf
			}

			data.id = `new_${rand}` // unique temp id for persistance and identifying for editing

			if (!req.course.modules) {
				req.course.modules = []
			}
			req.course.modules.push(model.Module.create(data))
			moduleIndex = data.id
		} else {
			const index = req.course.modules.findIndex(m => m.id === module!.id)
			if (index > -1) {
				req.course.modules[index] = model.Module.create(data)
			} else {
				missingCourse()
			}
			moduleIndex = module!.id
		}

		if (req.files && req.files.content) {
			logger.info('upload')

			const fileExtension = `.${req.files.content.name.split('.').pop()}`

			if (data.type === 'elearning' && fileExtension === '.zip') {
				req.flash('error', 'Expecting .zip file')
				res.redirect(`/courses/${course.id}/${moduleIndex}/file`)
				return
			} else if (
				!(Object.keys(acceptedFileTypes).indexOf(fileExtension) > -1)
			) {
				req.flash(
					'error',
					`Expecting ${Object.keys(acceptedFileTypes).join(', ')} file`
				)
				res.redirect(`/courses/${course.id}/${moduleIndex}/file`)
				return
			}

			//await
			const isFileValid = await pendingFileHandler(
				ireq,
				moduleIndex,
				req.files.content.data,
				encodeURIComponent(req.files.content.name)
			)

			if (!isFileValid) {
				req.flash('error', 'not valid file')
				res.redirect(`/courses/${course.id}/${module!.id}/edit`)
				return
			}
		}

		// now update course and send back to edit page
		session.squash_session_clear = true
		await editCourseController.saveCourse(ireq, req.course)
		res.redirect(`/courses/${course.id}`)
	}
}

export function getModule(ireq: express.Request, res: express.Response) {
	const req = ireq as extended.CourseRequest
	const {module} = req

	const audiences: model.Audience[] = module!.audiences.length
		? module!.audiences
		: [model.Audience.create({})]

	const events: model.Event[] = module!.events.length
		? module!.events
		: [model.Event.create({})]

	courseModuleCheck(req)

	if (!module!.type) {
		module!.type = req.params.moduleType
	}

	res.send(
		template.render(`courses/modules/${module!.type}`, req, res, {
			audiences,
			error: req.flash('error')[0],
			events,
			module,
		})
	)
}

export function setModuleType(ireq: express.Request, res: express.Response) {
	const req = ireq as extended.CourseRequest
	const {course} = req
	const moduleType = req.body.type
	const session = req.session!

	if (req.body.submit === 'Back') {
		session.squash_session_clear = true
		res.redirect(`/courses/${course.id}/`)
	} else {
		res.redirect(`/courses/${course.id}/add-module/` + moduleType)
	}
}

export function getModuleType(ireq: express.Request, res: express.Response) {
	const req = ireq as extended.CourseRequest
	const {course} = req
	const session = req.session!
	delete session.modules

	session.save(() => {
		res.send(
			template.render('courses/modules', req, res, {
				course,
			})
		)
	})
}

export function retrieveModule(
	ireq: express.Request,
	id: string
): model.Module | undefined {
	const session = ireq.session!
	let module: model.Module | undefined

	if (session.modules) {
		module = (session.modules as model.Module[]).find(m => m.id === id)
	}
	if (module) {
		return module
	} else {
		return undefined
	}
}

export async function storeModule(
	ireq: express.Request,
	module: model.Module
): Promise<any> {
	const session = ireq.session!
	if (!session.modules) {
		session.modules = []
	}

	const index = (session.modules as model.Module[]).findIndex(
		m => m.id === module.id
	)
	if (index < 0) {
		session.modules.push(module)
	} else {
		session.modules[index] = module
	}

	logger.debug(`Storing `)

	return new Promise((resolve, reject) => {
		session.save(err => {
			if (err) {
				reject(err)
			} else {
				resolve(module.id)
			}
		})
	})
}

export async function loadModule(
	ireq: express.Request,
	res: express.Response,
	next: express.NextFunction
) {
	const req = ireq as extended.CourseRequest
	const moduleId: string = req.params.moduleId

	if (req.course) {
		// try to get module from session first
		let module = retrieveModule(ireq, moduleId)
		// if  no module
		if (!module) {
			module = req.course.modules
				? req.course.modules.find(m => m.id === moduleId)
				: undefined
		}
		if (!module) {
			// if still no module , do we create it?
			if (moduleId === 'add-module') {
				logger.debug('populating empty')
				module = model.Module.create({id: 'add-module'})
			} else {
				logger.debug(`module ${moduleId} not found`)
				res.sendStatus(404)
				return
			}
		}
		req.module = module
	} else {
		logger.debug(`course for module not found`)
		res.sendStatus(404)
		return
	}

	next()
}

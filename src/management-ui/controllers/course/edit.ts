import * as express from 'express'
import * as fs from 'fs'
import * as extended from 'lib/extended'
import * as model from 'lib/model'
import * as catalog from 'lib/service/catalog'
import * as template from 'lib/ui/template'
import * as log4js from 'log4js'
import * as filestore from '../../filestore'

const logger = log4js.getLogger('controllers/course/edit')

export async function setCourse(ireq: express.Request, res: express.Response) {
	let redirect: string | null = null
	const req = ireq as extended.CourseRequest
	const submit = ireq.body.submit
	const session = req.session!

	// probably need to distinquish between new course and existing course better here
	const data = {
		...req.body,
		id: req.course ? req.course.id : 'add-course',
		modules: req.course ? req.course.modules : [],
		requiredBy: req.body.requiredBy ? new Date(req.body.requiredBy) : null,
		tags: ((req.body.tags as string) || '').split(/,/).map(tag => tag.trim()),
	}

	const course: model.Course = model.Course.create(data)
	await saveCourse(ireq, course)
	// action handlers
	if (submit.startsWith('edit_module')) {
		redirect = `/courses/${course.id}/${submit.split('/')[1]}/edit`
	}
	if (submit.startsWith('remove_module')) {
		redirect = `/courses/${course.id}/${submit.split('/')[1]}/remove`
	}
	if (submit.startsWith('Add Module')) {
		redirect = `/courses/${course.id}/add-module`
	}
	// end action handlers

	if (redirect) {
		// do action
		res.redirect(redirect)
	} else {
		// adding course itself

		if (course.id === 'add-course') {
			delete course.id // delete fake id
			let moduleIndex = 0
			course.modules.forEach(module => {
				if (module.id.indexOf('new_') === 0) {
					if (session.pendingFiles) {
						// lets update any pending files with the position of the module in the course
						const index = (session.pendingFiles as Array<{}>).findIndex(
							(m: any) => m.moduleIndex === module!.id
						)

						session.pendingFiles[index].moduleIndex = moduleIndex
					}
					delete module.id
				}
				moduleIndex++
			})
		}
		const id = await catalog.add(course)

		// now lets upload any files

		if (session.pendingFiles && session.pendingFiles.length) {
			// get the course again to get ids
			// remove all temp ids from modules
			const saved = await catalog.get(id)
			for (const file of session.pendingFiles) {
				if (file) {
					logger.debug(`Uploading zip content from ${file.name}`)

					await fs.readFileSync(file.name)
					let moduleIndex = null

					if (saved!.modules.length) {
						// first try and get module by  id property
						const index = (saved!.modules as Array<{}>).findIndex(
							(m: any) => m.id === file.moduleIndex
						)
						moduleIndex = index > -1 ? index : file.moduleIndex
					}
					//TODO if replacing elearning files remove old files!

					// Fire and forget to avoid timeout issues in browser
					filestore.saveContent(
						saved!,
						saved!.modules[moduleIndex],
						file.name,
						true
					)
				}
			}
		}

		logger.debug(`Course ${id} updated`)

		delete session.squash_session_clear
		delete session.course
		delete session.pendingFiles

		session.save(() => {
			res.redirect(`/courses`)
		})
	}
}

export async function getCourse(ireq: express.Request, res: express.Response) {
	const req = ireq as extended.CourseRequest
	const session = req.session!

	let {course} = req
	// module should be part of course or not submitted
	delete session.modules

	if (!session.squash_session_clear) {
		// clear sessions unless explicitly told not to
		logger.debug('clearing session')
		delete session.course
		delete session.pendingFiles
		if (course.id === 'add-course') {
			// blank a new course
			const id = course.id
			course = model.Course.create({id})
		}
	} else {
		logger.debug('clearing squash')
		delete session.squash_session_clear
	}

	if (!course) {
		logger.debug('no course')
		await loadCourse(ireq, res)
		course = req.course
	}

	session.save(() => {
		res.send(
			template.render('courses/edit', req, res, {
				course,
			})
		)
	})
}

export async function saveCourse(ireq: express.Request, course: model.Course) {
	const session = ireq.session!
	course.id = course.id ? course.id : 'add-course'
	session.course = course
	logger.debug('Saving to session')

	return new Promise((resolve, reject) => {
		session.save(err => {
			if (err) {
				reject(err)
			} else {
				resolve(course.id)
			}
		})
	})
}

export async function loadCourse(ireq: express.Request, res: express.Response) {
	const req = ireq as extended.CourseRequest
	const courseId: string = req.params.courseId
	const session = ireq.session!
	if (courseId === 'add-course' || !courseId) {
		if (session.course) {
			req.course = session.course

			logger.debug('Loading from  session')
		} else {
			req.course = {id: 'add-course'} as model.Course
		}
	} else {
		if (session.course && session.course.id === courseId) {
			logger.debug('recreating course')
			req.course = session.course
		} else {
			const course = await catalog.get(courseId)
			if (!course) {
				logger.debug(`course ${courseId} not found`)
				res.sendStatus(404)
				return
			}
			logger.debug(`Got course ${courseId} `)
			req.course = course
		}
	}
	logger.debug('End course get')
}

export async function loadCourseStub(
	ireq: express.Request,
	res: express.Response,
	next: express.NextFunction
) {
	await loadCourse(ireq, res)
	next()
}

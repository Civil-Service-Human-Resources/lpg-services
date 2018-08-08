import {confirmedMessage, recordCheck} from './booking'

import * as express from 'express'
import * as dateTime from 'lib/datetime'
import * as extended from 'lib/extended'
import * as learnerRecord from 'lib/learnerrecord'
import * as notify from 'lib/service/notify'
import * as template from 'lib/ui/template'
import * as xapi from 'lib/xapi'
import * as log4js from 'log4js'

const logger = log4js.getLogger('controllers/booking/cancel')

export async function renderCancelBookingPage(
	ireq: express.Request,
	res: express.Response
) {
	const req = ireq as extended.CourseRequest
	const course = req.course
	const module = req.module!
	const event = req.event!

	const record = await learnerRecord.getRecord(req.user, course, module, event)

	if (!recordCheck(record, ireq)) {
		res.sendStatus(400)
		return
	}

	course.record = record!

	const moduleRecord = record!.modules.find(
		rm => rm.moduleId === module.id && rm.eventId === event.id
	)

	if (!moduleRecord) {
		res.sendStatus(400)
		return
	}
	(module as any).record = moduleRecord

	const optionType = 'radio'
	const options = Object.entries(req.__('cancelReasons'))

	res.send(
		template.render('booking/cancel-booking', req, res, {
			course,
			error: req.flash('cancelBookingError')[0],
			event,
			module,
			optionType,
			options,
		})
	)
}

export async function renderCancelledBookingPage(
	ireq: express.Request,
	res: express.Response
) {
	const req = ireq as extended.CourseRequest

	const course = req.course
	const module = req.module!
	const event = req.event!
	let error: string = ''

	const record = await learnerRecord.getRecord(req.user, course, module, event)
	if (!recordCheck(record, ireq)) {
		error = req.__('errors.registrationNotFound')
	} else {
		const moduleRecord = record!.modules.find(
			rm => rm.moduleId === module.id && rm.eventId === event.id
		)

		if (moduleRecord && moduleRecord.state !== 'UNREGISTERED') {
			req.flash('cancelBookingError', req.__('errors.cancelBooking'))
			req.session!.save(() => {
				res.redirect(`/book/${course.id}/${module.id}/${event.id}/cancel`)
			})
			return
		} else if (!moduleRecord) {
			error = req.__('errors.registrationNotFound')
		}
	}

	const message = error ? confirmedMessage.NotFound : confirmedMessage.Cancelled

	res.send(
		template.render('booking/confirmed', req, res, {
			course,
			error,
			event,
			message,
			module,
		})
	)
}

export async function tryCancelBooking(
	ireq: express.Request,
	res: express.Response
) {
	const req = ireq as extended.CourseRequest
	const course = req.course
	const module = req.module!
	const event = req.event!

	const record = await learnerRecord.getRecord(req.user, course, module, event)

	if (!record) {
		logger.warn(
			`Attempt to cancel a booking when not registered. user: ${
				req.user.id
			}, course: ${course.id}, module: ${module.id}, event: ${event.id}`
		)
		res.sendStatus(400)
		return
	}

	course.record = record

	const extensions: Record<string, any> = {}
	const cancelReason = req.body['other-reason']
		? req.body['cancel-reason']
		: req.body['cancel-reason']

	if (cancelReason) {
		extensions[xapi.Extension.CancelReason] = cancelReason
	}
	let errors = false

	await xapi
		.record(req, course, xapi.Verb.Unregistered, extensions, module, event)
		.catch((error: any) => {
			req.session!.save(() => {
				req.flash('cancelBookingError', error.message)
				res.redirect(`/book/${course.id}/${module.id}/${event.id}/cancel`)

				errors = true
			})
		})

	if (!errors) {
		await notify.bookingCancelled({
			bookingReference: `${req.user.id}-${event.id}`,
			cost: module.cost,
			courseDate: `${dateTime.formatDate(event.date)} ${dateTime.formatTime(
				event.date,
				true
			)} ${
				module.duration
					? 'to ' + dateTime.addSeconds(event.date, module.duration, true)
					: ''
			}`,
			courseLocation: event.location,
			courseTitle: module.title || course.title,
			email: req.user.userName,
			learnerName: req.user.givenName || req.user.userName,
			lineManager: req.user.lineManager,
		})

		req.session!.save(() => {
			res.redirect(`/book/${course.id}/${module.id}/${event.id}/cancelled`)
		})
	}
}

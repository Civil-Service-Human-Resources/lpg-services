import {confirmedMessage, recordCheck} from './booking'

import {NextFunction} from 'express'
import * as express from 'express'
import * as extended from 'lib/extended'
import * as learnerRecord from 'lib/learnerrecord'
import * as template from 'lib/ui/template'
import * as xapi from 'lib/xapi'
import * as log4js from 'log4js'

const logger = log4js.getLogger('controllers/booking/cancel')

export async function renderCancelBookingPage(
	ireq: express.Request,
	res: express.Response,
	next: NextFunction
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
	;(module as any).record = moduleRecord

	const optionType = 'radio'

	await learnerRecord
		.getCancellationReasons(req.user)
		.then(request => {
			const options = Object.entries(request.data)
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
		})
		.catch(error => next(error))
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

	const message = error ? confirmedMessage.Error : confirmedMessage.Cancelled

	res.send(
		template.render('booking/confirmed', req, res, {
			course,
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

	const result = await learnerRecord.cancelBooking(
		event,
		cancelReason,
		req.user
	)

	const response: any = {
		404: async () => {
			req.session!.save(() => {
				req.flash('cancelBookingError', 'The booking could not be found.')
				res.redirect(`/book/${course.id}/${module.id}/${event.id}/cancel`)
			})
		},
		400: async () => {
			req.session!.save(() => {
				req.flash(
					'cancelBookingError',
					'An error occurred while trying to cancel your booking.'
				)
				res.redirect(`/book/${course.id}/${module.id}/${event.id}/cancel`)
			})
		},
		200: async () => {
			req.session!.save(() => {
				res.redirect(`/book/${course.id}/${module.id}/${event.id}/cancelled`)
			})
		},
	}

	await response[result.status]()
}

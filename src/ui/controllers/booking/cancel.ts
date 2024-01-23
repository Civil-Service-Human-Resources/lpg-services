
import * as express from 'express'
import {ResourceNotFoundError} from 'lib/exception/ResourceNotFoundError'
import * as extended from 'lib/extended'
import * as learnerRecord from 'lib/learnerrecord'
import { getLogger } from 'lib/logger'
import {cancelEventBooking} from 'lib/service/cslService/cslServiceClient'
import {CancelBookingDto} from 'lib/service/cslService/models/CancelBookingDto'
import * as template from 'lib/ui/template'
import {SessionFlash} from 'lib/utils/SessionUtils'

import { confirmedMessage, recordCheck } from './booking'

const logger = getLogger('controllers/booking/cancel')

export async function renderCancelBookingPage(
	ireq: express.Request,
	res: express.Response,
	next: express.NextFunction
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

	await learnerRecord.getCancellationReasons(req.user)
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
			bookingTitle: module.title || course.title,
			message,
		})
	)
}

export async function tryCancelBooking(req: express.Request, res: express.Response) {
	const courseId = req.params.courseId
	const moduleId = req.params.moduleId
	const eventId = req.params.eventId

	logger.info(`User ${req.user.id} attempting to cancel event ${eventId}`)

	const cancelReason: string = req.body['cancel-reason']

	let sessionFlash: SessionFlash
	let redirectUrl = `/book/${courseId}/${moduleId}/${eventId}/cancelled`

	if (cancelReason !== undefined) {
		try {
			await cancelEventBooking(courseId, moduleId, eventId, req.user, new CancelBookingDto(cancelReason))
		} catch (e) {
			if (e instanceof ResourceNotFoundError) {
				sessionFlash = {
					event: 'cancelBookingError',
					message: 'The booking could not be found.',
				}
			} else {
				sessionFlash = {
					event: 'cancelBookingError',
					message: 'An error occurred while trying to cancel your booking.',
				}
			}
			redirectUrl = `/book/${courseId}/${moduleId}/${eventId}/cancel`
		}
	}  else {
		sessionFlash = {
			event: 'cancelBookingError',
			message: 'Please select a reason for cancelling your booking.',
		}
		redirectUrl = `/book/${courseId}/${moduleId}/${eventId}/cancel`
	}

	req.session!.save(() => {
		if (sessionFlash !== undefined) {
			req.flash(sessionFlash.event, sessionFlash.message)
		}
		res.redirect(redirectUrl)
	})
}

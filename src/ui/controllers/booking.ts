import * as express from 'express'
import * as dateTime from 'lib/datetime'
import * as extended from 'lib/extended'
import * as learnerRecord from 'lib/learnerrecord'
import * as notify from 'lib/service/notify'
import * as template from 'lib/ui/template'
import * as xapi from 'lib/xapi'
import * as log4js from 'log4js'
import * as courseController from './course/index'

const logger = log4js.getLogger('controllers/booking')

interface BookingBreadcrumb {
	url: string
	name: string
}

enum confirmedMessage {
	Booked = 'Booked',
	Cancelled = 'Cancelled',
}

enum BookingStep {
	ChooseDate = 3,
	EnterPaymentDetails = 4,
	Confirm = 5,
}

function getBreadcrumbs(
	ireq: express.Request,
	step: number
): BookingBreadcrumb[] {
	const req = ireq as extended.CourseRequest

	const course = req.course
	const module = req.module!
	const event = req.event

	const allBreadcrumbs: BookingBreadcrumb[] = [
		{
			name: 'Home',
			url: '/',
		},
		{
			name: module.title || course.title,
			url: `/courses/${course.id}`,
		},
		{
			name: 'Choose Date',
			url: `/book/${course.id}/${module.id}/choose-date?eventId=${
				event ? event.id : ''
			}`,
		},
		{
			name: 'Payment Options',
			url: `/book/${course.id}/${module ? module.id : ''}/${
				event ? event.id : ''
			}`,
		},
		{
			name: 'Confirm details',
			url: `/book/${course.id}/${module ? module.id : ''}/${
				event ? event.id : ''
			}/confirm`,
		},
	]
	return allBreadcrumbs.slice(0, step)
}

export function enteredPaymentDetails(
	req: express.Request,
	res: express.Response
) {
	const session = req.session!

	if (req.body['purchase-order'] && /\S/.test(req.body['purchase-order'])) {
		session.po = req.body['purchase-order']
		session.save(() => {
			res.redirect(`${req.originalUrl}/confirm`)
		})
	} else if (
		req.body['financial-approver'] &&
		/^\S+@\S+$/.test(req.body['financial-approver'])
	) {
		session.fap = req.body['financial-approver']
		session.save(() => {
			res.redirect(`${req.originalUrl}/confirm`)
		})
	} else {
		res.send(
			template.render('booking/payment-options', req, {
				breadcrumbs: getBreadcrumbs(req, BookingStep.EnterPaymentDetails),
				paymentOptionsFailed: true,
			})
		)
	}
}

export async function renderCancelBookingPage(
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

	res.send(
		template.render('booking/cancel-booking', req, {
			cancelBookingFailed: false,
			course,
			event,
			module,
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
	const moduleRecord = record.modules.find(rm => rm.moduleId === module.id && rm.eventId === event.id)
	if (!moduleRecord || moduleRecord.state !== 'UNREGISTERED') {
		res.redirect(`/book/${course.id}/${module.id}/cancel`)
	} else {
		res.send(
			template.render('booking/confirmed', req, {
				course,
				event,
				message: confirmedMessage.Cancelled,
				module,
			})
		)
	}
}

export function renderChooseDate(ireq: express.Request, res: express.Response) {
	const req = ireq as extended.CourseRequest

	const course = req.course
	const module = req.module!
	const selectedEventId = req.query.eventId

	if (!selectedEventId && req.session) {
		delete req.session!.po
		delete req.session!.fap
	}

	const today = new Date()

	const events = (module.events || [])
		.filter(a => a.date > today)
		.sort((a, b) => a.date.getTime() - b.date.getTime())

	res.send(
		template.render('booking/choose-date', req, {
			breadcrumbs: getBreadcrumbs(req, BookingStep.ChooseDate),
			course,
			courseDetails: courseController.getCourseDetails(req, course, module),
			events,
			module,
			selectedEventId,
		})
	)
}

export async function renderConfirmPayment(
	ireq: express.Request,
	res: express.Response
) {
	const req = ireq as extended.CourseRequest

	const course = req.course
	const module = req.module!
	const event = req.event!

	const session = req.session!

	res.send(
		template.render('booking/confirm-booking', req, {
			breadcrumbs: getBreadcrumbs(req, BookingStep.Confirm),
			course,
			courseDetails: courseController.getCourseDetails(req, course, module),
			event,
			fap: session.fap,
			module,
			po: session.po,
		})
	)
}

export function renderPaymentOptions(
	req: express.Request,
	res: express.Response
) {
	const session = req.session!

	res.send(
		template.render('booking/payment-options', req, {
			breadcrumbs: getBreadcrumbs(req, BookingStep.EnterPaymentDetails),
			previouslyEntered: session.po || session.fap,
		})
	)
}

export function selectedDate(req: express.Request, res: express.Response) {
	const selected = req.body['selected-date']
	res.redirect(
		`/book/${req.params.courseId}/${req.params.moduleId}/${selected}`
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

	if (req.body['cancel-tc']) {
		await xapi.record(
			req,
			course,
			xapi.Verb.Unregistered,
			undefined,
			module,
			event
		)
		await notify.bookingCancelled({
			courseDate: dateTime.formatDate(event.date),
			courseTitle: module.title || course.title,
			email: req.user.emailAddress,
			name: req.user.givenName || req.user.emailAddress,
		})
		res.redirect(`/book/${course.id}/${module.id}/${event.id}/cancelled`)
	} else {
		res.send(
			template.render('booking/cancel-booking', req, {
				cancelBookingFailed: true,
				course,
				event,
				module,
			})
		)
	}
}

export async function tryCompleteBooking(
	ireq: express.Request,
	res: express.Response
) {
	const req = ireq as extended.CourseRequest
	const course = req.course
	const module = req.module!
	const event = req.event!
	const session = req.session!

	const extensions: Record<string, any> = {}
	let paymentOption = '-'

	if (session.po) {
		extensions[xapi.Extension.PurchaseOrder] = session.po
		paymentOption = `Purchase Order: ${session.po}`
	}
	if (session.fap) {
		extensions[xapi.Extension.FinancialApprover] = session.fap
		paymentOption = `Financial Approver: ${session.fap}`
	}

	await xapi.record(
		req,
		course,
		xapi.Verb.Registered,
		extensions,
		module,
		event
	)

	await notify.bookingConfirmed({
		accessibility: '-',
		courseDate: dateTime.formatDate(event.date),
		courseTitle: module.title || course.title,
		email: req.user.emailAddress,
		name: req.user.givenName || req.user.emailAddress,
		paymentOption,
	})

	res.send(
		template.render('booking/confirmed', req, {
			course,
			event,
			message: confirmedMessage.Booked,
			module,
		})
	)
}

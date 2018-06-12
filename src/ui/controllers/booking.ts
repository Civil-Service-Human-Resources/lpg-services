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
		template.render('booking/cancel-booking', req, res, {
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
	const moduleRecord = record.modules.find(
		rm => rm.moduleId === module.id && rm.eventId === event.id
	)
	if (!moduleRecord || moduleRecord.state !== 'UNREGISTERED') {
		res.redirect(`/book/${course.id}/${module.id}/cancel`)
	} else {
		res.send(
			template.render('booking/confirmed', req, res, {
				course,
				event,
				message: confirmedMessage.Cancelled,
				module,
			})
		)
	}
}

export function saveAccessibilityOptions(
	req: express.Request,
	res: express.Response
) {
	if (Array.isArray(req.body.accessibilityreqs)) {
		req.session!.accessibilityReqs = [...req.body.accessibilityreqs]
	} else {
		req.session!.accessibilityReqs = [req.body.accessibilityreqs]
	}
	const eventId = req.body['selected-date']

	if (eventId || req.session!.selectedEventId) {
		res.redirect(
			`/book/${req.params.courseId}/${req.params.moduleId}/choose-date/?tab=${
				req.query.tab
			}&eventId=${eventId ? eventId : req.session!.selectedEventId}`
		)
	} else {
		res.redirect(
			`/book/${req.params.courseId}/${req.params.moduleId}/choose-date?tab=${
				req.query.tab
			}`
		)
	}
}

export async function renderChooseDate(
	ireq: express.Request,
	res: express.Response
) {
	const req = ireq as extended.CourseRequest

	const tab = req.query.tab

	const course = req.course
	const module = req.module!

	let selectedEventId: string = req.flash('bookingSelected')[0]

	if (req.query.accessibility === 'true') {
		req.flash('booking', 'showAccessibility')
		req.flash('bookingSelected', selectedEventId)

		if (req.query.ref === 'confirmation') {
			req.flash('booking', 'showAccessibility')
			req.flash('bookingSelected', req.session!.selectedEventId)
		}

		req.session!.save(() => {
			res.redirect(
				`/book/${req.params.courseId}/${req.params.moduleId}/choose-date`
			)
		})
		return
	}

	if (!selectedEventId) {
		selectedEventId = req.query.eventId
		if (req.session!.selectedEventId) {
			req.session!.selectedEventId = selectedEventId
		}
	}

	if (!selectedEventId && req.session) {
		delete req.session!.po
		delete req.session!.fap
		delete req.session!.accessibilityReqs
	}

	const today = new Date()

	const events = (module.events || [])
		.filter(a => a.date > today)
		.sort((a, b) => a.date.getTime() - b.date.getTime())

	const registrations = await learnerRecord.getRegistrationsForEvents(
		events.map((event: any) => {
			return event.id
		}),
		req.user
	)

	events.map((event: any) => {
		event.availability = event.capacity - registrations[event.id]
	})

	res.send(
		template.render('booking/choose-date', req, res, {
			accessibilityReqs: req.session!.accessibilityReqs,
			breadcrumbs: getBreadcrumbs(req, BookingStep.ChooseDate),
			course,
			courseDetails: courseController.getCourseDetails(req, course, module),
			errorMessage: req.flash('errorMessage')[0],
			errorTitle: req.flash('errorTitle')[0],
			events,
			module,
			selectedEventId,
			showAccessibility: req.flash('booking')[0],
			tab,
		})
	)
}

export function selectedDate(req: express.Request, res: express.Response) {
	const selected = req.body['selected-date']
	if (req.query.accessibility === 'true') {
		req.flash('booking', 'showAccessibility')
		req.flash('bookingSelected', selected)

		req.session!.save(() => {
			res.redirect(
				`/book/${req.params.courseId}/${req.params.moduleId}/choose-date`
			)
		})
		return
	}

	if (Array.isArray(req.body.accessibilityreqs)) {
		req.session!.accessibilityReqs = [...req.body.accessibilityreqs]
	} else {
		req.session!.accessibilityReqs = [req.body.accessibilityreqs]
	}

	if (!selected) {
		req.flash('errorTitle', 'booking_must_select_date_title')
		req.flash('errorMessage', 'booking_must_select_date_message')
		req.session!.save(() => {
			res.redirect(
				`/book/${req.params.courseId}/${req.params.moduleId}/choose-date`
			)
		})
	} else {
		req.session!.selectedEventId = selected
		console.log(req.session!.selectedEventId)
		req.session!.save(() => {
			res.redirect(
				`/book/${req.params.courseId}/${
					req.params.moduleId
				}/${decodeURIComponent(selected)}`
			)
		})
	}
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
		template.render('booking/confirm-booking', req, res, {
			accessibilityReqs: session.accessibilityReqs,
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
		template.render('booking/payment-options', req, res, {
			breadcrumbs: getBreadcrumbs(req, BookingStep.EnterPaymentDetails),
			fapErrors: req.flash('fapErrors'),
			poErrors: req.flash('purchaseOrderErrors'),
			previouslyEntered: session.po || session.fap,
		})
	)
}

export function validatePurchaseOrder(po: string): string[] {
	const errors: string[] = []
	const trimmed = po.trim()

	if (!trimmed.length) {
		errors.push('errors.po-empty')
	}

	if (trimmed.length < 3 && trimmed.length) {
		errors.push('errors.po-too-short')
	}

	if (trimmed.length >= 20) {
		errors.push('errors.po-too-long')
	}

	if (trimmed.match(/[#;.%]/)) {
		errors.push('errors.po-special-characters')
	}

	return errors
}

export function enteredPaymentDetails(
	req: express.Request,
	res: express.Response
) {
	const session = req.session!
	const poErrors = validatePurchaseOrder(req.body['purchase-order'])

	if (poErrors) {
		poErrors.map((error: string) => {
			req.flash('purchaseOrderErrors', req.__(error))
		})
		session.save(() => {
			res.redirect(`${req.originalUrl}/confirm`)
		})
		return
	} else {
		session.po = req.body['purchase-order']
		session.save(() => {
			res.redirect(`${req.originalUrl}/confirm`)
		})
	}

	//TODO: REF LPFG-315 Financial approver booking flow was not updated
	if (
		req.body['financial-approver'] &&
		/^\S+@\S+$/.test(req.body['financial-approver'])
	) {
		session.fap = req.body['financial-approver']
		session.save(() => {
			res.redirect(`${req.originalUrl}/confirm`)
		})
	} else {
		req.flash('fapErrors', 'Not valid email address')
		session.save(() => {
			res.redirect(`${req.originalUrl}`)
		})
		return
	}
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
			template.render('booking/cancel-booking', req, res, {
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
	const accessibilityArray: string[] = []
	for (const i in session.accessibilityReqs) {
		if (i) {
			const requirement = session.accessibilityReqs[i]
			if (requirement === 'other') {
				accessibilityArray.push('Other')
			} else {
				accessibilityArray.push(
					res.__(`accessibility-requirements`)[requirement]
				)
			}
		}
	}

	//TODO: LPFG-315 add line manager and eventId here?
	await notify.bookingConfirmed({
		accessibility: accessibilityArray.join(', '),
		courseDate: dateTime.formatDate(event.date),
		courseTitle: module.title || course.title,
		email: req.user.userName,
		name: req.user.givenName || req.user.userName,
		paymentOption,
	})

	res.send(
		template.render('booking/confirmed', req, res, {
			course,
			event,
			message: confirmedMessage.Booked,
			module,
		})
	)
}

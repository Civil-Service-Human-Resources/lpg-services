import * as express from 'express'
import * as config from "lib/config"
import * as dateTime from 'lib/datetime'
import * as extended from 'lib/extended'
import * as learnerRecord from 'lib/learnerrecord'
import * as model from 'lib/model'
import * as purchaseOrdersService from 'lib/purchase-orders'
import * as registry from 'lib/registry'
import * as notify from 'lib/service/notify'
import * as template from 'lib/ui/template'
import * as xapi from 'lib/xapi'

import * as courseController from '../course/index'

import * as log4js from 'log4js'

const logger = log4js.getLogger('controllers/booking')

export enum confirmedMessage {
	Booked = 'Booked',
	Cancelled = 'Cancelled',
	NotFound = 'NotFound',
}

export function recordCheck(
	record: learnerRecord.CourseRecord | null,
	ireq: express.Request
) {
	const req = ireq as extended.CourseRequest

	if (!record) {
		logger.warn(
			`Attempt to cancel a booking when not registered. user: ${
				req.user.id
			}, course: ${req.course.id}, module: ${req.module!.id}, event: ${
				req.event!.id
			}`
		)

		return false
	} else {
		return true
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

	let selectedEventId: string =
		req.flash('bookingSelected')[0] || req.session!.selectedEventId || null

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
		delete req.session!.payment
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
			course,
			courseDetails: courseController.getCourseDetails(req, course, module),
			event,
			module,
			payment: session.payment,
		})
	)
}

export async function renderOuch(
	ireq: express.Request,
	res: express.Response
) {
	const req = ireq as extended.CourseRequest
	console.log("reached")
	res.send(
		template.render('booking/ouch', req, res, {})
	)
}

export async function renderPaymentOptions(
	ireq: express.Request,
	res: express.Response
) {
	const req = ireq as extended.CourseRequest
	const session = req.session!
	const module = req.module!

	const user = req.user as model.User
	const callOffPo = await purchaseOrdersService.findPurchaseOrder(user, module.id)

	if (callOffPo) {
		session.payment = {
			type: 'PURCHASE_ORDER',
			value: `Call off: ${callOffPo.id}`,
		}
		session.save(() => {
			res.redirect(`${req.originalUrl}/confirm`)
		})
	} else {
		const organisation = await registry.follow(config.REGISTRY_SERVICE_URL,
			['organisations', 'search', 'findByDepartmentCode'],
			{ departmentCode: user.department }) as any

		if (!organisation) {
			res.redirect('/profile')
		} else {
			res.send(
				template.render('booking/payment-options', req, res, {
					errors: req.flash('errors'),
					paymentMethods: organisation.department.paymentMethods,
					values: req.flash('values')[0] || (session.payment ? { [session.payment.type]: session.payment.value } : {}),
				})
			)
		}
	}

}

export async function enteredPaymentDetails(
	req: express.Request,
	res: express.Response
) {
	const session = req.session!
	session.payment = null

	const user = req.user as model.User
	const organisation = await registry.follow(config.REGISTRY_SERVICE_URL,
		['organisations', 'search', 'findByDepartmentCode'],
		{ departmentCode: user.department }) as any

	let errors: string[] = []

	for (const paymentMethod of organisation.department.paymentMethods) {
		if (req.body[paymentMethod]) {
			errors = validate(paymentMethod, req.body[paymentMethod])
			if (!errors.length) {
				session.payment = {
					type: paymentMethod,
					value: req.body[paymentMethod].trim(),
				}
			}
			break
		}
	}

	if (!session.payment && !errors.length) {
		errors.push('errors.empty-payment-method')
	}

	if (errors.length) {
		errors.map((error: string) => {
			req.flash('errors', req.__(error))
		})
		req.flash('values', req.body)
		session.save(() => {
			res.redirect(`${req.originalUrl}`)
		})
	} else {
		session.save(() => {
			res.redirect(`${req.originalUrl}/confirm`)
		})
	}
}

export function validate(type: string, po: string): string[] {
	const errors: string[] = []
	const trimmed = po.trim()

	switch (type) {
		case 'PURCHASE_ORDER':
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
			break
		case 'FINANCIAL_APPROVER':
			if (!/^\S+@\S+$/.test(trimmed)) {
				errors.push('errors.invalid-email-address')
			}
			break
		default:
			errors.push('errors.unrecognised-payment-type')
	}
	return errors
}

export async function trySkipBooking(
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

	await xapi.record(req, course, xapi.Verb.Skipped, undefined, module, event)

	req.flash('successTitle', req.__('learning_skipped_title', req.course.title))
	req.flash(
		'successMessage',
		req.__('learning_skipped_from_plan_message', req.course.title)
	)
	req.session!.save(() => {
		res.redirect('/')
	})
}

export async function tryMoveBooking(
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

	await xapi.record(req, course, xapi.Verb.Completed, undefined, module, event)

	req.session!.save(() => {
		res.redirect('/')
	})
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
	const paymentOption = `${session.payment.type}: ${session.payment.value}`

	const extensions: Record<string, any> = {
		[xapi.Extension.Payment]: paymentOption,
	}

	await xapi
		.record(req, course, xapi.Verb.Registered, extensions, module, event)
		.catch((e: Error) => {
			logger.error('Error with XAPI', e)
		})

	logger.debug(
		'XAPI successfully recorded REGISTERED verb against:',
		`user:${req.user}`,
		`event: ${event.id}`
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
	const error = await notify
		.bookingRequested({
			accessibility: accessibilityArray.join(', '),
			bookingReference: `${req.user.id}-${event.id}`,
			cost: module.price,
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
			eventId: event.id,
			learnerName: req.user.givenName || req.user.userName,
			lineManager: req.user.lineManager,
			location: event.location,
			paymentOption,
		})
		.catch((e: Error) => {
			logger.error('There was an error with GOV Notify', e)
			res.redirect('/book/ouch')
			return true
		})

	if (!error) {
		delete req.session!.payment
		delete req.session!.accessibilityReqs
		delete req.session!.selectedEventId

		res.send(
			template.render('booking/confirmed', req, res, {
				course,
				event,
				message: confirmedMessage.Booked,
				module,
			})
		)
	}
}

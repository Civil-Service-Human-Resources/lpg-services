import _ = require('lodash')

import * as express from 'express'
import * as extended from 'lib/extended'
import * as learnerRecord from 'lib/learnerrecord'
import * as model from 'lib/model'
import * as template from 'lib/ui/template'
import * as xapi from 'lib/xapi'

import * as courseController from '../course/index'

import * as log4js from 'log4js'

const logger = log4js.getLogger('controllers/booking')
const PURCHASE_ORDER: string = 'PURCHASE_ORDER'

export enum confirmedMessage {
	Booked = 'Booked',
	Cancelled = 'Cancelled',
	Error = 'Error',
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
	ireq: express.Request,
	res: express.Response
) {
	const session = ireq.session!
	const req = ireq as extended.CourseRequest

	if (Array.isArray(ireq.body.accessibilityreqs)) {
		session.accessibilityReqs = ireq.body.accessibilityreqs
	} else {
		session.accessibilityReqs = [ireq.body.accessibilityreqs]
	}

	session.otherAccessibilityReqs = ireq.body.otherDescription || ''
	if (
		(session.accessibilityReqs.indexOf('other') > -1 ||
			ireq.body.otherDescription) &&
		session.accessibilityReqs.indexOf('other') === -1
	) {
		session.accessibilityReqs.push('other')
	}

	let {returnTo} = ireq.session!
	if (returnTo) {
		delete ireq.session!.returnTo
	} else if (req.module!.cost === 0) {
		session.payment = {
			type: '',
			value: '',
		}
		returnTo = `/book/${ireq.params.courseId}/${ireq.params.moduleId}/${
			ireq.params.eventId
		}/confirm`
	} else {
		returnTo = `/book/${ireq.params.courseId}/${ireq.params.moduleId}/${
			ireq.session!.selectedEventId
		}/payment`
	}
	ireq.session!.save(() => {
		res.redirect(returnTo)
	})
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

	if (!selectedEventId) {
		// @ts-ignore
		selectedEventId = req.query.eventId
		if (req.session!.selectedEventId) {
			req.session!.selectedEventId = selectedEventId
		}
		delete req.session!.payment
		delete req.session!.accessibilityReqs
		delete req.session!.otherAccessibilityReqs
	}

	if (req.query.ref === 'summary') {
		req.session!.returnTo = `/book/${course.id}/${
			module.id
		}/${selectedEventId}/confirm`
	}

	const today = new Date()

	const events = (module.events || [])
		.filter(a => a.startDate > today)
		.sort((a, b) => a.startDate.getTime() - b.startDate.getTime())

	for (const event of events) {
		await learnerRecord.getActiveBooking(event.id, req.user)
			.then(e => {
				if (e.status === 200) {
					event.isLearnerBooked = true
				} else {
					event.isLearnerBooked = false
				}

				event.dateRanges.sort(function compare(a, b) {
					const dateA = new Date(_.get(a, 'date', ''))
					const dateB = new Date(_.get(b, 'date', ''))
					// @ts-ignore
					return dateA - dateB
				})
			})
			.catch(error => logger.error(error))
	}

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
		let {returnTo} = req.session!
		if (returnTo) {
			delete req.session!.returnTo
		} else {
			returnTo = `/book/${req.params.courseId}/${
				req.params.moduleId
			}/${decodeURIComponent(selected)}/accessibility`
		}
		req.session!.selectedEventId = selected
		req.session!.save(() => {
			res.redirect(returnTo)
		})
	}
}

export async function renderAccessibilityOptions(
	ireq: express.Request,
	res: express.Response
) {
	const req = ireq as extended.CourseRequest

	const course = req.course
	const module = req.module!
	const event = req.event!
	const session = req.session!

	if (req.query.ref === 'summary') {
		session.returnTo = `/book/${req.params.courseId}/${req.params.moduleId}/${
			req.params.eventId
		}/confirm`
	}

	res.send(
		template.render('booking/accessibility', req, res, {
			accessibilityReqs: session.accessibilityReqs,
			course,
			event,
			module,
			otherAccessibilityReqs: session.otherAccessibilityReqs,
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

	event.dateRanges.sort(function compare(a, b) {
		const dateA = new Date(_.get(a, 'date', ''))
		const dateB = new Date(_.get(b, 'date', ''))
		// @ts-ignore
		return dateA - dateB
	})

	const accessibilityReqs = [...session.accessibilityReqs]
	if (accessibilityReqs.indexOf('other') > -1) {
		accessibilityReqs[
			accessibilityReqs.indexOf('other')
		] = `Other: ${session.otherAccessibilityReqs || ''}`
	}

	res.send(
		template.render('booking/summary', req, res, {
			accessibilityReqs,
			course,
			courseDetails: courseController.getCourseDetails(req, course, module),
			event,
			module,
			payment: session.payment,
		})
	)
}

export async function renderOuch(ireq: express.Request, res: express.Response) {
	const req = ireq as extended.CourseRequest
	res.send(template.render('booking/ouch', req, res, {}))
}

export async function renderPaymentOptions(
	ireq: express.Request,
	res: express.Response
) {
	const req = ireq as extended.CourseRequest
	const session = req.session!
	const module = req.module!

	const user = req.user as model.User

	if (!user.department || !user.lineManager) {
		res.redirect('/profile')
	} else {
		res.send(
			template.render('booking/payment-options', req, res, {
				course: req.course!,
				errors: req.flash('errors'),
				event: req.event!,
				module,
				values:
					req.flash('values')[0] ||
					(session.payment
						? {[session.payment.type]: session.payment.value}
						: {}),
			})
		)
	}
}

export async function enteredPaymentDetails(
	req: express.Request,
	res: express.Response
) {
	const session = req.session!
	session.payment = null
	let errors: string[] = []
	if (req.body[PURCHASE_ORDER]) {
		errors = validate(PURCHASE_ORDER, req.body[PURCHASE_ORDER])
		if (!errors.length) {
			session.payment = {
				type: PURCHASE_ORDER,
				value: req.body[PURCHASE_ORDER].trim(),
			}
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
			const confirmPage =
				session.payment.type === PURCHASE_ORDER
					? 'payment/confirm-po'
					: 'confirm'
			res.redirect(
				`/book/${req.params.courseId}/${req.params.moduleId}/${
					req.params.eventId
				}/${confirmPage}`
			)
		})
	}
}

export function validate(type: string, po: string): string[] {
	const errors: string[] = []
	const trimmed = po.trim()

	switch (type) {
		case PURCHASE_ORDER:
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

export function renderConfirmPo(ireq: express.Request, res: express.Response) {
	const req = ireq as extended.CourseRequest
	res.send(
		template.render('booking/confirm-po', req, res, {
			course: req.course,
			event: req.event!,
			module: req.module!,
			po: ireq.session!.po,
			url: `/book/${ireq.params.courseId}/${ireq.params.moduleId}/${
				ireq.params.eventId
			}`,
		})
	)
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

	const accessibilityArray: string[] = []
	for (const i in session.accessibilityReqs) {
		if (i) {
			const requirement = session.accessibilityReqs[i]
			if (requirement === 'other') {
				accessibilityArray.push(session.otherAccessibilityReqs)
			} else {
				accessibilityArray.push(
					res.__(`accessibility-requirements`)[requirement]
				)
			}
		}
	}

	const accessibilityOptions = accessibilityArray.join(', ')
	const response = await learnerRecord.bookEvent(
		course,
		module,
		event,
		req.user,
		session.payment.value,
		accessibilityOptions
	)

	let message

	if (response.status === 201) {
		logger.debug(
			'Successfully booked event in learner record',
			`user:${req.user}`,
			`event: ${event.id}`,
			`response: ${response.status}`
		)

		message = confirmedMessage.Booked
	} else {
		message = confirmedMessage.Error
	}

	delete req.session!.payment
	delete req.session!.accessibilityReqs
	delete req.session!.otherAccessibilityReqs
	delete req.session!.selectedEventId

	res.send(
		template.render('booking/confirmed', req, res, {
			course,
			event,
			message,
			module,
		})
	)
}

import _ = require('lodash')

import * as express from 'express'
import {ResourceNotFoundError} from '../../../lib/exception/ResourceNotFoundError'
import * as extended from '../../../lib/extended'
import * as learnerRecord from '../../../lib/learnerrecord'
import {getLogger} from '../../../lib/logger'
import {bookEvent, completeEventBooking, skipEventBooking} from '../../../lib/service/cslService/cslServiceClient'
import {getCourse} from '../../../lib/service/catalog/courseCatalogueClient'
import {BookEventDto} from '../../../lib/service/cslService/models/BookEventDto'
import * as template from '../../../lib/ui/template'

const logger = getLogger('controllers/booking')
const PURCHASE_ORDER: string = 'PURCHASE_ORDER'

export enum confirmedMessage {
	Booked = 'Booked',
	Cancelled = 'Cancelled',
	Error = 'Error',
}

export function saveAccessibilityOptions(ireq: express.Request, res: express.Response) {
	const session = ireq.session!
	const req = ireq as extended.CourseRequest

	const requirements: string[] = []

	if (ireq.body.accessibilityreqs !== undefined) {
		if (Array.isArray(ireq.body.accessibilityreqs)) {
			requirements.push(...ireq.body.accessibilityreqs)
		} else {
			requirements.push(ireq.body.accessibilityreqs)
		}
	}

	session.accessibilityReqs = requirements
	session.otherAccessibilityReqs = ireq.body.otherDescription || ''

	let {returnTo} = ireq.session!
	if (returnTo) {
		delete ireq.session!.returnTo
	} else if (req.module!.cost === 0) {
		session.payment = {
			type: '',
			value: '',
		}
		returnTo = `/book/${ireq.params.courseId}/${ireq.params.moduleId}/${ireq.params.eventId}/confirm`
	} else {
		returnTo = `/book/${ireq.params.courseId}/${ireq.params.moduleId}/${ireq.session!.selectedEventId}/payment`
	}
	ireq.session!.save(() => {
		res.redirect(returnTo)
	})
}

export async function renderChooseDate(req: express.Request, res: express.Response) {
	const course = await getCourse(req.params.bookingCourseId, req.user, true)
	let module
	if (course) {
		module = course.getModule(req.params.bookingModuleId)
	}

	if (module === undefined || course === null) {
		return res.sendStatus(404)
	}

	const tab = req.query.tab

	let selectedEventId: string = req.flash('bookingSelected')[0] || req.session!.selectedEventId || null

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
		req.session!.returnTo = `/book/${course.id}/${module.id}/${selectedEventId}/confirm`
	}

	const events = (module.events || [])
		.filter(a => a.isBookable())
		.sort((a, b) => a.startDate.getTime() - b.startDate.getTime())

	if (events.length === 0) {
		return res.redirect(`/courses/${course.id}`)
	}

	for (const event of events) {
		await learnerRecord
			.getActiveBooking(event.id, req.user)
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
			res.redirect(`/book/${req.params.courseId}/${req.params.moduleId}/choose-date`)
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
			res.redirect(`/book/${req.params.courseId}/${req.params.moduleId}/choose-date`)
		})
	} else {
		let {returnTo} = req.session!
		if (returnTo) {
			delete req.session!.returnTo
		} else {
			returnTo = `/book/${req.params.courseId}/${req.params.moduleId}/${decodeURIComponent(selected)}/accessibility`
		}
		req.session!.selectedEventId = selected
		req.session!.save(() => {
			res.redirect(returnTo)
		})
	}
}

export async function renderAccessibilityOptions(ireq: express.Request, res: express.Response) {
	const req = ireq as extended.CourseRequest

	const course = req.course
	const module = req.module!
	const event = req.event!
	const session = req.session!

	if (req.query.ref === 'summary') {
		session.returnTo = `/book/${req.params.courseId}/${req.params.moduleId}/${req.params.eventId}/confirm`
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

export async function renderConfirmPayment(ireq: express.Request, res: express.Response) {
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
		accessibilityReqs[accessibilityReqs.indexOf('other')] = `Other: ${session.otherAccessibilityReqs || ''}`
	}

	res.send(
		template.render('booking/summary', req, res, {
			accessibilityReqs,
			course,
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

export async function renderPaymentOptions(ireq: express.Request, res: express.Response) {
	const req = ireq as extended.CourseRequest
	const session = req.session!
	const module = req.module!
	res.send(
		template.render('booking/payment-options', req, res, {
			course: req.course!,
			errors: req.flash('errors'),
			event: req.event!,
			module,
			values: req.flash('values')[0] || (session.payment ? {[session.payment.type]: session.payment.value} : {}),
		})
	)
}

export async function enteredPaymentDetails(req: express.Request, res: express.Response) {
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
			const confirmPage = session.payment.type === PURCHASE_ORDER ? 'payment/confirm-po' : 'confirm'
			res.redirect(`/book/${req.params.courseId}/${req.params.moduleId}/${req.params.eventId}/${confirmPage}`)
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

export async function trySkipBooking(req: express.Request, res: express.Response) {
	try {
		const response = await skipEventBooking(req.params.courseId, req.params.moduleId, req.params.eventId, req.user)
		req.flash('successTitle', req.__('learning_skipped_title', response.courseTitle))
		req.flash('successMessage', req.__('learning_skipped_from_plan_message', response.courseTitle))
	} catch {
		return res.sendStatus(400)
	}

	req.session!.save(() => {
		res.redirect('/')
	})
}

export async function tryMoveBooking(req: express.Request, res: express.Response) {
	try {
		await completeEventBooking(req.params.courseId, req.params.moduleId, req.params.eventId, req.user)
	} catch {
		return res.sendStatus(400)
	}

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
			url: `/book/${ireq.params.courseId}/${ireq.params.moduleId}/${ireq.params.eventId}`,
		})
	)
}

async function getBookEventDtoFromRequest(req: express.Request, res: express.Response) {
	const session = req.session!
	const accessibilityRequirements: string[] = session.accessibilityReqs || []
	const finalAccessibilityRequirements: string[] = []
	accessibilityRequirements.forEach(requirement => {
		if (requirement === 'other') {
			finalAccessibilityRequirements.push(session.otherAccessibilityReqs)
		} else {
			// @ts-ignore
			finalAccessibilityRequirements.push(res.__(`accessibility-requirements`)[requirement])
		}
	})
	const poNumber = session.payment.value.length === 0 ? undefined : session.payment.value
	return new BookEventDto(finalAccessibilityRequirements, poNumber)
}

export async function tryCompleteBooking(req: express.Request, res: express.Response) {
	const bookEventDto = await getBookEventDtoFromRequest(req, res)
	let message = confirmedMessage.Booked
	let bookingTitle = null

	try {
		const response = await bookEvent(
			req.params.courseId,
			req.params.moduleId,
			req.params.eventId,
			req.user,
			bookEventDto
		)
		bookingTitle = response.moduleTitle
	} catch (e) {
		if (e instanceof ResourceNotFoundError) {
			return res.sendStatus(404)
		} else {
			message = confirmedMessage.Error
		}
	}

	delete req.session!.payment
	delete req.session!.accessibilityReqs
	delete req.session!.otherAccessibilityReqs
	delete req.session!.selectedEventId

	res.send(
		template.render('booking/confirmed', req, res, {
			bookingTitle,
			message,
		})
	)
}

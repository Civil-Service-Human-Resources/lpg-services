import * as express from 'express'
import * as config from 'lib/config'
import * as template from 'lib/ui/template'
import * as courseController from './course/index'
import * as model from 'lib/model'
import * as xapi from 'lib/xapi'
import {Labels} from 'lib/xapi'

export async function renderChooseDate(
	req: express.Request,
	res: express.Response
) {
	const courseId: string = req.params.courseId
	const course: model.Course = req.course

	req.session.bookingSession = {
		bookingProgress: 3,
		bookingStep: 3,
		courseId,
		courseTitle: course.title,
		dateSelected: 0,
	}

	req.session.save(() => {
		const breadcrumbs = getBreadcrumbs(req)
		res.send(
			template.render('booking/choose-date', req, {
				breadcrumbs,
				course,
				courseDetails: courseController.getCourseDetails(req, course),
			})
		)
	})
}

export async function renderPaymentOptions(
	req: express.Request,
	res: express.Response
) {
	req.session.bookingSession.bookingStep = 4

	const breadcrumbs = getBreadcrumbs(req)
	const previouslyEntered = req.session.bookingSession.po
		? req.session.bookingSession.po
		: req.session.bookingSession.fap

	req.session.save(() => {
		res.send(
			template.render('booking/payment-options', req, {
				breadcrumbs,
				previouslyEntered,
			})
		)
	})
}

export function selectedDate(req: express.Request, res: express.Response) {
	const selected = req.body['selected-date']
	req.session.bookingSession.dateSelected = selected

	req.session.save(() => {
		res.redirect(`/book/${req.params.courseId}/${selected}`)
	})
}

export function enteredPaymentDetails(
	req: express.Request,
	res: express.Response
) {
	if (req.body['purchase-order'] && /\S/.test(req.body['purchase-order'])) {
		req.session.bookingSession.po = req.body['purchase-order']
		req.session.save(() => {
			res.redirect(`${req.originalUrl}/confirm`)
		})
	} else if (
		req.body['financial-approver'] &&
		/\S/.test(req.body['financial-approver'])
	) {
		req.session.bookingSession.fap = req.body['financial-approver']
		req.session.save(() => {
			res.redirect(`${req.originalUrl}/confirm`)
		})
	} else {
		res.send(
			template.render('booking/payment-options', req, {
				breadcrumbs: getBreadcrumbs(req),
				paymentOptionsFailed: true,
			})
		)
	}
}

export async function renderConfirmPayment(
	req: express.Request,
	res: express.Response
) {
	req.session.bookingSession.bookingStep = 5
	const course = req.course
	const dateSelected =
		course.availability[req.session.bookingSession.dateSelected]

	await xapi.send({
		actor: {
			mbox: `mailto:noone@cslearning.gov.uk`,
			name: req.user.id,
			objectType: 'Agent',
		},
		object: {
			definition: {
				type: 'http://adlnet.gov/expapi/activities/event',
			},
			id: `${config.XAPI.activityBaseUri}/${course.uid}/${dateSelected}`,
			objectType: 'Activity',
		},
		result: {
			po: req.session.bookingSession.po,
			fap: req.session.bookingSession.fap,
		},
		verb: {
			display: {
				en: xapi.Labels[xapi.Verb.Registered],
			},
			id: xapi.Verb.Registered,
		},
	})

	req.session.save(() => {
		res.send(
			template.render('booking/confirm-booking', req, {
				breadcrumbs: getBreadcrumbs(req),
				course,
				courseDetails: courseController.getCourseDetails(req, course),
				dateSelected,
			})
		)
	})
}

export async function tryCompleteBooking(
	req: express.Request,
	res: express.Response
) {
	req.session.bookingSession.bookingStep = 6

	req.session.save(() => {
		res.send(template.render('booking/confirmed', req))
	})
}

interface BookingBreadcrumb {
	url: string
	name: string
}

function getBreadcrumbs(req: express.Request): BookingBreadcrumb[] {
	const session = req.session.bookingSession
	const allBreadcrumbs: BookingBreadcrumb[] = [
		{
			name: 'home',
			url: req.baseUrl,
		},
		{
			name: session.courseTitle,
			url: '/courses/' + session.courseId,
		},
		{
			name: 'Choose Date',
			url: `/book/${session.courseId}/choose-date`,
		},
		{
			name: 'Payment Options',
			url: `/book/${session.courseId}/${session.dateSelected}`,
		},
		{
			name: 'Confirm details',
			url: `/book/${session.courseId}/${session.dateSelected}/confirm`,
		},
	]
	return allBreadcrumbs.slice(0, session.bookingStep)
}

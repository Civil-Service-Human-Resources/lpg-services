import * as express from 'express'
import * as template from 'lib/ui/template'
import * as courseController from './course/index'
import * as catalog from 'lib/service/catalog'
import * as model from 'lib/model'
import * as dateTime from 'lib/datetime'

export async function renderBookableCourseInformation(
	req: express.Request,
	res: express.Response
) {
	const courseId: string = req.params.courseId
	const course: model.Course = await catalog.get(courseId)

	let breadcrumbs: BookingBreadcrumb[] = [
		{
			url: req.baseUrl,
			name: 'home',
		},
		{
			url: req.originalUrl,
			name: course.title,
		},
	]

	res.send(
		template.render('booking/bookablecourse', req, {
			course,
			courseDetails: courseController.getCourseDetails(course),
			breadcrumbs: breadcrumbs,
		})
	)
}

export async function renderChooseDate(
	req: express.Request,
	res: express.Response
) {
	const courseId: string = req.params.courseId
	const course: model.Course = await catalog.get(courseId)

	req.session.bookingSession = {
		bookingStep: 3,
		bookingProgress: 3,
		courseTitle: course.title,
		courseId: courseId,
		dateSelected: 0,
	}

	let breadcrumbs = getBreadcrumbs(req)

	res.send(
		template.render('booking/choose-date', req, {
			course,
			courseDetails: courseController.getCourseDetails(course),
			breadcrumbs: breadcrumbs,
		})
	)
}

export async function renderPaymentOptions(
	req: express.Request,
	res: express.Response
) {
	req.session.bookingSession.bookingStep = 4

	let breadcrumbs = getBreadcrumbs(req)

	res.send(
		template.render('booking/payment-options', req, {
			breadcrumbs: breadcrumbs,
		})
	)
}

export function selectedDate(req: express.Request, res: express.Response) {
	const selected = req.body['selected-date']
	req.session.bookingSession.selectedDate = selected
	res.redirect(req.baseUrl + `/book/${req.params.courseId}/${selected}`)
}

export function enteredPaymentDetails(
	req: express.Request,
	res: express.Response
) {
	if (req.body['purchase-order']) {
		req.session.bookingSession.po = req.body['purchase-order']
		res.redirect(`${req.originalUrl}/confirm`)
	} else if (req.body['financial-approver']) {
		req.session.bookingSession.po = req.body['financial-approver']
		res.redirect(`${req.originalUrl}/confirm`)
	}
}

export async function renderConfirmPayment(
	req: express.Request,
	res: express.Response
) {
	req.session.bookingSession.bookingStep = 5

	const course = await catalog.get(req.session.bookingSession.courseId)
	res.send(
		template.render('booking/confirm-booking', req, {
			course,
			courseDetails: courseController.getCourseDetails(course),
			breadcrumbs: getBreadcrumbs(req),
		})
	)
}

export async function tryCompleteBooking(
	req: express.Request,
	res: express.Response
) {
	req.session.bookingSession.bookingStep = 6

	res.send(template.render('booking/confirmed', req))
}

interface BookingBreadcrumb {
	url: string
	name: string
}

function getBreadcrumbs(req: express.Request): BookingBreadcrumb[] {
	let session = req.session.bookingSession
	const allBreadcrumbs: BookingBreadcrumb[] = [
		{
			url: req.baseUrl,
			name: 'home',
		},
		{
			url: req.baseUrl + '/book/' + session.courseId,
			name: session.courseTitle,
		},
		{
			url: `${req.baseUrl}/book/${session.courseId}/choose-date`,
			name: 'Choose Date',
		},
		{
			url: `${req.baseUrl}/book/${session.courseId}/${session.dateSelected}`,
			name: 'Payment Options',
		},
		{
			url: `${req.baseUrl}/book/${session.courseId}/${
				session.dateSelected
			}/confirm`,
			name: 'Confirm details',
		},
	]

	return allBreadcrumbs.slice(0, session.bookingStep)
}

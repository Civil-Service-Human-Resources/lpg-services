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
	}

	console.log(req.session.bookingSession)

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

	console.log('renderPaymentOptions')
	console.log(req.session.bookingSession)

	let breadcrumbs = getBreadcrumbs(req)

	res.send(
		template.render('booking/payment-options', req, {
			breadcrumbs: breadcrumbs,
		})
	)
}

export function selectedDate(req: express.Request, res: express.Response) {
	console.log('selected date')
	req.session.bookingSession.selectedDate = req.body['selected-course']
	const selected = req.body['selected-course']
	res.redirect(req.baseUrl + `/book/${req.params.courseId}/${selected}`)
}

export function enteredPaymentDetails(
	req: express.Request,
	res: express.Response
) {
	if (req.body['purchase-order']) {
		req.session.bookingSession.po = req.body['purchase-order']
		res.redirect(`${req.originalUrl}/confirm`)
	} else {
		req.session.bookingSession.po = req.body['financial-approver']
	}
}

export async function renderConfirmPayment(
	req: express.Request,
	res: express.Response
) {
	req.session.bookingSession.bookingStep = 5
	console.log('render confirm payment')
	console.log(req.session.bookingSession.po)
	const course = await catalog.get(req.session.bookingSession.courseId)
	res.send(
		template.render('booking/confirm-booking', req, {
			course,
			courseDetails: courseController.getCourseDetails(course),
		})
	)
}

export async function tryCompleteBooking(
	req: express.Request,
	res: express.Response
) {
	req.session.bookingSession.bookingStep = 6
	console.log(req.session.bookingSession.bookingStep)
	res.send(template.render('booking/confirmed', req))
}

interface BookingBreadcrumb {
	url: string
	name: string
}

interface BookingData {
	bookingStep: number
	bookingProgress: number
	courseTitle: string
	courseId: string
	dateSelectedId: string
	purchaseOrder?: number
	financialApprover?: string
	breadcrumbs: BookingBreadcrumb[]
}

function getBreadcrumbs(req: express.Request): BookingBreadcrumb[] {
	console.log('breadcrumbs')
	console.log(req.session.bookingSession)
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
			url: `${req.baseUrl}/book/${session.courseId}/${session.dateSelectedId}`,
			name: 'Payment Options',
		},
		{
			url: `${req.baseUrl}/book/${session.courseId}/${
				session.dateSelectedId
			}/confirm`,
			name: 'Confirm details',
		},
	]

	return allBreadcrumbs.slice(0, session.bookingStep)
}

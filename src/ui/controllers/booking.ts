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
	const course: BookableCourse = await catalog.get(courseId)
	course.availability = mockAvailability

	let breadcrumbs: BookingBreadcrumb[] = [
		{
			url: req.baseUrl,
			name: 'home',
		},
		{
			url: req.baseUrl + '/book/' + course.uid,
			name: course.title,
		},
		{
			url: req.originalUrl,
			name: 'Choose Date',
		},
	]

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
	const courseId: string = req.params.courseId
	const course: BookableCourse = await catalog.get(courseId)

	let breadcrumbs: BookingBreadcrumb[] = [
		{
			url: req.baseUrl,
			name: 'home',
		},
		{
			url: req.baseUrl + '/book/' + course.uid,
			name: course.title,
		},
		{
			url: req.baseUrl + /book/ + course.uid + '/choose-date',
			name: 'Choose Date',
		},
		{
			url: req.originalUrl,
			name: 'Payment Options',
		},
	]

	res.send(
		template.render('booking/payment-options', req, {
			course,
			courseDetails: courseController.getCourseDetails(course),
			breadcrumbs: breadcrumbs,
		})
	)
}

export function selectedDate(req: express.Request, res: express.Response) {
	const selected = req.body['selected-course']
	res.redirect(req.baseUrl + `/book/${req.params.courseId}/${selected}`)
}

export function enteredPaymentDetails(
	req: express.Request,
	res: express.Response
) {
	if (req.body['purchase-order']) {
		req.po = req.body['purchase-order']
		res.redirect(`${req.originalUrl}/confirm`)
	} else {
		req.fap = req.body['financial-approver']
	}
}

export async function renderConfirmPayment(
	req: express.Request,
	res: express.Response
) {
	const courseId: string = req.params.courseId
	const course: BookableCourse = await catalog.get(courseId)
	res.send(
		template.render('booking/confirm-booking', req, {
			course,
			courseDetails: courseController.getCourseDetails(course),
		})
	)
}

interface BookingBreadcrumb {
	url: string
	name: string
}

interface BookableCourse extends model.Course {
	availability: [
		{
			date: Date
			uid: string
		}
	]
}

let mockAvailability = [
	{
		dateString: dateTime.formatTime(new Date('2018-02-27T09:30:00')),
		uid: 'auid1',
	},
	{
		dateString: dateTime.formatTime(new Date('2018-03-11T09:30:00')),
		uid: 'auid2',
	},
]

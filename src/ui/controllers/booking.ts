import * as express from 'express'
import * as template from 'lib/ui/template'
import * as courseController from './course/index'
import * as catalog from 'lib/service/catalog'
import * as model from 'lib/model'

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
	const course: model.Course = await catalog.get(courseId)

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
			url: req.originalUrl + /book/,
			name: 'Choose Date',
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

interface BookingBreadcrumb {
	url: string
	name: string
}

interface availability extends model.Course {
	availability: [
		{
			date: Date
			uid: string
		}
	]
}

let mockAvailability: availability = {
	availability: [
		{
			date: 1518796618,
			uid: 'auid1',
		},
		{
			date: 1518796675,
			uid: 'auid2',
		},
	],
}

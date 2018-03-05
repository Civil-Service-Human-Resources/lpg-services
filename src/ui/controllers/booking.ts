import * as express from 'express'
import * as config from 'lib/config'
import * as dateTime from 'lib/datetime'
import * as extended from 'lib/extended'
import * as learnerRecord from 'lib/learnerrecord'
import * as model from 'lib/model'
import * as messaging from 'lib/service/messaging'
import * as template from 'lib/ui/template'
import * as xapi from 'lib/xapi'
import * as courseController from './course/index'

interface BookingBreadcrumb {
	url: string
	name: string
}

enum confirmedMessage {
	Booked = 'Booked',
	Cancelled = 'Cancelled',
}

function getBreadcrumbs(req: express.Request): BookingBreadcrumb[] {
	const session = req.session!.bookingSession
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

export function enteredPaymentDetails(
	req: express.Request,
	res: express.Response
) {
	const session = req.session!
	if (req.body['purchase-order'] && /\S/.test(req.body['purchase-order'])) {
		session.bookingSession.po = req.body['purchase-order']
		session.save(() => {
			res.redirect(`${req.originalUrl}/confirm`)
		})
	} else if (
		req.body['financial-approver'] &&
		/^\S+@\S+$/.test(req.body['financial-approver'])
	) {
		session.bookingSession.fap = req.body['financial-approver']
		session.save(() => {
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

export function renderCancelBookingPage(
	ireq: express.Request,
	res: express.Response
) {
	const req = ireq as extended.CourseRequest
	const course = req.course
	res.send(
		template.render('booking/cancel-booking', req, {
			cancelBookingFailed: false,
			course,
		})
	)
}

export function renderChooseDate(ireq: express.Request, res: express.Response) {
	const req = ireq as extended.CourseRequest
	const courseId: string = req.params.courseId
	const course: model.Course = req.course
	const session = req.session!

	session.bookingSession = {
		bookingProgress: 3,
		bookingStep: 3,
		courseId,
		courseTitle: course.title,
		dateSelected: -1,
	}

	session.save(() => {
		const breadcrumbs = getBreadcrumbs(req)
		const today = new Date()
		const courseAvailability = (course.availability || [])
			.map((availability, i) => ({id: i, date: availability}))
			.filter(availability => availability.date > today)
			.sort((a, b) => a.date.getTime() - b.date.getTime())

		res.send(
			template.render('booking/choose-date', req, {
				breadcrumbs,
				course,
				courseAvailability,
				courseDetails: courseController.getCourseDetails(req, course),
				selectedDate: session.bookingSession.dateSelected,
			})
		)
	})
}

export async function renderConfirmPayment(
	ireq: express.Request,
	res: express.Response
) {
	const req = ireq as extended.CourseRequest
	const session = req.session!
	session.bookingSession.bookingStep = 5
	const course = req.course
	if (!course.availability) {
		res.sendStatus(500)
		return
	}
	const dateSelected = course.availability[session.bookingSession.dateSelected]

	session.save(() => {
		res.send(
			template.render('booking/confirm-booking', req, {
				availabilityUid: session.bookingSession.dateSelected,
				breadcrumbs: getBreadcrumbs(req),
				course,
				courseDetails: courseController.getCourseDetails(req, course),
				dateIndex: session.bookingSession.dateSelected,
				dateSelected,
				fap: session.bookingSession.fap,
				po: session.bookingSession.po,
			})
		)
	})
}

export function renderPaymentOptions(
	req: express.Request,
	res: express.Response
) {
	const session = req.session!
	session.bookingSession.bookingStep = 4

	const breadcrumbs = getBreadcrumbs(req)
	const previouslyEntered = session.bookingSession.po
		? session.bookingSession.po
		: session.bookingSession.fap

	session.save(() => {
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
	const session = req.session!
	session.bookingSession.dateSelected = selected
	session.save(() => {
		res.redirect(`/book/${req.params.courseId}/${selected}`)
	})
}

export async function tryCancelBooking(
	ireq: express.Request,
	res: express.Response
) {
	const req = ireq as extended.CourseRequest
	const course = req.course
	const record = await learnerRecord.getCourseRecord(req.user, course)

	if (!record.selectedDate) {
		res.redirect('/')
		return
	}
	course.selectedDate = record.selectedDate

	if (req.body['cancel-tc']) {
		await xapi.record(req, course, xapi.Verb.Unregistered)
		await messaging.send(
			config.BOOKING_CANCELLED_MSG(
				req.user.givenName,
				course.title,
				req.user.emailAddress,
				dateTime.formatDate(record.selectedDate)
			)
		)

		res.send(
			template.render('booking/confirmed', req, {
				course,
				message: confirmedMessage.Cancelled,
			})
		)
	} else {
		res.send(
			template.render('booking/cancel-booking', req, {
				cancelBookingFailed: true,
				course,
			})
		)
	}
}

export async function tryCompleteBooking(
	ireq: express.Request,
	res: express.Response
) {
	const req = ireq as extended.CourseRequest
	const session = req.session!
	session.bookingSession.bookingStep = 6

	const course = req.course
	if (!course.availability) {
		res.sendStatus(500)
		return
	}

	course.selectedDate = course.availability[session.bookingSession.dateSelected]

	const extensions: Record<string, string> = {}
	if (session.bookingSession.po) {
		extensions[xapi.Extension.PurchaseOrder] = session.bookingSession.po
	}
	if (session.bookingSession.fap) {
		extensions[xapi.Extension.FinancialApprover] = session.bookingSession.fap
	}

	await xapi.send({
		actor: {
			mbox: `mailto:noone@cslearning.gov.uk`,
			name: req.user.id,
			objectType: 'Agent',
		},
		context: {
			contextActivities: {
				parent: {
					id: course.getParentActivityId(),
				},
			},
		},
		object: {
			definition: {
				extensions,
				type: 'http://adlnet.gov/expapi/activities/event',
			},
			id: course.getActivityId(),
			objectType: 'Activity',
		},
		verb: {
			display: {
				en: xapi.Labels[xapi.Verb.Registered],
			},
			id: xapi.Verb.Registered,
		},
	})

	await messaging.send(
		config.BOOKING_COMPLETE_MSG(
			req.user.givenName,
			course.title,
			req.user.emailAddress,
			dateTime.formatDate(course.selectedDate)
		)
	)

	session.save(() => {
		res.send(
			template.render('booking/confirmed', req, {
				course,
				message: confirmedMessage.Booked,
			})
		)
	})
}

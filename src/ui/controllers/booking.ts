import * as express from 'express'
import * as config from 'lib/config'
import * as learnerRecord from 'lib/learnerrecord'
import * as template from 'lib/ui/template'
import * as courseController from './course/index'
import * as model from 'lib/model'
import * as xapi from 'lib/xapi'
import * as messenger from 'lib/service/messaging'
import * as dateTime from 'lib/datetime'

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
		const today = new Date()
		const courseAvailability = course.availability
			.filter(availability => availability > today)
			.sort((a, b) => a > b)

		res.send(
			template.render('booking/choose-date', req, {
				breadcrumbs,
				course,
				courseAvailability,
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
		/^\S+@\S+$/.test(req.body['financial-approver'])
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

	req.session.save(() => {
		res.send(
			template.render('booking/confirm-booking', req, {
				availabilityUid: req.session.bookingSession.dateSelected,
				breadcrumbs: getBreadcrumbs(req),
				course,
				courseDetails: courseController.getCourseDetails(req, course),
				dateIndex: req.session.bookingSession.dateSelected,
				dateSelected,
				fap: req.session.bookingSession.fap,
				po: req.session.bookingSession.po,
			})
		)
	})
}

export async function tryCompleteBooking(
	req: express.Request,
	res: express.Response
) {
	req.session.bookingSession.bookingStep = 6

	const course = req.course
	course.selectedDate =
		course.availability[req.session.bookingSession.dateSelected]

	const extensions = {}

	if (req.session.bookingSession.po) {
		extensions[xapi.Extension.PurchaseOrder] = req.session.bookingSession.po
	}
	if (req.session.bookingSession.fap) {
		extensions[xapi.Extension.FinancialApprover] =
			req.session.bookingSession.fap
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

	req.session.save(() => {
		if (config.BOOKING_ALERT_WEBHOOK) {
			messenger.send(
				config.BOOKING_COMPLETE_MSG(
					req.user.givenName,
					req.course.title,
					req.user.emailAddress,
					dateTime.formatDate(req.course.selectedDate)
				),
				messenger.slack(config.BOOKING_ALERT_WEBHOOK)
			)
		}

		res.send(
			template.render('booking/confirmed', req, {
				course,
				message: confirmedMessage.Booked,
			})
		)
	})
}

export async function renderCancelBookingPage(
	req: express.Request,
	res: express.Response
) {
	const course = req.course

	res.send(
		template.render('booking/cancel-booking', req, {
			cancelBookingFailed: false,
			course,
		})
	)
}

enum confirmedMessage {
	Booked = 'Booking request submitted',
	Cancelled = 'Booking request cancelled',
}

export async function tryCancelBooking(
	req: express.Request,
	res: express.Response
) {
	const course = req.course
	const record = await learnerRecord.getCourseRecord(req.user, course)

	if (!record.selectedDate) {
		res.redirect('/')
		return
	}
	course.selectedDate = record.selectedDate

	if (req.body['cancel-tc']) {
		await xapi.record(req, course, xapi.Verb.Unregistered)

		if (config.BOOKING_ALERT_WEBHOOK) {
			messenger.send(
				config.BOOKING_CANCELLED_MSG(
					req.user.givenName,
					req.course.title,
					req.user.emailAddress,
					dateTime.formatDate(req.course.selectedDate)
				),
				messenger.slack(config.BOOKING_ALERT_WEBHOOK)
			)
		}

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

import * as courseController from '../course'

import * as express from 'express'
import * as asyncHandler from 'express-async-handler'
import * as bookingController from './booking'
import * as cancelBookingController from './cancel'

export const router: express.Router = express.Router()

router.param('courseId', asyncHandler(courseController.loadCourse))
router.param('moduleId', asyncHandler(courseController.loadModule))
router.param('eventId', asyncHandler(courseController.loadEvent))

router.get('/book/ouch', bookingController.renderOuch)

router.get(
	'/book/:courseId/:moduleId/choose-date',
	bookingController.renderChooseDate
)

router.post(
	'/book/:courseId/:moduleId/choose-date',
	bookingController.selectedDate
)

router.get(
	'/book/:courseId/:moduleId/:eventId/accessibility',
	bookingController.renderAccessibilityOptions
)
router.post(
	'/book/:courseId/:moduleId/:eventId/accessibility',
	bookingController.saveAccessibilityOptions
)

router.get(
	'/book/:courseId/:moduleId/:eventId/payment',
	bookingController.renderPaymentOptions
)

router.get(
	'/book/:courseId/:moduleId/:eventId/payment/confirm-po',
	bookingController.renderConfirmPo
)

router.post(
	'/book/:courseId/:moduleId/:eventId/payment',
	bookingController.enteredPaymentDetails
)

router.get(
	'/book/:courseId/:moduleId/:eventId/confirm',
	asyncHandler(bookingController.renderConfirmPayment)
)

router.get(
	'/book/:courseId/:moduleId/:eventId/complete',
	asyncHandler(bookingController.tryCompleteBooking)
)

router.get(
	'/book/:courseId/:moduleId/:eventId/move',
	asyncHandler(bookingController.tryMoveBooking)
)

router.get(
	'/book/:courseId/:moduleId/:eventId/cancel',
	asyncHandler(cancelBookingController.renderCancelBookingPage)
)

router.get(
	'/book/:courseId/:moduleId/:eventId/skip',
	asyncHandler(bookingController.trySkipBooking)
)

router.post(
	'/book/:courseId/:moduleId/:eventId/cancel',
	asyncHandler(cancelBookingController.tryCancelBooking)
)

router.get(
	'/book/:courseId/:moduleId/:eventId/cancelled',
	asyncHandler(cancelBookingController.renderCancelledBookingPage)
)

router.get(
	'/book/cancelled',
	asyncHandler(cancelBookingController.renderCancelledBookingPage)
)

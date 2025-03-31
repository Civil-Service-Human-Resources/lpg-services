import {NextFunction, Request, Response} from 'express'
import * as courseController from '../course'

import * as express from 'express'
import * as asyncHandler from 'express-async-handler'
import * as bookingController from './booking'
import * as cancelBookingController from './cancel'

export const router: express.Router = express.Router()

router.param('courseId', asyncHandler(courseController.loadCourse))
router.param('moduleId', asyncHandler(courseController.loadModule))
router.param('eventId', asyncHandler(courseController.loadEvent))

router.use((req: Request, res: Response, next: NextFunction) => {
	if (!req.user.hasLineManager()) {
		return res.redirect(`/profile/line-manager?redirectTo=${req.originalUrl}`)
	}
	next()
})

router.get('/ouch', bookingController.renderOuch)

router.get('/:bookingCourseId/:bookingModuleId/choose-date', bookingController.renderChooseDate)

router.post('/:courseId/:moduleId/choose-date', bookingController.selectedDate)

router.get('/:courseId/:moduleId/:eventId/accessibility', bookingController.renderAccessibilityOptions)
router.post('/:courseId/:moduleId/:eventId/accessibility', bookingController.saveAccessibilityOptions)

router.get('/:courseId/:moduleId/:eventId/payment', bookingController.renderPaymentOptions)

router.get('/:courseId/:moduleId/:eventId/payment/confirm-po', bookingController.renderConfirmPo)

router.post('/:courseId/:moduleId/:eventId/payment', bookingController.enteredPaymentDetails)

router.get('/:courseId/:moduleId/:eventId/confirm', asyncHandler(bookingController.renderConfirmPayment))

router.get('/:courseId/:moduleId/:eventId/complete', asyncHandler(bookingController.tryCompleteBooking))

router.get('/:courseId/:moduleId/:eventId/move', asyncHandler(bookingController.tryMoveBooking))

router.get('/:courseId/:moduleId/:eventId/cancel', asyncHandler(cancelBookingController.renderCancelBookingPage))

router.get('/:courseId/:moduleId/:eventId/skip', asyncHandler(bookingController.trySkipBooking))

router.post('/:courseId/:moduleId/:eventId/cancel', asyncHandler(cancelBookingController.tryCancelBooking))

router.get('/:courseId/:moduleId/:eventId/cancelled', asyncHandler(cancelBookingController.renderCancelledBookingPage))

router.get('/cancelled', asyncHandler(cancelBookingController.renderCancelledBookingPage))

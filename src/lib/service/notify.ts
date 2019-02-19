import * as config from 'lib/config'
import {NotificationService} from "lib/service/notification-service"
import {NotificationServiceConfig} from "lib/service/notification-service/notificationServiceConfig"

export interface BookingCancellation {
	bookingReference: string
	courseDate: string
	courseTitle: string
	cost: number | undefined
	email: string
	learnerName: string
	courseLocation: string
	lineManager: {
		email: string
		name: string
	}
}

export interface BookingConfirmation {
	accessibility: string
	bookingReference: string
	cost: number | undefined
	courseDate: string
	courseLocation: string
	courseTitle: string
	eventId: string
	email: string
	location: string
	learnerName: string
	paymentOption: string
	lineManager: {
		email: string
		name: string
	}
}

export async function bookingCancelled(info: BookingCancellation, accessToken: string) {
	const notify = new NotificationService(new NotificationServiceConfig())

	const templateData = {...info}

	await notify.sendEmail(config.BOOKING_NOTIFY_TEMPLATE_IDS.cancelled, info.email, templateData, accessToken)
		.catch(reason => {
			throw new Error(
				`Got unexpected response status ${reason} when posting booking cancellation to GOV Notify`
			)
		})

	if (info.lineManager) {
		const personalisation = {
			...templateData,
			recipient: info.lineManager.name || info.lineManager.email,
		}
		await notify
			.sendEmail(
				config.BOOKING_NOTIFY_TEMPLATE_IDS.cancelledLineManager, info.lineManager.email, personalisation, accessToken)
			.catch(reason => {
				throw new Error(
					`Got unexpected response status ${reason} when posting booking cancellation to GOV Notify`
				)
			})
	}
}

export async function bookingRequested(info: BookingConfirmation, accessToken: string) {
	const notify = new NotificationService(new NotificationServiceConfig())
	const templateData = {...info}

	await notify
		.sendEmail(config.BOOKING_NOTIFY_TEMPLATE_IDS.confirmed, info.email, templateData, accessToken)
		.catch(reason => {
			throw new Error(
				`Got unexpected response status ${reason} when posting booking request to GOV Notify`
			)
		})

	if (info.lineManager) {
		const personalisation = {
			...templateData,
			recipient: info.lineManager.name || info.lineManager.email,
		}
		await notify
			.sendEmail(
				config.BOOKING_NOTIFY_TEMPLATE_IDS.confirmedLineManager, info.lineManager.email, personalisation, accessToken)
			.catch(reason => {
				throw new Error(
					`Got unexpected response status ${reason} when posting booking request to GOV Notify`
				)
			})
	}
}

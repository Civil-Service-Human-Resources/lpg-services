import * as config from 'lib/config'
import * as gov from 'notifications-node-client'

export interface BookingCancellation {
	courseDate: string
	courseTitle: string
	email: string
	name: string
}

export interface BookingConfirmation {
	accessibility: string
	courseDate: string
	courseTitle: string
	email: string
	name: string
	paymentOption: string
}

export async function bookingCancelled(info: BookingCancellation) {
	const notify = new gov.NotifyClient(config.GOV_NOTIFY_API_KEY)
	for (const recipient of config.BOOKING_NOTIFY_RECIPIENTS) {
		const resp = await notify.sendEmail(
			config.BOOKING_CANCELLED_NOTIFY_TEMPLATE_ID,
			recipient,
			{personalisation: info}
		)
		if (resp.statusCode !== 201) {
			throw new Error(
				`Got unexpected response status ${
					resp.statusCode
				} when posting booking cancellation to GOV Notify`
			)
		}
	}
}

export async function bookingConfirmed(info: BookingConfirmation) {
	const notify = new gov.NotifyClient(config.GOV_NOTIFY_API_KEY)
	for (const recipient of config.BOOKING_NOTIFY_RECIPIENTS) {
		const resp = await notify.sendEmail(
			config.BOOKING_CONFIRMED_NOTIFY_TEMPLATE_ID,
			recipient,
			{personalisation: info}
		)
		if (resp.statusCode !== 201) {
			throw new Error(
				`Got unexpected response status ${
					resp.statusCode
				} when posting booking confirmation to GOV Notify`
			)
		}
	}
}

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

export async function bookingCancelled(info: BookingCancellation) {
	const notify = new gov.NotifyClient(config.GOV_NOTIFY_API_KEY)
	for (const recipient of config.BOOKING_NOTIFY_RECIPIENTS) {
		const resp = await notify.sendEmail(
			config.BOOKING_NOTIFY_TEMPLATE_IDS.cancelled,
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

export async function bookingRequested(info: BookingConfirmation) {
	const notify = new gov.NotifyClient(config.GOV_NOTIFY_API_KEY)
	const templateData = {...info, lineManager: 'jen@cyb.digital'}

	await notify
		.sendEmail(config.BOOKING_NOTIFY_TEMPLATE_IDS.confirmed, info.email, {
			personalisation: templateData,
		})
		.catch(reason => {
			throw new Error(
				`Got unexpected response status ${reason} when posting booking confirmation to GOV Notify`
			)
		})

	if (info.lineManager) {
		await notify
			.sendEmail(
				config.BOOKING_NOTIFY_TEMPLATE_IDS.confirmedLineManager,
				info.lineManager.email,
				{
					personalisation: {
						...templateData,
						recipient: info.lineManager.name || info.lineManager.email,
					},
				}
			)
			.catch(reason => {
				throw new Error(
					`Got unexpected response status ${reason} when posting booking confirmation to GOV Notify`
				)
			})
	}
}

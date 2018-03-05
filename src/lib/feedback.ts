import * as config from 'lib/config'
import * as gov from 'notifications-node-client'

export async function record(req: {
	pageUrl: string
	wentWrong: string
	whatDoing: string
}) {
	const notify = new gov.NotifyClient(config.GOV_NOTIFY_API_KEY)
	for (const recipient of config.FEEDBACK_RECIPIENTS) {
		const resp = await notify.sendEmail(
			config.FEEDBACK_TEMPLATE_ID,
			recipient,
			{personalisation: req}
		)
		if (resp.statusCode !== 201) {
			throw new Error(
				`Got unexpected response status ${
					resp.statusCode
				} when posting feedback to GOV Notify`
			)
		}
	}
}

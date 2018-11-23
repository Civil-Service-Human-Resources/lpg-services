import * as config from 'lib/config'
import {NotificationService} from '../notification-service'
import {NotificationServiceConfig} from '../notification-service/notificationServiceConfig'
// import * as gov from 'notifications-node-client'

export async function record(req: {
	pageUrl: string
	wentWrong: string
	whatDoing: string
},                           accessToken: string) {
	const notify = new NotificationService(new NotificationServiceConfig())
	for (const recipient of config.FEEDBACK_RECIPIENTS) {
		await notify.sendEmail(
			config.FEEDBACK_TEMPLATE_ID,
			recipient,
			req, accessToken
		)
	}
}

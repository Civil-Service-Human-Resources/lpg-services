import axios from 'axios'
import * as config from 'lib/config'

export async function send(message: string) {
	if (!config.BOOKING_ALERT_WEBHOOK) {
		return
	}
	await axios.post(config.BOOKING_ALERT_WEBHOOK, {text: message})
}

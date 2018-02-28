import * as config from 'lib/config'
import * as gov from 'notifications-node-client'
import * as pg from 'pg'

const pool = new pg.Pool({
	connectionString: config.POSTGRES,
})

export async function record(req: {
	pageUrl: string
	wentWrong: string
	whatDoing: string
}) {
	try {
		await pool.query(
			'INSERT INTO feedback(page_url, went_wrong, what_doing) VALUES($1, $2, $3);',
			[req.pageUrl, req.wentWrong, req.whatDoing]
		)
	} catch (e) {
		console.log('Postgres is still missing.... 🤬', e)
	}
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

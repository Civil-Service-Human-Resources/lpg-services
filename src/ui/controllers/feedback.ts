import * as express from 'express'
import * as feedback from 'lib/feedback'
import * as log4js from 'log4js'

const logger = log4js.getLogger('controllers/feedback')

export async function record(req: express.Request, res: express.Response) {
	const {pageUrl = '', wentWrong = '', whatDoing = ''} = req.body
	if (!pageUrl || !pageUrl.startsWith('/')) {
		res.sendStatus(500)
		return
	}
	if (wentWrong || whatDoing) {
		const param = {pageUrl, wentWrong, whatDoing}
		try {
			await feedback.record(param, req.user.accessToken)
		} catch (err) {
			logger.error(
				`Couldn't record feedback: ${JSON.stringify(param)}

Got error: ${err}`
			)
		}
	}
	if (req.xhr) {
		res.send(`<h2>Thank you for your help.</h2>
<p>If you have more extensive feedback, please <a href="mailto:feedback@cslearning.gov.uk">send us an email</a>.</p>
    `)
		return
	}
	req.session!.flash = 'Thank you for your feedback!'
	res.redirect(pageUrl)
}

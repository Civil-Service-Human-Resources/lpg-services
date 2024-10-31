import * as express from 'express'

export class MessageFlash {
	constructor(public event: string, public message: string) {
	}
}

export function generateRedirectMiddleware(url: string, messageFlash?: MessageFlash) {
	return (req: express.Request, res: express.Response) => {
		if (messageFlash) {
			req.flash(messageFlash.event, messageFlash.message)
		}
		return req.session!.save(() => {
			res.redirect(url)
		})
	}
}

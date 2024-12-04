import {ClassConstructor, plainToInstance} from 'class-transformer'
import * as express from 'express'
import {getLogger} from '../../lib/logger'

const logger = getLogger('Utils')

export class MessageFlash {
	constructor(
		public event: string,
		public message: string
	) {}
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

export class SessionableObjectService<T> {
	constructor(
		public key: string,
		public clazz: ClassConstructor<T>
	) {}
	fetchObjectFromSession(req: express.Request): T | undefined {
		logger.debug(`Fetching session object with key '${this.key}'`)
		return plainToInstance(this.clazz, req.session![this.key] as T)
	}

	saveObjectToSession(req: express.Request, object: T) {
		logger.debug(`Saving session object ${JSON.stringify(object)} with key '${this.key}'`)
		req.session![this.key] = object
	}

	deleteObjectFromSession(req: express.Request) {
		logger.debug(`Deleting session object with key '${this.key}'`)
		delete req.session![this.key]
	}
}

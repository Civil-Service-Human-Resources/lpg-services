import {ClassConstructor, plainToInstance} from 'class-transformer'
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

export class SessionableObjectService<T> {
	constructor(public key: string, public clazz: ClassConstructor<T>) { }
	fetchObjectFromSession(req: express.Request) {
		return plainToInstance(this.clazz, req.session![this.key] as T)
	}

	saveObjectToSession(req: express.Request, object: T) {
		req.session![this.key] = object
	}

	deleteObjectFromSession(req: express.Request) {
		delete req.session![this.key]
	}

}

import axios from 'axios'

export class MessageDispatcher {
	public api: Function

	constructor(callback: Function) {
		this.api = callback
	}
}

export function slack(uri: string): MessageDispatcher {
	return {
		api: (message: string) => {
			axios.post(uri, {
				text: message,
			})
		},
	}
}

export function send(message: string, dispatcher: MessageDispatcher) {
	dispatcher.api(message)
}

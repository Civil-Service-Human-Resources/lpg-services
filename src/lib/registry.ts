import * as config from 'lib/config'
import * as traverson from 'traverson'
import * as hal from 'traverson-hal'

// register the traverson-hal plug-in for media type 'application/hal+json'
traverson.registerMediaType(hal.mediaType, hal)

export async function get(node: string) {
	console.log('called')
	const result = await new Promise((resolve, reject) =>
		traverson
			.from(config.REGISTRY_SERVICE_URL)
			.jsonHal()
			.follow(node, 'self')
			.getResource((error, document) => {
				if (error) {
					reject(false)
				} else {
					const data = document._embedded[node].map((x: any) => {
						const hash: Record<string, string> = {}
						hash[x.name] = x._links.self.href.replace(
							config.REGISTRY_SERVICE_URL,
							''
						)
						console.log(
							'link:',
							x._links.self.href.replace(config.REGISTRY_SERVICE_URL, '')
						)
						return hash
					})

					const out: Record<string, string> = {}
					for (const item of data) {
						const keys = Object.keys(item)
						out[item[keys[0]]] = keys[0]
					}
					console.log(out)
					resolve(out)
				}
			})
	)

	return result
}

export async function getRaw(node: string) {
	console.log('called')
	const result = await new Promise((resolve, reject) =>
		traverson
			.from(config.REGISTRY_SERVICE_URL)
			.jsonHal()
			.follow(node, 'self')
			.getResource((error, document) => {
				if (error) {
					reject(false)
				} else {
					resolve(document)
				}
			})
	)

	return result
}

export async function follow(path: string, nodes: string[]) {
	console.log('called')
	const result = await new Promise((resolve, reject) =>
		traverson
			.from(path)
			.jsonHal()
			.follow('', ...nodes)
			.getResource((error, document) => {
				if (error) {
					reject(false)
				} else {
					resolve(document)
				}
			})
	)

	return result
}

export async function patch(node: string, data: any, token: string) {
	console.log('token sent', token)
	console.log('updating ', node, ' with ', data)
	const result = await new Promise((resolve, reject) =>
		traverson
			.from(config.REGISTRY_SERVICE_URL)
			.jsonHal()
			.follow(node, 'me', 'self')
			.withRequestOptions({
				auth: {
					bearer: token,
				},
			})
			.patch(data, (error, document) => {
				if (error) {
					console.log(error)
					reject(false)
				} else {
					resolve(true)
				}
			})
	)

	return result
}

// export async function cascade(token) {
// 	get main branch for each thing not selg
// }

export async function profile(token: string) {
	console.log('calling profile')
	const result = await new Promise((resolve, reject) =>
		traverson
			.from(config.REGISTRY_SERVICE_URL)
			.jsonHal()
			.follow('civilServants', 'me')
			.withRequestOptions({
				auth: {
					bearer: token,
				},
			})
			.getResource((error, document) => {
				if (error) {
					console.log('reject')
					console.log(document)
					reject(false)
				} else {
					console.log('good')
					console.log(document)
					resolve(document)
				}
			})
	)
	console.log('end')
	return result
}

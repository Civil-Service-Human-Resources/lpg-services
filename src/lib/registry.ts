import * as config from 'lib/config'
import * as traverson from 'traverson'
import * as hal from 'traverson-hal'

// register the traverson-hal plug-in for media type 'application/hal+json'
traverson.registerMediaType(hal.mediaType, hal)

export async function get(node: string): Promise<any[]> {
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
					resolve(document._embedded[node])
				}
			})
	)

	return result as any[]
}

export async function follow(path: string, nodes: string[]) {
	console.log('called follow')
	const first = nodes[0]
	nodes.shift()
	const result = await new Promise((resolve, reject) =>
		traverson
			.from(path)
			.jsonHal()
			.follow(first, ...nodes)
			.getResource((error, document) => {
				if (error) {
					console.log("error")
					reject(false)
				} else {
					console.log(document)
					resolve(document)
				}
			})
	)

	console.log(result)
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

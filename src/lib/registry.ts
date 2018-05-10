import * as traverson from 'traverson'
import * as hal from 'traverson-hal'

// register the traverson-hal plug-in for media type 'application/hal+json'
traverson.registerMediaType(hal.mediaType, hal)

const halHost = 'http://lpg.local.cshr.digital:9002'


export async function get(node: string) {
	console.log("called")
	const result = await new Promise((resolve, reject) => traverson
		.from(halHost)
		.jsonHal()
		.follow(node, 'self')
		.getResource((error, document) => {
			if (error) {
				reject(false)
			} else {
				const data = document._embedded[node].map((x: any) => {
					const  hash: Record<string, string> = {}
					hash[x.name] = x.self
					return hash
				})

				const out: Record<string, string> = {}
				for (const  item of data) {
					const arr = Object.entries(item)
					const key = arr[0][0]
					const value = arr[0][0]
					out[key] = value
				}

				resolve(out)
			}
	}))

	return result
}

export async function patch(node: string ,  data: any, token: string) {
	console.log('token sent', token)
	const result = await new Promise((resolve, reject) => traverson
		.from(halHost)
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
		}))

	return result
}

// export async function cascade(token) {
// 	get main branch for each thing not selg
// }

export async function profile(token: string) {
	const result = await new Promise((resolve, reject) => traverson
		.from(halHost)
		.jsonHal()
		.follow('civilServants', 'me')
		.withRequestOptions({
		auth: {
			bearer: token,
			},
		})
		.getResource((error, document) => {
			if (error) {
				console.log(error)
				reject(false)
			} else {
				console.log('**********************')
				console.log(document)
				resolve(document)
			}
		}))

	return result
}

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
				reject()
			} else {
				const data = document._embedded[node].map((x: any) => {
					const  hash: Record<string, string> = {}
					hash[x.name] = x.self
					return hash
				})

				const out: Record<string, string> = {}
				for (const  item of data) {
					const arr = Object.entries(item)
					console.log(arr)
					console.log('##################')
					const key = arr[0][0]
					const value = arr[0][0]
					out[key] = value
					console.log(out)
				}

				resolve(out)
			}
	}))

	console.log(result)
	return result
}

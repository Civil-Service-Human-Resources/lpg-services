import * as es from 'elasticsearch'
import * as catalog from 'lib/service/catalog'

let client: es.Client

function connect() {
	client = new es.Client({
		hosts: ['http://127.0.0.1:9200/'],
	})
}

export function info() {
	connect()
	client.cluster.health({}, (err, resp) => {
		console.log('-- Client Health --', resp)
	})
}

export function deleteIndexes() {
	connect()
	client.indices.delete({
		index: 'dgraph',
	})
}

export async function createIndex() {
	let count = 0
	const bulkIndex = []

	// query elastic search
	const searchResponse = await catalog.listAll({})
	for (const entry of searchResponse.entries) {
		const data: any = {}
		for (const prop of Object.keys(entry)) {
			data[prop] = (entry as any)[prop]
		}
		bulkIndex.push({index: {}})
		bulkIndex.push(data)
		count++
	}

	try {
		connect()
		await client.bulk({
			body: bulkIndex,
			index: 'dgraph',
			type: 'lpg',
		})

		console.log('indexed: ', count)
	} catch (e) {
		console.log('Error on index')
		console.log(e)
	}

	return 'Waiting ...'
}

/* tslint:disable:no-var-requires */
require('make-runnable')

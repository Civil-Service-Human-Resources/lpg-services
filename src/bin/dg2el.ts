import * as es from 'elasticsearch'
import * as fs from 'fs'
import * as striptags from 'striptags'
import * as catalog from 'lib/service/catalog'
import * as api from 'lib/service/catalog/api'
import * as model from 'lib/model'

var client: es.Client

function connect() {
	client = new es.Client({
		hosts: ['http://127.0.0.1:9200/'],
	})
}

export function info() {
	connect()
	client.cluster.health({}, function(err, resp) {
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
	var count: Number = 0

	let bulkIndex = []
	// query elastic search
	let req: api.SearchRequest = {}
	let searchResponse = await catalog.listAll(req)
	let entry: model.Course
	for (entry of searchResponse.entries) {
		let data: any = {}
		for (let prop in entry) {
			data[prop] = (entry as any)[prop]
		}

		bulkIndex.push({index: {}})
		bulkIndex.push(data)
	}

	try {
		connect()
		await client.bulk({
			index: 'dgraph',
			type: 'lpg',
			body: bulkIndex,
		})

		console.log('indexed: ', count)
	} catch (e) {
		console.log('Error on index')
		console.log(e)
	}

	return 'Waiting ...'
}

require('make-runnable')

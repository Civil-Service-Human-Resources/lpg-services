import * as parse from 'csv-parse/lib/sync'
import * as dgraph from 'dgraph-js'
import * as fs from 'fs'
import * as grpc from 'grpc'
import * as model from 'lib/model'
import * as api from 'lib/service/catalog/api'
import * as striptags from 'striptags'
import * as elastic from 'elasticsearch'
import {isArray} from 'util'

const {
	DGRAPH_ENDPOINT = 'localhost:9080',
	ELASTIC_ENDPOINT = 'http://127.0.01:9200',
} = process.env

const elasticConfig = [
	{
		settings: {
			analysis: {
				analyzer: {
					default: {
						type: 'standard',
						stopwords: ['_english_'],
					},
				},
			},
		},
	},
]

const SCHEMA = `tags: [string] @count @index(term) .
title: string @index(term) .
shortDescription: string @index(term) .
description: string @index(term).
learningOutcomes: string .
type: string .
uri: string @index(exact) .
duration: string .
availability: [dateTime] .
`

const client = new dgraph.DgraphClient(
	new dgraph.DgraphClientStub(
		DGRAPH_ENDPOINT,
		grpc.credentials.createInsecure()
	)
)

async function getElasticClient() {
	let client = new elastic.Client({
		hosts: [ELASTIC_ENDPOINT],
	})

	// check for existing index
	await client.indices.exists({index: 'dgraph'}).then(function(res) {
		let exists: boolean = res
		if (!exists) {
			client.indices.create({index: 'dgraph', body: elasticConfig[0]})
		}
	})

	return client
}

export async function add(course: model.Course) {
	const txn = client.newTxn()
	const mu = new dgraph.Mutation()

	try {
		mu.setSetJson({
			availability: course.availability || [],
			description: course.description || '',
			duration: course.duration || '',
			learningOutcomes: course.learningOutcomes || '',
			shortDescription: course.shortDescription || '',
			tags: course.tags || [],
			title: course.title || '',
			type: course.type || '',
			uid: course.uid || null,
			uri: course.uri || '',
		})
		mu.setCommitNow(true)
		const assigned = await txn.mutate(mu)
		return assigned.getUidsMap().get('blank-0') || course.uid
	} finally {
		// add to elastic search
		let elasticClient = await getElasticClient()
		let data: any = {}
		let entry = mu.getSetJson()

		for (let prop in entry) {
			data[prop] = (entry as any)[prop]
		}

		await elasticClient.index({
			index: 'dgraph',
			type: 'lpg',
			body: data,
		})

		await txn.discard()
	}
}

export async function get(uid: string) {
	await setSchema(SCHEMA)

	const txn = client.newTxn()
	try {
		const query = `query all($id: string) {
			entries(func: uid($id)) {
				tags
				title
				type
				uid
				uri
				shortDescription
				description
				learningOutcomes
				duration
				availability
			}
		}`
		const qresp = await client.newTxn().queryWithVars(query, {$id: uid})
		const entries = qresp.getJson().entries
		if (entries.length) {
			return model.Course.create(entries[0])
		}
		return null
	} finally {
		await txn.discard()
	}
}

export async function elasticSearch(
	searchTerm: string
): Promise<api.textSearchResponse> {
	let query = {
		size: 100,
		body: {
			suggest: {
				text: searchTerm,
				suggest_title: {
					term: {
						field: 'title',
					},
				},
				suggest_shortDescription: {
					term: {
						field: 'shortDescription',
					},
				},
				suggest_description: {
					term: {
						field: 'description',
					},
				},
			},
			query: {
				multi_match: {
					query: searchTerm,
					fuzziness: 'AUTO',
					fields: ['title^8', 'shortDescription^4', 'description^2'],
				},
			},
			highlight: {
				fields: {
					'*': {},
				},
			},
		},
	}
	let elasticClient = await getElasticClient()

	let search = await elasticClient.search(query).then(function(res) {
		let suggestion = ''
		let resp: model.textSearchResult[] = []
		for (let suggest of Object.keys((res as any).suggest)
			.sort()
			.reverse()) {
			for (let suggestObj of (res as any).suggest[suggest]) {
				let replace = suggestObj.text
				let options = suggestObj.options

				if (options && isArray(options) && options.length > 0) {
					suggestion = searchTerm.replace(replace, options[0].text)
					searchTerm = suggestion
				}
			}
		}

		for (let entry of res.hits.hits) {
			let searchResult: model.textSearchResult = {
				uid: entry._id,
				title: (entry._source as any).title,
				searchText: entry.highlight[Object.keys(entry.highlight)[0]][0],
				weight: entry._score,
			}

			resp.push(searchResult)
		}
		return {suggestion, resp}
	})

	return {suggestion: search.suggestion, entries: search.resp}
}

export async function search(
	req: api.SearchRequest
): Promise<api.SearchResponse> {
	await setSchema(SCHEMA)

	const map: Record<string, [number, number, model.Course]> = {}
	const results = []
	if (!req.tags || !req.tags.length) {
		return {entries: []}
	}
	for (const tag of req.tags) {
		const query = `query all($tag: string) {
			entries(func: eq(tags, $tag)) {
				tags
				title
				uid
				uri
			}
		}`
		const qresp = await client.newTxn().queryWithVars(query, {$tag: tag})
		const entries = qresp.getJson().entries
		for (const entry of entries) {
			let info = map[entry.uid]
			if (info) {
				info[0] += 1
			} else {
				info = [1, parseInt(entry.uid, 16), entry]
				map[entry.uid] = info
				results.push(info)
			}
		}
	}
	results.sort(
		(a: [number, number, model.Course], b: [number, number, model.Course]) => {
			if (b[0] > a[0]) {
				return 1
			} else if (b[0] < a[0]) {
				return -1
			}
			if (b[1] > a[1]) {
				return 1
			} else if (b[1] < a[1]) {
				return -1
			}
			return 0
		}
	)
	const {after, first} = req
	const resp: model.Course[] = []
	let count = 0
	let include = true
	if (after) {
		include = false
	}
	for (const info of results) {
		const entry = info[2]
		if (include) {
			resp.push(entry)
		} else {
			if (entry.uid === after) {
				include = true
			}
			continue
		}
		if (first) {
			count += 1
			if (count === first) {
				break
			}
		}
	}
	return {entries: resp}
}

export async function setSchema(schema: string) {
	const op = new dgraph.Operation()
	op.setSchema(schema)
	await client.alter(op)
}

export async function wipe() {
	const op = new dgraph.Operation()
	op.setDropAll(true)
	await client.alter(op)
}

export async function listAll(
	req: api.SearchRequest
): Promise<api.SearchResponse> {
	await setSchema(SCHEMA)

	const query = `{
		entries(func: ge(count(tags), 1)) {
			tags
			title
			type
			uid
			uri
			shortDescription
			description
			learningOutcomes
			duration
			availability
		}
	}`
	const qresp = await client.newTxn().query(query)
	const results = qresp.getJson().entries

	results.sort(
		(a: [number, number, model.Course], b: [number, number, model.Course]) => {
			if (b[0] > a[0]) {
				return 1
			} else if (b[0] < a[0]) {
				return -1
			}
			if (b[1] > a[1]) {
				return 1
			} else if (b[1] < a[1]) {
				return -1
			}
			return 0
		}
	)

	const {after, first} = req
	const resp: model.Course[] = []
	let count = 0
	let include = true
	if (after) {
		include = false
	}
	for (const entry of results) {
		if (include) {
			resp.push(entry)
		} else {
			if (entry.uid === after) {
				include = true
			}
			continue
		}
		if (first) {
			count += 1
			if (count === first) {
				break
			}
		}
	}
	return {entries: resp}
}

export async function findRequiredLearning(
	user: model.User
): Promise<api.SearchResponse> {
	await setSchema(SCHEMA)

	const query = `query all($department: string, $mandatory: string) {
		entries(func: anyofterms(tags, $department)) @filter(anyofterms(tags, $mandatory)) {
			tags
			title
			type
			uid
			uri
			shortDescription
			description
			learningOutcomes
			duration
			availability
		}
	}`
	const qresp = await client.newTxn().queryWithVars(query, {
		$department: `department:${user.department} department:all`,
		$mandatory: `mandatory:${user.department} mandatory:all`,
	})

	const results = qresp.getJson().entries
	results.sort(
		(a: [number, number, model.Course], b: [number, number, model.Course]) => {
			if (b[0] > a[0]) {
				return 1
			} else if (b[0] < a[0]) {
				return -1
			}
			if (b[1] > a[1]) {
				return 1
			} else if (b[1] < a[1]) {
				return -1
			}
			return 0
		}
	)
	return {entries: results.map(model.Course.create)}
}

export async function findSuggestedLearning(
	user: model.User
): Promise<api.SearchResponse> {
	await setSchema(SCHEMA)

	const query = `query all($areaOfWork:string, $mandatory: string) {
		entries(func: anyofterms(tags, $areaOfWork)) @filter(NOT anyofterms(tags, $mandatory)) {
			tags
			title
			type
			uid
			uri
			shortDescription
			description
			learningOutcomes
			duration
			availability
		}
	}`
	const qresp = await client.newTxn().queryWithVars(query, {
		$areaOfWork: `area-of-work:${user.profession} area-of-work:all`,
		$mandatory: `mandatory:${user.department} mandatory:all`,
	})

	const results = qresp.getJson().entries
	results.sort(
		(a: [number, number, model.Course], b: [number, number, model.Course]) => {
			if (b[0] > a[0]) {
				return 1
			} else if (b[0] < a[0]) {
				return -1
			}
			if (b[1] > a[1]) {
				return 1
			} else if (b[1] < a[1]) {
				return -1
			}
			return 0
		}
	)
	return {entries: results.map(model.Course.create)}
}

export async function resetCourses() {
	await wipe()
	await setSchema(SCHEMA)

	const rawData = fs.readFileSync(__dirname + '/data.csv')
	const lines = parse(rawData.toString())
	const attributes = lines.shift()

	const highestUid = Number(lines[lines.length - 1][0])
	let currentUid = 0x0

	/* tslint:disable */
	while (highestUid > currentUid) {
		currentUid = Number(await add({title: 'placeholder'}))
	}

	for (const line of lines) {
		const course: model.Course = {}
		for (const i in attributes) {
			if (attributes[i] === 'tags') {
				course.tags = line[i].split(',').map(tag => tag.trim())
			} else {
				course[attributes[i]] = line[i] && line[i].replace(/\\n/g, '\n')
			}
		}
		await add(course)
	}
	/* tslint:enable */
}

import * as parse from 'csv-parse/lib/sync'
import * as dgraph from 'dgraph-js'
import * as fs from 'fs'
import * as path from 'path'
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

const suggestThreshold = 0.7

const elasticConfig = [
	{
		mappings: {
			lpg: {
				properties: {
					description: {
						type: 'text',
						copy_to: 'suggested_terms',
						fields: {
							keyword: {
								type: 'keyword',
							},
						},
					},
					learningOutcomes: {
						type: 'text',

						fields: {
							keyword: {
								type: 'keyword',
							},
						},
					},
					shortDescription: {
						type: 'text',

						fields: {
							keyword: {
								type: 'keyword',
							},
						},
					},
					tags: {
						type: 'text',

						fields: {
							keyword: {
								type: 'keyword',
							},
						},
					},
					title: {
						type: 'text',
						copy_to: 'suggested_terms',
						fields: {
							keyword: {
								type: 'keyword',
							},
						},
					},
					suggested_terms: {
						type: 'text',
						fields: {
							keyword: {
								type: 'keyword',
							},
						},
					},
				},
			},
		},
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
title: string @index(fulltext) .
shortDescription: string @index(fulltext) .
description: string .
learningOutcomes: string .
type: string .
uri: string @index(exact) .
duration: string .
availability: [dateTime] .
location: string .
price: string .
requiredBy: dateTime .
frequency: string .
`
const maxCopyLength = 80

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
	let uid

	try {
		mu.setSetJson({
			availability: course.availability || [],
			description: course.description || '',
			duration: course.duration || '',
			frequency: course.frequency || '',
			learningOutcomes: course.learningOutcomes || '',
			location: course.location || '',
			price: course.price || '',
			requiredBy: course.requiredBy,
			shortDescription: course.shortDescription || '',
			tags: course.tags || [],
			title: course.title || '',
			type: course.type || '',
			uid: course.uid || null,
			uri: course.uri || '',
		})
		mu.setCommitNow(true)
		const assigned = await txn.mutate(mu)
		uid = assigned.getUidsMap().get('blank-0') || course.uid
		return uid
	} finally {
		// add to elastic search
		let elasticClient = await getElasticClient()
		let data: any = {}
		let entry = mu.getSetJson()

		for (let prop in entry) {
			data[prop] = (entry as any)[prop]
		}
		data.uid = uid

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
				location
				price
				requiredBy
				frequency
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
		index: 'dgraph',
		body: {
			suggest: {
				text: searchTerm,
				suggest_description: {
					term: {
						field: 'suggested_terms',
					},
				},
			},
			query: {
				multi_match: {
					query: searchTerm,
					fuzziness: 'AUTO',
					fields: [
						'title^8',
						'shortDescription^4',
						'description^2',
						'learningOutcomes^2',
					],
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

				if (
					options &&
					isArray(options) &&
					options.length > 0 &&
					options[0].score > suggestThreshold &&
					options[0].freq > 1
				) {
					suggestion = searchTerm.replace(replace, options[0].text)
					searchTerm = suggestion
				}
			}
		}

		for (let entry of res.hits.hits) {
			// Don't show context if it's in the title
			let searchText = striptags(
				entry.highlight[Object.keys(entry.highlight)[0]][0],
				'<em>'
			)
			let title = (entry._source as any).title
			if (striptags(searchText) === title) {
				title = searchText
				searchText = ''
			}
			let searchResult: model.textSearchResult = {
				uid: (entry._source as any).uid,
				title,
				searchText,
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
			location
			price
			requiredBy
			frequency
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
			location
			price
			requiredBy
			frequency
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
			location
			price
			requiredBy
			frequency
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
	const rawData = fs.readFileSync(
		path.join(__dirname, '../../../..', 'catalog', 'data.csv')
	)
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
			} else if (attributes[i] === 'requiredBy') {
				if (line[i]) {
					course.requiredBy = new Date(line[i])
				}
			} else {
				course[attributes[i]] = line[i] && line[i].replace(/\\n/g, '\n')
			}
		}
		await add(course)
	}
	/* tslint:enable */
}

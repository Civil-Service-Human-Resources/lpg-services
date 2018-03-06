import * as dgraph from 'dgraph-js'
import * as elastic from 'elasticsearch'
import * as fs from 'fs'
import * as grpc from 'grpc'
import * as config from 'lib/config'
import * as model from 'lib/model'
import * as api from 'lib/service/catalog/api'
import * as path from 'path'
import * as striptags from 'striptags'

/* tslint:disable:no-var-requires */
const parse: (data: string) => string[][] = require('csv-parse/lib/sync')
const client = new dgraph.DgraphClient(
	new dgraph.DgraphClientStub(
		config.DGRAPH_ENDPOINT,
		grpc.credentials.createInsecure()
	)
)

let schemaSet: boolean = false

const elasticConfig = [
	{
		mappings: {
			lpg: {
				properties: {
					description: {
						copy_to: 'suggested_terms',
						fields: {
							keyword: {
								type: 'keyword',
							},
						},
						type: 'text',
					},
					learningOutcomes: {
						fields: {
							keyword: {
								type: 'keyword',
							},
						},
						type: 'text',
					},
					shortDescription: {
						fields: {
							keyword: {
								type: 'keyword',
							},
						},
						type: 'text',
					},
					suggested_terms: {
						fields: {
							keyword: {
								type: 'keyword',
							},
						},
						type: 'text',
					},
					tags: {
						fields: {
							keyword: {
								type: 'keyword',
							},
						},
						type: 'text',
					},
					title: {
						copy_to: 'suggested_terms',
						fields: {
							keyword: {
								type: 'keyword',
							},
						},
						type: 'text',
					},
				},
			},
		},
		settings: {
			analysis: {
				analyzer: {
					default: {
						stopwords: ['_english_'],
						type: 'standard',
					},
				},
			},
		},
	},
]

const suggestThreshold = 0.7

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
productCode: string .
`

async function getElasticClient() {
	const es = new elastic.Client({
		hosts: [config.ELASTIC_ENDPOINT],
	})
	// check for existing index
	const exists = await es.indices.exists({index: 'dgraph'})
	if (!exists) {
		await es.indices.create({index: 'dgraph', body: elasticConfig[0]})
	}
	return es
}

export async function add(course: model.Course) {
	const mu = new dgraph.Mutation()
	mu.setSetJson({
		availability: course.availability || [],
		description: course.description || '',
		duration: course.duration || '',
		frequency: course.frequency || '',
		learningOutcomes: course.learningOutcomes || '',
		location: course.location || '',
		price: course.price || '',
		productCode: course.productCode || '',
		requiredBy: course.requiredBy,
		shortDescription: course.shortDescription || '',
		tags: course.tags || [],
		title: course.title || '',
		type: course.type || '',
		uid: course.uid || null,
		uri: course.uri || '',
	})
	mu.setCommitNow(true)
	const txn = client.newTxn()
	const assigned = await txn.mutate(mu)
	const uid = assigned.getUidsMap().get('blank-0') || course.uid
	await txn.discard()

	try {
		// add to elastic search
		const elasticClient = await getElasticClient()
		const data: any = {}
		const entry = mu.getSetJson()
		for (const prop of Object.keys(entry)) {
			data[prop] = entry[prop]
		}
		data.uid = uid
		await elasticClient.index({
			body: data,
			index: 'dgraph',
			type: 'lpg',
		})
	} catch (e) {
		console.error('Unable to save data to elasticsearch', e)
	}
	return uid
}

export async function elasticSearch(
	searchTerm: string
): Promise<api.TextSearchResponse> {
	const query = {
		body: {
			highlight: {
				fields: {
					'*': {},
				},
			},
			query: {
				multi_match: {
					fields: [
						'title^8',
						'shortDescription^4',
						'description^2',
						'learningOutcomes^2',
					],
					fuzziness: 'AUTO',
					query: searchTerm,
				},
			},
			suggest: {
				suggest_description: {
					term: {
						field: 'suggested_terms',
					},
				},
				text: searchTerm,
			},
		},
		index: 'dgraph',
		size: 100,
	}

	interface SearchResponse<T> extends elastic.SearchResponse<T> {
		suggest: {
			[index: string]: Array<{
				length: number
				offset: number
				options: Array<{
					freq: number
					score: number
					text: string
				}>
				text: string
			}>
		}
	}

	const elasticClient = await getElasticClient()
	const results = (await elasticClient.search(query)) as SearchResponse<{}>
	const suggestions = results.suggest

	let suggestion = ''
	for (const key of Object.keys(suggestions)
		.sort()
		.reverse()) {
		for (const suggestObj of suggestions[key]) {
			const replace = suggestObj.text
			const options = suggestObj.options
			if (
				options &&
				Array.isArray(options) &&
				options.length > 0 &&
				options[0].score > suggestThreshold &&
				options[0].freq > 1
			) {
				suggestion = searchTerm.replace(replace, options[0].text)
				searchTerm = suggestion
			}
		}
	}

	const entries: model.TextSearchResult[] = []
	for (const entry of results.hits.hits) {
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
		entries.push({
			searchText,
			title,
			uid: (entry._source as any).uid,
			weight: entry._score,
		})
	}

	return {entries, suggestion}
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
			productCode
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
			productCode
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
				productCode
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
			productCode
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

export async function resetCourses() {
	await wipe()
	await setSchema(SCHEMA)
	const rawData = fs.readFileSync(
		path.join(__dirname, '../../../..', 'catalog', 'data.csv')
	)
	const lines = parse(rawData.toString())
	const attributes = lines.shift()!
	const highestUid = Number(lines[lines.length - 1][0])

	try {
		const esClient = await getElasticClient()
		// delete index for reset
		await esClient.indices.delete({index: 'dgraph'})
	} catch (e) {
		console.error('Unable to delete elasticsearch index')
	}

	let currentUid = 0
	while (highestUid > currentUid) {
		currentUid = Number(await add({title: 'placeholder'} as model.Course))
	}
	for (const line of lines) {
		const course: any = {}
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
	if (!schemaSet) {
		const op = new dgraph.Operation()
		op.setSchema(schema)
		await client.alter(op)
		schemaSet = true
	}
}

export async function wipe() {
	const op = new dgraph.Operation()
	op.setDropAll(true)
	await client.alter(op)
	schemaSet = false
}

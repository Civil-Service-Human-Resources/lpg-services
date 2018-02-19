import * as parse from 'csv-parse/lib/sync'
import * as dgraph from 'dgraph-js'
import * as fs from 'fs'
import * as grpc from 'grpc'
import * as model from 'lib/model'
import * as api from 'lib/service/catalog/api'
import * as striptags from 'striptags'
import * as elastic from 'elasticsearch'
import * as util from 'util'
const {DGRAPH_ENDPOINT = 'localhost:9080'} = process.env

const SCHEMA = `tags: [string] @count @index(term) .
title: string @index(term) .
shortDescription: string @index(term) .
description: string @index(term).
learningOutcomes: string .
type: string .
uri: string @index(exact) .
duration: string .
`
const maxCopyLength = 80
const weighting = {
	large: 8,
	medium: 4,
	small: 2,
}

const client = new dgraph.DgraphClient(
	new dgraph.DgraphClientStub(
		DGRAPH_ENDPOINT,
		grpc.credentials.createInsecure()
	)
)

var elasticClient: elastic.Client

function connect() {
	elasticClient = new elastic.Client({
		hosts: ['http://127.0.0.1:9200/'],
	})
}

/** weigh terms found in predicate text
 *  doesn't take into account multiple hits on any particular term
 * **/
function termWeight(resultString: string, searchTerm: string): number {
	if (resultString.indexOf(searchTerm) >= 0) {
		return weighting.large // if exact term found return heighest rating
	} else {
		// must be multi term else would not be in search results
		let weight = 0
		let arrSearchTerm = searchTerm.split(' ')
		for (let [index, term] of arrSearchTerm.entries()) {
			if (resultString.toLowerCase().indexOf(term) > 0) {
				weight += weighting.small
			}
		}
		return weight
	}
}

function formatResultString(resultString: string, searchTerm: string): string {
	let pos = resultString.toLowerCase().indexOf(searchTerm)
	let out = ''
	if (pos >= 0) {
		let actualTermText = resultString.substr(pos, searchTerm.length)
		let start = pos - maxCopyLength / 2
		if (start < 0) start = 0

		out = striptags(resultString)
			.replace(actualTermText, '<b>' + actualTermText + '</b>')
			.substr(start, maxCopyLength)
	} else {
		// must have multiple search terms if term not found  or wouldn't be a result

		out = striptags(resultString)
		let initial = null
		let arrSearchTerm = searchTerm.split(' ')
		// lets highlight all terms
		for (let [index, term] of arrSearchTerm.entries()) {
			pos = 0
			while (pos >= 0) {
				pos = out.toLowerCase().indexOf(term, pos)
				if (pos >= 0) {
					if (!initial) initial = pos
					let actualTermText = out.substr(pos, term.length)
					out = out.replace(actualTermText, '<b>' + actualTermText + '</b>')
					pos += actualTermText.length + 7
				}
			}
		}

		let start = 0
		if (initial) start = initial - maxCopyLength / 2
		if (start < 0) start = 0

		return out.substr(start, maxCopyLength)
	}

	return out
}

export async function add(course: model.Course) {
	const txn = client.newTxn()
	try {
		const mu = new dgraph.Mutation()
		mu.setSetJson({
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

export async function textSearch(
	searchTerm: string
): Promise<api.textSearchResponse> {
	await setSchema(SCHEMA)
	const searches = [
		{label: 'allofterms', weight: weighting.large},
		{label: 'anyofterms', weight: weighting.small},
	]
	const predicates = [
		{label: 'title', weight: weighting.large},
		{label: 'shortDescription', weight: weighting.medium},
		{label: 'description', weight: weighting.small},
	]

	let resp: model.textSearchResult[] = []
	let hashMap: Record<string, model.textSearchResult> = {}
	for (let search of searches) {
		for (let predicate of predicates) {
			let query =
				`{entries(func: ` +
				search.label +
				`(` +
				predicate.label +
				`, "` +
				searchTerm +
				`")) {
	       uid
		   expand(_all_)
		}}`

			const qresp = await client.newTxn().query(query)
			const entries = qresp.getJson().entries

			for (let entry of entries) {
				let searchResult: model.textSearchResult = {
					uid: entry.uid,
					title: entry.title,
					searchText: formatResultString(entry[predicate.label], searchTerm),
					weight:
						(predicate.weight as number) *
						search.weight *
						termWeight(entry[predicate.label], searchTerm),
				}
				if (
					!hashMap[entry.uid] ||
					searchResult.weight > hashMap[entry.uid].weight
				) {
					// do not add to results if exist or exists but has higher weighting
					searchResult.title += '[weight :' + searchResult.weight + ' ]'
					hashMap[entry.uid] = searchResult
				}
			}
		}
	}

	// have complete hashMapmap push to simple array

	for (let index in hashMap) {
		resp.push(hashMap[index])
	}
	return {
		entries: resp.sort((a, b) => {
			if (a.weight < b.weight) return 1
			if (a.weight > b.weight) return -1
			return 0
		}),
	}
}

export async function elasticSearch(
	searchTerm: string
): Promise<api.textSearchResponse> {
	let query = {
		size: 100,
		body: {
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
	connect()
	let resp: model.textSearchResult[] = []

	resp = await elasticClient.search(query).then(function(res) {
		for (let entry of res.hits.hits) {
			let searchResult: model.textSearchResult = {
				uid: entry._id,
				title: (entry._source as any).title,
				searchText: entry.highlight[Object.keys(entry.highlight)[0]][0],
				weight: entry._score,
			}

			resp.push(searchResult)
		}
		return resp
	})
	return {entries: resp}
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

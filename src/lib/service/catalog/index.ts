import * as parse from 'csv-parse/lib/sync'
import * as dgraph from 'dgraph-js'
import * as fs from 'fs'
import * as path from 'path'
import * as grpc from 'grpc'
import * as model from 'lib/model'
import * as api from 'lib/service/catalog/api'

const {DGRAPH_ENDPOINT = 'localhost:9080'} = process.env

const SCHEMA = `tags: [string] @count @index(term) .
title: string @index(fulltext) .
shortDescription: string .
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

const client = new dgraph.DgraphClient(
	new dgraph.DgraphClientStub(
		DGRAPH_ENDPOINT,
		grpc.credentials.createInsecure()
	)
)

export async function add(course: model.Course) {
	const txn = client.newTxn()
	try {
		const mu = new dgraph.Mutation()
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
			} else {
				course[attributes[i]] = line[i] && line[i].replace(/\\n/g, '\n')
			}
		}
		await add(course)
	}
	/* tslint:enable */
}

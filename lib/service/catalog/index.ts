import * as fs from 'fs'
import * as parse from 'csv-parse/lib/sync'
import * as dgraph from 'dgraph-js'
import * as grpc from 'grpc'
import * as api from './api'
import * as elko from '../elko'

const {DGRAPH_ENDPOINT = 'localhost:9080'} = process.env

const SCHEMA = `tags: [string] @count @index(term) .
title: string @index(fulltext) .
shortDescription: string .
description: string .
learningOutcomes: string .
type: string .
uri: string .
identifier: string .
`

// TODO(tav): Figure out how to make client requests respect deadlines.
const client = new dgraph.DgraphClient(
	new dgraph.DgraphClientStub(
		DGRAPH_ENDPOINT,
		grpc.credentials.createInsecure()
	)
)

export async function add(ctx: elko.Context, {entry}: {entry: api.Entry}) {
	const txn = client.newTxn()
	try {
		const mu = new dgraph.Mutation()
		mu.setSetJson({
			description: entry.description || '',
            identifier: entry.identifier || '',
			learningOutcomes: entry.learningOutcomes || '',
			shortDescription: entry.shortDescription || '',
			tags: entry.tags || [],
			title: entry.title || '',
			type: entry.type || '',
			uid: entry.uid || null,
			uri: entry.uri || '',
		})
		mu.setCommitNow(true)
		const assigned = await txn.mutate(mu)
		return assigned.getUidsMap().get('blank-0') || entry.uid
	} finally {
		await txn.discard()
	}
}

export async function get(ctx: elko.Context, {id}: {id: string}) {
    await setSchema(ctx, {schema: SCHEMA})

	const txn = client.newTxn()
	try {
        const query = `query all($id: string) {
			entries(func: uid($id)) {
				identifier
				tags
				title
				type
				uid
				uri
				shortDescription
				description
				learningOutcomes
			}
		}`
        const qresp = await client.newTxn().queryWithVars(query, {$id: id})
        const entries = qresp.getJson().entries
        return entries[0]
	} finally {
		await txn.discard()
	}
}

export async function search(
	ctx: elko.Context,
	req: api.SearchRequest
): Promise<api.SearchResponse> {
    await setSchema(ctx, {schema: SCHEMA})

	const map: Record<string, [number, number, api.Entry]> = {}
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
		(a: [number, number, api.Entry], b: [number, number, api.Entry]) => {
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
	const resp: api.Entry[] = []
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

export async function setSchema(ctx: elko.Context, {schema}: {schema: string}) {
	const op = new dgraph.Operation()
	op.setSchema(schema)
	await client.alter(op)
}

export async function wipe(ctx: elko.Context) {
	const op = new dgraph.Operation()
	op.setDropAll(true)
	await client.alter(op)
}

function u8ToStr(arr) {
	var buf = Buffer.from(arr.buffer).toString()
	if (arr.byteLength !== arr.buffer.byteLength) {
		buf = buf.slice(arr.byteOffset, arr.byteOffset + arr.byteLength)
	}
	return buf.toString()
}

export async function listAll(
	ctx: elko.Context,
	req: api.SearchRequest
): Promise<api.SearchResponse> {
    await setSchema(ctx, {schema: SCHEMA})

	const query = `{
		entries(func: ge(count(tags), 1)) {
			identifier
			tags
			title
			type
			uid
			uri
			shortDescription
			description
			learningOutcomes
		}
	}`
	const qresp = await client.newTxn().query(query)
	let results

	try {
		results = qresp.getJson().entries
	} catch (e) {
		let jsonString = u8ToStr(qresp.array[0])
		if (!jsonString.startsWith('{')) {
			jsonString = '{' + jsonString
		}
		results = JSON.parse(
			jsonString.substring(0, jsonString.lastIndexOf('}') + 1)
		).entries
	}

	results.sort(
		(a: [number, number, api.Entry], b: [number, number, api.Entry]) => {
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
	const resp: api.Entry[] = []
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

export async function resetCourses(ctx: elko.Context) {
	await wipe(ctx)
    await setSchema(ctx, {schema: SCHEMA})

	const rawData = fs.readFileSync(__dirname + '/data.csv')
	const lines = parse(rawData)
	const attributes = lines.shift()

	for (const line of lines) {
		let course = {}
		for (const i in attributes) {
			course[attributes[i]] = line[i]
		}
		await add(ctx, {entry: course}).catch((err: Error) => {
			console.log(err)
		})
	}
}

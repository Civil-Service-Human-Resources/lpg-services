import * as dgraph from 'dgraph-js'
import * as grpc from 'grpc'
import * as api from 'management-ui/service/catalog/api'
import * as elko from 'ui/service/elko'

const {DGRAPH_ENDPOINT = 'localhost:9080'} = process.env

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
			tags: entry.tags || [],
			title: entry.title || '',
			uri: entry.uri || '',
		})
		mu.setCommitNow(true)
		const assigned = await txn.mutate(mu)
		return assigned.getUidsMap().get('blank-0')
	} finally {
		await txn.discard()
	}
}

export async function search(
	ctx: elko.Context,
	req: api.SearchRequest
): Promise<api.SearchResponse> {
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

export async function listAll(
	ctx: elko.Context,
	req: api.SearchRequest
): Promise<api.SearchResponse> {

	const query = `{
		entries(func: ge(count(tags), 1)) {
			tags
			title
			shortDescription
			uid
			uri
		}
	}`
	const qresp = await client.newTxn().query(query)
	const results = qresp.getJson().entries

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

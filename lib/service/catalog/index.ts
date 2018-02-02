import * as dgraph from 'dgraph-js'
import * as grpc from 'grpc'
import * as api from './api'
import * as elko from '../elko'

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
			shortDescription: entry.shortDescription || '',
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
	const query = `{
		entries(func: ge(count(tags), 1)) {
			shortDescription
			tags
			title
			uid
			uri
		}
	}`
	const qresp = await client.newTxn().query(query)
	let results

	try {
		results = qresp.getJson().entries
	} catch (e) {
		let jsonString = u8ToStr(qresp.array[0])
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

export async function resetCourses(ctx: elko.Context, schema: string) {
	await wipe(ctx)
	await setSchema(ctx, {schema: schema})

	const tags = ['profession:commercial', 'department:cshr', 'grade:aa']
	const mandatoryTags = [...tags, 'mandatory']

	const BASE_COURSES = [
		{
			shortDescription:
				'For anyone who handles information and needs to share and protect it.',
			tags: mandatoryTags,
			title: 'Responsible for information: general user',
		},
		{
			shortDescription:
				'Helps you to understand unconscious bias and how it affects attitudes, behaviours and decision-making.',
			tags: mandatoryTags,
			title: 'Unconcious bias',
		},
		{
			shortDescription:
				'Everyone needs to be able to identify, manage and control health and safety risks in the workplace.',
			tags: mandatoryTags,
			title: 'Health and safety awareness for all staff',
		},
		{
			shortDescription:
				'Gives you the knowledge to recognise different types of disability and the confidence to respond to the needs of disabled colleagues.',
			tags: mandatoryTags,
			title: 'Disability awareness',
		},
		{
			shortDescription:
				'An introduction to workplace diversity and an overview of equality legislation.',
			tags: mandatoryTags,
			title: 'Equality and diversity essentials',
		},
		{
			shortDescription:
				'This course provides a basic knowledge of fire prevention in the office and the dangers of fire.',
			tags: mandatoryTags,
			title: 'Basic fire awareness for all staff',
		},
		{
			shortDescription:
				'Information and guidance pack covers the course aims and outcomes, as well as costs and the cancellation policy.',
			tags: [...tags, 'resource'],
			title: 'Early market engagement',
		},
		{
			shortDescription:
				'Helps you take a wider perspective on your work - developing your ability to see the bigger picture, to put your own work in context and to see the interconnections',
			tags: [...tags, 'grade:g7'],
			title: 'Operating strategically',
		},
		{
			shortDescription:
				'Reduces unnecessary complexity and wasteful procurement, by providing faster procurement that costs less to the taxpayer.',
			tags: [...tags, 'grade:aa', 'grade:eo', 'grade:heo', 'grade:g7'],
			title: 'Lean sourcing',
		},
		{
			shortDescription:
				'There’s more to the commercial process than simply finding the right supplier and having an appropriate contract in place.',
			tags: [...tags, 'grade:g6'],
			title: 'Commercial cycle 4: contract management',
		},
		{
			shortDescription:
				'​Contracting for Agile software development should focus on enabling a smooth vendor-client relationship rather than on specifying terms and conditions in exhaustive detail.',
			tags: ['blog post'],
			title: 'Going Agile: The new mind-set for procurement officials',
			uri:
				'https://www2.deloitte.com/insights/us/en/industry/public-sector/agile-in-government-procurement-mindset.html',
		},
		{
			shortDescription: '',
			tags: ['blog post', 'LinkedIn'],
			title: "Let's talk about public procurement.",
			uri:
				'https://www.linkedin.com/pulse/lets-talk-public-procurement-james-findlay/',
		},
		{
			shortDescription:
				'This is the first Difrent Group sponsored Unconference in the newly refurbished conference facilities at National Archives, Kew on 5th March 2018.',
			tags: ['Conference'],
			title: 'Agile P1.0',
			uri: 'https://www.eventbrite.co.uk/e/agile-p10-tickets-41337414319',
		},
		{
			shortDescription:
				"One of the goals of an agile organization is to continuously improve, by reflecting on what's happened at the end of an iteration",
			tags: ['Blog post', 'Github'],
			title: 'Lessons Learned From "Search" Procurement',
			uri:
				'https://github.com/AlaskaDHSS/EIS-Modernization/blob/master/vendor-info/retrospective-on-buy-1.md',
		},
		{
			shortDescription:
				'Whenever the team at OSL talk to businesses about Supplier Collaboration and Innovation (SC&I), one key theme always comes through. The challenge of linking procurement activity directly to business objectives.',
			tags: ['Blog post'],
			title: 'Aligning Suppliers: Insight from a former Mars CPO',
			uri:
				'http://blog.vizibl.co/aligning-suppliers-insight-from-a-former-mars-cpo/?utm_content=65697372&utm_medium=social&utm_source=twitter',
		},
		{
			shortDescription: '',
			tags: ['CIPS'],
			title: 'Overview of the Thomas-Kilmann Conflict Mode Instrument (TKI)',
			uri:
				'http://www.kilmanndiagnostics.com/overview-thomas-kilmann-conflict-mode-instrument-tki',
		},
		{
			shortDescription: '',
			tags: ['Blog post'],
			title: 'IS THE CPO AND CATEGORY MANAGEMENT DEAD?',
			uri:
				'https://procurementstories.com/2017/03/24/is-the-cpo-and-category-management-dead/?utm_content=60894668&utm_medium=social&utm_source=twitter',
		},
		{
			shortDescription: '',
			tags: ['Blog post'],
			title:
				'A Definitive Guide to Mastering the Four Faces of the Procurement Specialist ',
			uri:
				'https://www.cleanmarklabels.com/blog/four-faces-of-procurement-specialist?utm_campaign=buffer&utm_content=60894658&utm_medium=social&utm_source=twitter',
		},
		{
			shortDescription: '',
			tags: ['LinkedIn'],
			title:
				'MUST-READ: I asked 9 CPOs how they improve relationships with their business partners - here is what they said:',
			uri:
				'https://www.linkedin.com/pulse/must-read-i-asked-9-cpos-how-improve-relationships-here-gutzmann-1/?utm_content=59740579&utm_medium=social&utm_source=twitter',
		},
		{
			shortDescription: '',
			tags: ['IACCM'],
			title: 'The Purpose of a Contract',
			uri: 'https://www2.iaccm.com/resources/?id=9591',
		},
		{
			shortDescription: '',
			tags: ['IACCM'],
			title: 'The Role of a Contract Manager',
			uri: 'https://www2.iaccm.com/resources/?id=9592&cb=1488187167&',
		},
		{
			shortDescription: '',
			tags: ['IACCM'],
			title: 'Top Terms in Negotiation 2015',
			uri: 'https://www2.iaccm.com/resources/?id=8930&src=NAO',
		},
		{
			shortDescription: '',
			tags: ['IACCM'],
			title: '10 Pitfalls to Avoid in Contracting',
			uri: 'https://www2.iaccm.com/resources/?id=8414&src=tenpitfallsspecial',
		},
		{
			shortDescription: '',
			tags: ['IACCM'],
			title:
				'Tackling the Weaknesses in Contract Management Pitfall 1: Lack of clarity in scope and goals',
			uri: 'https://www2.iaccm.com/resources/?id=9277&src=scopeandgoals',
		},
		{
			shortDescription: '',
			tags: ['IACCM'],
			title:
				'Tackling the Weaknesses in Contract Management Pitfall 2: Timing of Engagement',
			uri: 'https://www2.iaccm.com/resources/?id=9292&src=NAO',
		},
		{
			shortDescription: '',
			tags: ['IACCM'],
			title:
				'Tackling the weaknesses in Contract Management Pitfall 3: Stakeholder Engagement',
			uri: 'https://www2.iaccm.com/resources/?id=9378&src=NAO',
		},
		{
			shortDescription: '',
			tags: ['IACCM'],
			title:
				'Tackling the weaknesses in Contract Management Pitfall 4: Protracted Negotiations',
			uri: 'https://www2.iaccm.com/resources/?id=9526&src=NAO',
		},
		{
			shortDescription: '',
			tags: ['IACCM'],
			title: 'SME Policy and Practice',
			uri: 'https://www2.iaccm.com/resources/?id=9527&src=NAO',
		},
		{
			shortDescription: '',
			tags: ['IACCM'],
			title: 'Performance and Outcome-based contracts',
			uri: 'https://www2.iaccm.com/resources/?id=8541&src=NAO',
		},
		{
			shortDescription: '',
			tags: ['IACCM'],
			title: 'Contracts as a Connector',
			uri: 'https://www2.iaccm.com/resources/?id=8709&cb=1488188623&',
		},
		{
			shortDescription: '',
			tags: ['IACCM'],
			title: 'https://www2.iaccm.com/resources/?id=9594&cb=1488189981&',
			uri:
				'Contract and Commercial Management: The Operational Guide: Key Chapters for Download',
		},
		{
			shortDescription: '',
			tags: ['CIPS'],
			title: "Mendelow's matrix",
			uri:
				'http://kfknowledgebank.kaplan.co.uk/KFKB/Wiki%20Pages/Mendelow%27s%20matrix.aspx',
		},
		{
			shortDescription: '',
			tags: ['CIPS'],
			title: 'Talk on stakeholders',
			uri: 'https://hstalks.com/t/2203/stakeholders/?business',
		},
		{
			shortDescription: '',
			tags: ['CIPS'],
			title: 'Nogotiation articles',
			uri: 'https://www.negotiations.com/articles/',
		},
		{
			shortDescription: '',
			tags: ['CIPS'],
			title: 'Why is Contract Management so Important?',
			uri:
				'https://www.linkedin.com/pulse/why-contract-management-important-david-beare/',
		},
		{
			shortDescription: '',
			tags: ['CIPS'],
			title: 'Good practice contract management framework',
			uri:
				'https://www.nao.org.uk/report/good-practice-contract-management-framework-2-2/',
		},
		{
			shortDescription: '',
			tags: ['CIPS'],
			title: 'Microeconomics Versus Macroeconomics',
			uri:
				'https://www.thoughtco.com/microeconomics-versus-macroeconomics-1147004',
		},
		{
			shortDescription: '',
			tags: ['CIPS'],
			title: 'Call Yourself an Effective Leader?',
			uri:
				'https://www.cips.org/Documents/Knowledge/Procurement-Topics-and-Skills/8-People-and-Skills/Leadership-and-Promotion-of-PSM/Call_yourself_an_effective_leader.pdf',
		},
		{
			shortDescription: '',
			tags: ['CIPS'],
			title:
				'Purchasing and supply management: Collaboration Between Organisations',
			uri:
				'https://www.cips.org/Documents/Knowledge/Procurement-Topics-and-Skills/6-Efficiency/Collaborative-Working/POP-Collaboration_Between_Organisations.pdf',
		},
		{
			shortDescription: '',
			tags: ['CIPS'],
			title: 'CIPS article: Supplier Management (HS2)',
			uri:
				'https://www.cips.org/supply-management/news/2016/november/hs2-says-supplier-collaboration-will-keep-costs-down/',
		},
		{
			shortDescription: '',
			tags: ['CIPS'],
			title: 'Overview of the Thomas-Kilmann Conflict Mode Instrument (TKI)',
			uri:
				'http://www.kilmanndiagnostics.com/overview-thomas-kilmann-conflict-mode-instrument-tki',
		},
	]

	for (const course of BASE_COURSES) {
		await add(ctx, {entry: course}).catch((err: Error) => {
			console.log(err)
		})
	}
}

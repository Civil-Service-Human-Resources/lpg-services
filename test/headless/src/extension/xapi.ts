import axios from 'axios'

const {XAPI_URL = '', XAPI_PASS = '', XAPI_USER = ''} = process.env

export const Verb = {
	Completed: 'http://adlnet.gov/expapi/verbs/completed',
}

export async function addStatement(
	userId: string,
	courseId: string,
	verb: string,
	date: Date
) {
	const statement = {
		actor: {
			mbox: `mailto:noone@cslearning.gov.uk`,
			name: userId,
			objectType: 'Agent',
		},
		object: {
			id: `http://cslearning.gov.uk/courses/${courseId}`,
			objectType: 'Activity',
		},
		timestamp: date,
		verb: {
			id: verb,
		},
	}

	await axios.post(`${XAPI_URL}/statements`, JSON.stringify([statement]), {
		auth: {
			password: XAPI_PASS,
			username: XAPI_USER,
		},
		headers: {
			'Content-Type': 'application/json; charset=utf-8',
			'X-Experience-API-Version': '1.0.3',
		},
	})
}

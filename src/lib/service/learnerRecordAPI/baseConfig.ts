import axios from 'axios'
import * as https from 'https'

import * as config from '../../config'
import { LearnerRecordClient } from './learnerRecordClient'

const http = axios.create({
	baseURL: config.LEARNER_RECORD.url,
	httpsAgent: new https.Agent({
		keepAlive: true,
		maxFreeSockets: 15,
		maxSockets: 100,
	}),
	timeout: config.REQUEST_TIMEOUT,
})

export const client = new LearnerRecordClient(http)

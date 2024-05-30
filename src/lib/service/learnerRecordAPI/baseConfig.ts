import axios from 'axios'
import * as https from 'https'
import {LearnerRecordClient} from 'lib/service/learnerRecordAPI/learnerRecordClient'

import * as config from '../../config'

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

import * as express from 'express'
import {setLogoutFlag} from '../../civilServantRegistry/csrsService'
import {clearLearningCachesForCourse} from '../../cslService/cslServiceClient'

export async function logoutUser(req: express.Request, res: express.Response) {
	await setLogoutFlag(req.params.uid)
	return res.sendStatus(200)
}

export async function clearLearningCachesForUserAndCourse(req: express.Request, res: express.Response) {
	await clearLearningCachesForCourse(req.params.uid, req.params.courseId)
	return res.sendStatus(200)
}

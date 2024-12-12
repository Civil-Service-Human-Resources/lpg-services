import * as express from 'express'
import {setLogoutFlag} from 'lib/service/civilServantRegistry/csrsService'

export async function logoutUser(req: express.Request, res: express.Response, next: express.NextFunction) {
	await setLogoutFlag(req.params.uid)
	return res.sendStatus(200)
}

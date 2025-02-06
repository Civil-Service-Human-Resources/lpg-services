import * as express from 'express'
import {setLogoutFlag} from '../../civilServantRegistry/csrsService'

export async function logoutUser(req: express.Request, res: express.Response) {
	await setLogoutFlag(req.params.uid)
	return res.sendStatus(200)
}

import {Request, Response} from 'express'

export let index = (req: Request, res: Response) => {
	if (req.isAuthenticated()) {
		res.redirect('/home')
	} else {
		res.redirect('/sign-in')
	}
}

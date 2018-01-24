import {Request, Response} from 'express'
import {Profile} from 'ui/controllers/user'
import * as template from 'ui/template'

export let index = (req: Request, res: Response) => {
	let profile: Profile = {user: req.user}
	if (!req.user.profession) {
		res.redirect('/profile')
	} else {
		res.send(renderSearch(req, profile))
	}
}

function renderSearch(req: Request, props: Profile) {
	return template.render('search', req, props)
}

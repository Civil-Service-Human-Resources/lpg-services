import {Request, Response} from 'express'
import {Profile} from 'ui/controllers/user'
import * as template from 'ui/template'

export let index = (req: Request, res: Response) => {
	let profile: Profile = {user: req.user}
	res.send(renderSearch(profile))
}

function renderSearch(props: Profile) {
	return template.render('search', props)
}

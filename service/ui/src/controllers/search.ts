import {Request, Response} from 'express'
import {User} from 'ui/controllers/user'
import * as template from 'ui/template'

export let index = (req: Request, res: Response) => {
	res.send(renderSearch(req.user))
}

function renderSearch(user: User) {
	return template.render('search', user)
}

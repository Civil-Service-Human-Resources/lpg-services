import {Request, Response} from 'express'
import * as svelte from 'ui/svelte'
import {User} from 'ui/controllers/user'

export let index = (req: Request, res: Response) => {
	res.send(renderSearch(req.user))
}

function renderSearch(user: User) {
	return svelte.render('search', user)
}

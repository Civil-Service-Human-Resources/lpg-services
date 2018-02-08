import {Request, Response} from 'express'
import * as template from 'lib/ui/template'

export let basketPage = async (req: Request, res: Response) => {
	if (req.user.department) {
		res.send(renderBasketPage(req))
	} else {
		res.redirect('/profile')
	}
}

function renderBasketPage(req: Request) {
	return template.render('basket', req)
}

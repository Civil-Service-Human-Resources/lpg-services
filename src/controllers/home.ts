import {Request, Response} from 'express'
import * as svelte from 'ui/svelte'

export let index = (req: Request, res: Response) => {
	res.send(svelte.render('index'))
}

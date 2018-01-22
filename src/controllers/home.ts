import {Request, Response} from 'express'
import * as template from 'ui/template'

export let index = (req: Request, res: Response) => {
	res.send(template.render('index'))
}

import {Request, Response} from 'express'
import * as template from 'lib/ui/template'
import * as learningRecord from './learning-record'

export let basketPage = async (req: Request, res: Response) => {
	if (req.user.department) {
		res.send(
			template.render('basket', req, {
				courses: await learningRecord.getLearningRecordOf(
					learningRecord.CourseState.InProgress,
					req.user
				),
			})
		)
	} else {
		res.redirect('/profile')
	}
}

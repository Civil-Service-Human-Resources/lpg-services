import * as express from 'express'
import * as template from 'lib/ui/template'
import * as courseController from './course/index'
import * as catalog from 'lib/service/catalog'

export async function renderBookableCourseInformation(
	req: express.Request,
	res: express.Response
) {
	const courseId: string = req.params.courseId
	const course = await catalog.get(courseId)

	return res.send(
		template.render('booking/bookablecourse', req, {
			course,
			courseDetails: courseController.getCourseDetails(course),
		})
	)
}

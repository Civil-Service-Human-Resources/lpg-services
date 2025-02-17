// import {plainToInstance} from 'class-transformer'
import {plainToInstance} from 'class-transformer'
import * as express from 'express'
import * as extended from '../../lib/extended'
import * as template from '../../lib/ui/template'
import {CourseSearchQuery} from './search/models/courseSearchQuery'
import {searchForCourses} from './search/searchService'

export async function search(ireq: express.Request, res: express.Response) {
	const req = ireq as extended.CourseRequest
	const user = req.user
	const params = plainToInstance(CourseSearchQuery, req.query)
	const pageModel = await searchForCourses(params, user)
	res.send(
		template.render('search', req, res, {...pageModel})
	)
}

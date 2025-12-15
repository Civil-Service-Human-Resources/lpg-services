import {plainToInstance} from 'class-transformer'
import * as express from 'express'
import * as extended from '../../lib/extended'
import {CourseSearchQuery} from './search/models/courseSearchQuery'
import {searchForCourses} from './search/searchService'

export async function search(ireq: express.Request, res: express.Response) {
	const req = ireq as extended.CourseRequest
	const params = plainToInstance(CourseSearchQuery, req.query)
	const pageModel = await searchForCourses(params, req, res.locals.departmentHierarchyCodes)
	res.render('search/index.njk', {pageModel})
}

import {plainToInstance} from 'class-transformer'
import {Router} from 'express'
import * as express from 'express'
import {NSG_FLAG} from '../../../lib/config'
import {User} from '../../../lib/model'
import {getCategoryHomepage, getCategoryPage} from '../../../lib/service/cslService/cslServiceClient'
import {Category} from '../../../lib/service/cslService/models/learning/categories/category'
import * as asyncHandler from 'express-async-handler'
import {getPagination, Pagination, transformNumberedPagesToGovuk} from '../../../lib/utils/search'
import {CoursePaginationQuery} from './model/coursePaginationQuery'

export const router: express.Router = Router()

export type contentTypes = 'courses' | 'links'

router.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
	if (!NSG_FLAG) {
		if (!(req.user as User).hasRole('LEARNING_TAG_MANAGER')) {
			return res.redirect('/')
		}
	}
	next()
})

router.get('/', asyncHandler(index))
router.get('/topics/:url', asyncHandler(categoryPage()))
router.get('/topics/:url/courses', asyncHandler(categoryPage('courses')))
router.get('/topics/:url/links', asyncHandler(categoryPage('links')))

export async function index(req: express.Request, res: express.Response) {
	const homepage = await getCategoryHomepage(req.user)
	const cardsPerRow = homepage.categories.length % 2 === 0 ? 2 : 3
	const rows: Category[][] = []
	for (let i = 0; i < homepage.categories.length; i += cardsPerRow) {
		const chunk = homepage.categories.slice(i, i + cardsPerRow)
		rows.push(chunk)
	}
	return res.render('nsg/index.njk', {rows, cardsPerRow})
}

function categoryPage(contentType?: contentTypes) {
	return async (req: express.Request, res: express.Response) => {
		const url = req.params.url
		const query = plainToInstance(CoursePaginationQuery, {...req.query, categoryUrl: url, contentType})
		const page = await getCategoryPage(req.user, url, query.p, contentType)
		const pagination: Pagination = getPagination(query, page.getContentResponse())
		pagination.numberedPages = transformNumberedPagesToGovuk(pagination.numberedPages)
		res.locals.url = url
		return res.render('nsg/categoryPage.njk', {page, pagination})
	}
}

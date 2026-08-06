import {NextFunction, Request, Response, Router} from 'express'
import * as express from 'express'
import {ResourceNotFoundError} from '../../../lib/exception/ResourceNotFoundError'
import {User} from '../../../lib/model'
import {getCategoryHomepage, getCategoryPage} from '../../../lib/service/cslService/cslServiceClient'
import {Category} from '../../../lib/service/cslService/models/learning/categories/category'
import * as asyncHandler from 'express-async-handler'

export const router: express.Router = Router()

router.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
	if (!(req.user as User).hasRole('LEARNING_TAG_MANAGER')) {
		return res.redirect('/')
	}
	next()
})

router.get('/', asyncHandler(index))
router.get('/categories/:url', asyncHandler(categoryPage))

router.use(async (error: any, request: Request, response: Response, next: NextFunction) => {
	console.log('NOT FOUND')
	console.log(error)
	if (error instanceof ResourceNotFoundError) {
		return response.render('nsg/notFound.njk')
	}
	next()
})

export async function index(req: express.Request, res: express.Response) {
	const homepage = await getCategoryHomepage(req.user)
	const cardsPerRow = homepage.categories.length % 2 === 0 ? 2 : 3
	const rows: Category[][] = []
	for (let i = 0; i < homepage.categories.length; i += cardsPerRow) {
		const chunk = homepage.categories.slice(i, i + cardsPerRow)
		rows.push(chunk)
	}
	return res.render('nsg/index.njk', {rows})
}

export async function categoryPage(req: express.Request, res: express.Response) {
	const url = req.params.url
	const page = await getCategoryPage(req.user, url)
	return res.render('nsg/categoryPage.njk', {page})
}

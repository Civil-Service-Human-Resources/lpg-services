import {Express, NextFunction, Request, Response} from 'express'
import * as nunjucks from 'nunjucks'
import * as i18n from 'i18n'
import * as path from 'path'
import {IS_DEV, STATIC_DIR, LPG_MANAGEMENT_URL} from '../../config'
import * as datetime from '../../datetime'
import {appropriateFileSize, extension, extensionAndSize, fileName} from '../../filehelpers'
import {getLogger} from '../../logger'
import {toHtml} from '../template'

const viewsRoot = `${STATIC_DIR}/nunjucks`
const baseLayout = `${viewsRoot}/root/baseLayout.njk`
const components = `${viewsRoot}/components`
const partials = `${viewsRoot}/partials`

const nunjucksEndpoints = ['/courses/:courseId', '/learning-record']

const logger = getLogger(`nunjucks`)

export const register = (app: Express) => {
	const env = nunjucks.configure(viewsRoot, {
		autoescape: true,
		express: app,
		noCache: IS_DEV,
	})

	// global vars
	const globals: {[key: string]: string} = {
		baseLayout,
		components,
		partials,
		lpgManagementUrl: LPG_MANAGEMENT_URL,
	}
	logger.debug(`Registering nunjucks globals: ${JSON.stringify(globals)}`)
	Object.keys(globals).forEach(key => {
		env.addGlobal(key, globals[key])
	})

	// locale
	const i18nConfig = registerLocale(app)
	env.addGlobal('i18n', i18nConfig.__)

	// Custom filters
	env
		.addFilter('toHtml', toHtml)
		.addFilter('appropriateFileSize', appropriateFileSize)
		.addFilter('fileExtension', extension)
		.addFilter('fileName', fileName)
		.addFilter('fileExtensionAndSize', extensionAndSize)
		.addFilter('i18nList', (list: string[]) => {
			return list.map(l => i18nConfig.__(l))
		})
		.addFilter('formatDate', (date: string) => {
			return datetime.formatDate(new Date(date))
		})
		.addFilter('courseDuration', (durationString: string) => {
			return datetime.formatCourseDuration(parseInt(durationString))
		})

	// Middleware
	nunjucksEndpoints.forEach(endpoint => {
		app.get(endpoint, middleware())
	})

	if (IS_DEV) {
		env.on('load', (name, source, loader) => {
			logger.debug(`Loading template file ${name}`)
		})
	}
}

const registerLocale = (app: Express) => {
	const i18nConfig = {
		defaultLocale: 'en',
		directory: path.join(__dirname, '/../../../../locale'),
		locales: ['en'],
		objectNotation: true,
	}
	i18n.configure(i18nConfig)
	app.use(i18n.init)
	return i18n
}

export const middleware = () => {
	return (req: Request, res: Response, next: NextFunction) => {
		res.locals.signedInUser = req.user
		res.locals.originalUrl = req.originalUrl
		return next()
	}
}

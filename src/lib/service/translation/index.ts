import {IRouter} from 'express'
import * as i18n from 'i18n'
import * as path from 'path'

export const configure = (app: IRouter) => {
	i18n.configure({
		defaultLocale: 'en',
		directory: path.join(__dirname, '/../../../../locale'),
		locales: ['en', 'de'],
		objectNotation: true,
	})
	app.use(i18n.init)
}

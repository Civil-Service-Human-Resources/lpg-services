import {IRouter} from 'express'
import * as i18n from 'i18n'
import * as path from 'path'

export let configure = (app: IRouter) => {
	i18n.configure({
		defaultLocale: 'en',
		directory: path.join(path.dirname(process.cwd()), '/locale'),
		locales: ['en', 'de'],
		objectNotation: true,
	})
	app.use(i18n.init)
}

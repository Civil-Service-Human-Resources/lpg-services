import * as express from 'express'
import * as i18n from 'i18n'
import appRoot = require('app-root-path')

export let configure = (app: express.Express) => {
	i18n.configure({
		defaultLocale: 'en',
		directory: `${appRoot}/locale`,
		locales: ['en', 'de'],
		objectNotation: true,
	})
	app.use(i18n.init)
}

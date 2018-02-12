import * as express from 'express'
import * as i18n from 'i18n'

export let configure = (app: express.Express) => {
	i18n.configure({
		directory: __dirname + '/locales',
		locales: ['en', 'de'],
	})
	app.use(i18n.init)
}

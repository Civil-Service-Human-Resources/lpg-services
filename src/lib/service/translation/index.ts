import * as i18n from 'i18n'

export let configure = (app: Express.Application) => {
	i18n.configure({
		locales: ['en', 'de'],
		directory: __dirname + '/locales',
	})

	app.use(i18n.init)
}

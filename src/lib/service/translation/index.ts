import * as express from 'express'
import * as i18n from 'i18n'
import * as path from 'path'

export let configure = (app: express.Express) => {
	i18n.configure({
		directory: path.join(path.dirname(process.cwd()), '/locales'),
		locales: ['en', 'de'],
	})
	app.use(i18n.init)
}

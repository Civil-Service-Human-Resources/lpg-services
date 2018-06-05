import * as config from 'lib/config'
import * as datetime from 'lib/datetime'
import * as fileHelpers from 'lib/filehelpers'

import * as express from 'express'
import * as fs from 'fs'

import * as log4js from 'log4js'
import * as path from 'path'

/*tslint:disable*/
require('svelte/ssr/register')
const svelte = require('svelte')

const {Store} = require('svelte/store.umd.js')
/*tslint:enable*/

const rootDir = process.cwd()

const pageDir = path.join(rootDir, 'page')

const logger = log4js.getLogger('lib/template')

function isFile(path: string) {
	try {
		return fs.statSync(path).isFile()
	} catch (err) {
		return false
	}
}

function isDirectory(path: string) {
	try {
		return fs.statSync(path).isDirectory()
	} catch (err) {
		return false
	}
}

function toHtml(text: string) {
	if (text) {
		const lines = text
			.split('\n')
			.filter(line => !!line)
			.map(line => line.trim())

		let output = ''
		let inList = false
		for (const line of lines) {
			if (line.startsWith('•')) {
				if (!inList) {
					inList = true
					output += '<ul class="list-bullet u-space-b30">'
				}
				output += `<li>${line.substr(1).trim()}</li>`
			} else {
				if (inList) {
					inList = false
					output += '</ul>'
				}
				output += `<p>${line}</p>`
			}
		}
		return output
	}
	return ''
}

let currentRequest: express.Request
function getHelpers(): {} {
	const req = getCurrentRequest()
	return {
		config,
		datetime,
		fileHelpers,
		i18n: req.__ ? req.__.bind(req) : null,
		req,
		signedInUser: req.user,
		toHtml,
	}
}

function getCurrentRequest() {
	return currentRequest
}

function readPageDir(dir: string, nestedDirName?: string) {
	for (const file of fs.readdirSync(dir)) {
		if (isDirectory(path.join(dir, file))) {
			readPageDir(path.join(dir, file), file)
		}

		if (file.endsWith('.html')) {
			const pagepath = `${dir}/${file}`

			if (isDirectory(pagepath)) {
				readPageDir(pagepath)
			}

			try {
				svelte.parse(pagepath)
				logger.debug(`Page ${pagepath} can be parsed successfully`)
			} catch (e) {
				logger.error(`Page ${pagepath} can not be compiled. ${e}`)
			}
		}
	}
}

readPageDir(pageDir)

export function render(
	page: string,
	req: express.Request,
	res: express.Response,
	withData?: any
) {
	let pagePath = path.join(pageDir, page + '.html')
	if (!isFile(pagePath)) {
		pagePath = path.join(pageDir, page, 'index.html')
		if (!isFile(pagePath)) {
			throw new Error(`Could not find a matching .html file for ${page}`)
		}
	}

	const component = require(pagePath)

	currentRequest = req
	logger.debug(`rendering page: ${page}`)

	const data = {
		...withData,
		_csrf: res.locals._csrf,
	}
	const store = new Store({
		...getHelpers(),
	})
	return component.render(data, {store}).html
}

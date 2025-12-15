import {STATIC_DIR} from '../config'
import * as config from '../config'

import * as datetime from '../datetime'
import * as fileHelpers from '../filehelpers'

import * as express from 'express'
import * as fs from 'fs'

import * as path from 'path'
import {getLogger} from '../logger'

/*eslint-disable*/
require('svelte/ssr/register')
const {Store} = require('svelte/store.umd.js')
/*eslint-enable*/

export const pageDir = `${STATIC_DIR}/page`

const logger = getLogger('lib/template')

function isFile(filePath: string) {
	try {
		return fs.statSync(filePath).isFile()
	} catch {
		return false
	}
}

export function isDirectory(filePath: string) {
	try {
		return fs.statSync(filePath).isDirectory()
	} catch {
		return false
	}
}

export function toHtml(text: string) {
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
		getFirstKey,
		getKeys,
		i18n: req.__ ? req.__.bind(req) : null,
		isEmpty,
		req,
		signedInUser: req.user,
		toHtml,
	}
}

function getCurrentRequest() {
	return currentRequest
}

export function render(page: string, req: express.Request, res: express.Response, withData?: any) {
	let pagePath = path.join(pageDir, page + '.html')
	if (!isFile(pagePath)) {
		pagePath = path.join(pageDir, page, 'index.html')
		if (!isFile(pagePath)) {
			throw new Error(`Could not find a matching .html file for ${page} using dir ${pagePath}`)
		}
	}

	logger.debug(`loading page: ${page}`)
	/*eslint-disable*/
	const component = require(pagePath)
	/*eslint-enable*/

	currentRequest = req
	logger.debug(`rendering page: ${page}`)

	const data = {
		...withData,
		_csrf: res.locals._csrf,
	}

	const store = new Store({
		...getHelpers(),
	})

	let renderedComponent
	try {
		renderedComponent = component.render(data, {store}).html
	} catch (e) {
		console.log('Failed to render component')
		throw e
	}

	return renderedComponent
}

export function isEmpty(object: any) {
	return getKeys(object).length === 0
}

export function getFirstKey(object: any) {
	return getKeys(object).pop()
}

export function getKeys(object: any) {
	return Object.keys(object)
}

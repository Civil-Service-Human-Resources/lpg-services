import * as datetime from 'lib/datetime'
import * as fileHelpers from 'lib/fileHelpers'

import * as express from 'express'
import * as fs from 'fs'
import * as log4js from 'log4js'
import * as path from 'path'

/*tslint:disable*/
require('svelte/ssr/register')
/*tslint:enable*/

const rootDir = process.cwd()
const componentDir = path.join(rootDir, 'component')
const pageDir = path.join(rootDir, 'page')

const componentList: Record<string, string> = {}

const logger = log4js.getLogger('svelte compilation')

function isDirectory(path: string) {
	try {
		return fs.statSync(path).isDirectory()
	} catch (err) {
		return false
	}
}

function isFile(path: string) {
	try {
		return fs.statSync(path).isFile()
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

function componentIdentity(component: string): [string, string] {
	return [component.slice(0, -5), path.join(componentDir, component)]
}

function readComponentDir(dir: string, nestedDirName?: string) {
	for (const file of fs.readdirSync(dir)) {
		if (isDirectory(path.join(componentDir, file))) {
			readComponentDir(path.join(componentDir, file), file)
		}

		if (file.endsWith('.html')) {
			// componentList.push(componentIdentity(file))

			if (nestedDirName) {
				const [name, cPath]: [string, string] = componentIdentity(
					path.join(nestedDirName, file)
				)
				componentList[name.split('/').pop()!] = cPath
			} else {
				const [name, cPath]: [string, string] = componentIdentity(file)
				componentList[name] = cPath
			}
		}
	}
}

function readAll() {
	readComponentDir(componentDir)
}

export function renderTest(req: express.Request, res: express.Response) {
	currentRequest = req
	readAll()

	renderWithHelpers('Aatest', req, res, {answer: 42})
}

export function renderWithHelpers(
	page: string,
	req: express.Request,
	res: express.Response,
	withData: any
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
	logger.debug(`rendering component:${componentName}`)
	const component = require(componentList[componentName])
	const data = {
		...getHelpers(),
		...withData,
	}

	res.send(component.render(data))
}

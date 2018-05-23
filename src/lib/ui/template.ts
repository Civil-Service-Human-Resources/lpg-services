import * as express from 'express'
import * as fs from 'fs'
import * as config from 'lib/config'
import * as dateTime from 'lib/datetime'
import * as fileHelpers from 'lib/filehelpers'
import * as path from 'path'

import * as vm from 'vm'

/*tslint:disable*/
const svelte = require('svelte')
/*tslint:enable*/

interface AST {
	children: AST[]
	name: string
	type: string
}

interface ParseError {
	frame: string
	loc: {
		column: number
		line: number
	}
	message: string
	name: string
}

interface Renderer {
	render(props?: object): {html: string}
}

const rootDir = process.cwd()
const componentDir = path.join(rootDir, 'component')
const pageDir = path.join(rootDir, 'page')

let allComponentNames = ''

let componentList: {[name: string]: string} = {}

let components: {[key: string]: Renderer | undefined} = {}
let currentRequest: express.Request
let pages: {[key: string]: Renderer} = {}

function compile(
	path: string,
	source: string,
	name: string,
	isComponent?: boolean
): Renderer | undefined {
	// Ensure that there aren't any <script> blocks with content.
	svelte.preprocess(source, {
		script: (info: {content: string}): {code: string} => {
			if (info.content) {
				throw new Error(`ui/svelte: unexpected <script> tag found in ${path}`)
			}
			return {code: ''}
		},
	})
	let componentNames = allComponentNames
	let constructorName = name
	if (isComponent) {
		const componentSet = new Set(Object.keys(componentList))
		componentSet.delete(name)
		componentNames = Array.from(componentSet).join(', ')
	} else {
		constructorName = name + 'Page'
	}
	source += `
<script>
export default {
components: {${componentNames}},
data() {
    const req = getCurrentRequest()
    return {
        config: configModule,
        currentReq: req,
        datetime: dateTimeModule,
        fileHelpers,
        i18n: req.__ ? req.__.bind(req) : null,
        signedInUser: req.user,
        toHtml: toHtml,
    }
}
}
</script>
`
	let compiled
	try {
		compiled = svelte.parse(source, {
			css: false,
			dev: false,
			filename: path,
			format: 'cjs',
			generate: 'ssr',
			name: constructorName,
			shared: true,
			onwarn: () => {
				return
			},
		})
	} catch (err) {
		logParseError(path, err)
		return
	}
	return createModule(path, compiled.code, componentNames) as Renderer
}

function createModule(filename: string, code: string, componentNames: string) {
	const module = {exports: {}}
	const wrapper = vm.runInThisContext(
		`(function(module, exports, require, components, getCurrentRequest, configModule, dateTimeModule,
		 fileHelpers, toHtml) {
const {${componentNames}} = components
${code}
});`,
		{filename}
	)
	wrapper(
		module,
		module.exports,
		require,
		components,
		getCurrentRequest,
		config,
		dateTime,
		fileHelpers,
		toHtml
	)
	return module.exports
}

function gatherComponents(node: AST, seen: Set<string>) {
	if (node.type === 'Element' && isCapitalised(node.name)) {
		seen.add(node.name)
	}
	if (node.children && node.children.length) {
		for (const child of node.children) {
			gatherComponents(child, seen)
		}
	}
}

function getCurrentRequest() {
	return currentRequest
}

function getName(ident: string) {
	ident = ident.split('/').pop()!.replace(/-/g, '')
	return ident.charAt(0).toUpperCase() + ident.slice(1)
}

function getDependencies(root: AST) {
	const seen: Set<string> = new Set()
	gatherComponents(root, seen)
	return seen
}

function isCapitalised(ident: string) {
	if (!ident) {
		return false
	}
	const char = ident.charCodeAt(0)
	return char >= 65 && char <= 90
}

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

function componentIdentity(component: string): [string, string] {
	return [component.slice(0, -5), path.join(componentDir, component)]
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

function logParseError(path: string, err: ParseError) {
	if (err.name !== 'ParseError') {
		throw err
	}
	// console.error(`Error parsing ${path}:${err.loc.line}:${err.loc.column}`)
	console.error()
	console.error(err.frame)
	console.error()
	console.error(err.message)
	console.error()
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

function resetCache() {
	componentList = {}

	readComponentDir(componentDir)
	allComponentNames = Object.keys(componentList).join(', ')
	components = {}
	pages = {}
	const reverseDeps: Record<string, Set<string>> = {}
	const sources: Record<string, [string, string]> = {}
	// Do a first pass in order to figure out the component dependencies.
	for (const componentName of Object.keys(componentList)) {
		const componentPath = componentList[componentName]
		console.log(componentName)
		const source = fs.readFileSync(componentPath, {encoding: 'utf8'})
		try {
			const compiled = svelte.parse(source, {
				css: false,
				dev: false,
				filename: componentPath,
				format: 'cjs',
				generate: 'ssr',
				name: componentName,
				shared: true,
				onwarn: () => {
					return
				},
			})
			// TODO(tav): Handle cyclical dependencies.
			for (const dep of getDependencies(compiled.html)) {
				if (!reverseDeps[dep]) {
					reverseDeps[dep] = new Set()
				}
				reverseDeps[dep].add(componentName)
			}
			sources[componentName] = [componentPath, source]
		} catch (err) {
			logParseError(componentPath, err)
		}
	}
	// Do a second pass to figure out the right compilation order.
	const seq: string[] = []
	for (const componentName of Object.keys(componentList)) {
		let idx = seq.length
		const deps = reverseDeps[componentName]
		if (deps) {
			for (const dep of deps) {
				const depIdx = seq.indexOf(dep)
				if (depIdx === -1) {
					continue
				}
				if (depIdx < idx) {
					idx = depIdx
				}
			}
		}
		seq.splice(idx, 0, componentName)
	}
	// Do a final pass doing the actual Component compilation.
	for (const componentName of seq) {
		const [filepath, source] = sources[componentName]
		components[componentName] = compile(filepath, source, componentName, true)
	}
}

export function render(
	page: string,
	req: express.Request,
	res: express.Response,
	props?: any
): string {
	props = {...res.locals, ...props}
	if (props && props.signedInUser) {
		throw new Error('Attempt to override signedInUser in props')
	}

	let mod: Renderer | undefined = pages[page]
	currentRequest = req

	let pagePath = path.join(pageDir, page + '.html')
	if (!isFile(pagePath)) {
		pagePath = path.join(pageDir, page, 'index.html')
		if (!isFile(pagePath)) {
			throw new Error(`Could not find a matching .html file for ${page}`)
		}
	}
	const source = fs.readFileSync(pagePath, {encoding: 'utf8'})
	mod = compile(pagePath, source, getName(page))
	if (!mod) {
		throw new Error(`Could not compile renderer for ${page}`)
	}
	pages[page] = mod

	// TODO(tav): Should use source maps to show any errors here in the context
	// of the original HTML source as opposed to in the generated JavaScript
	// code/module.

	return mod.render(props).html
}

// TODO(tav): Populate the cache and clear it more intelligently, i.e. just the
// ones that need to be regenerated as opposed to wiping the whole cache
// whenever any template file changes.
if (!config.PRODUCTION_ENV) {
	fs.watch(componentDir, {}, resetCache)
	fs.watch(pageDir, {recursive: true}, resetCache)
}

resetCache()

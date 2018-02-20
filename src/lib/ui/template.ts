import * as express from 'express'
import * as fs from 'fs'
import * as config from 'lib/config'
import * as path from 'path'
import * as svelte from 'svelte'
import * as vm from 'vm'

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

let componentList: string[] = []
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
		const componentSet = new Set(componentList)
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
        i18n: req.__.bind(req),
        signedInUser: req.user,
    }
}
}
</script>
`
	let compiled
	try {
		compiled = svelte.compile(source, {
			css: false,
			dev: false,
			filename: path,
			format: 'cjs',
			generate: 'ssr',
			name: constructorName,
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
		`(function(module, exports, require, components, getCurrentRequest, configModule) {
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
		config
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
	ident = ident.split('/').pop()!.replace('-', '')
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

function logParseError(path: string, err: ParseError) {
	if (err.name !== 'ParseError') {
		throw err
	}
	console.log(`Error parsing ${path}:${err.loc.line}:${err.loc.column}`)
	console.log()
	console.log(err.frame)
	console.log()
	console.log(err.message)
	console.log()
}

function resetCache() {
	componentList = []
	for (const file of fs.readdirSync(componentDir)) {
		if (file.endsWith('.html')) {
			componentList.push(file.slice(0, -5))
		}
	}
	allComponentNames = componentList.join(', ')
	components = {}
	pages = {}
	const reverseDeps: Record<string, Set<string>> = {}
	const sources: Record<string, [string, string]> = {}
	// Do a first pass in order to figure out the component dependencies.
	for (const component of componentList) {
		const filepath = path.join(componentDir, component + '.html')
		const source = fs.readFileSync(filepath, {encoding: 'utf8'})
		try {
			const compiled = svelte.compile(source, {
				css: false,
				dev: false,
				filename: filepath,
				format: 'cjs',
				generate: 'ssr',
				name: component,
				onerror: (err: Error) => {
					throw err
				},
				onwarn: () => {
					return
				},
			})
			// TODO(tav): Handle cyclical dependencies.
			for (const dep of getDependencies(compiled.ast.html)) {
				if (!reverseDeps[dep]) {
					reverseDeps[dep] = new Set()
				}
				reverseDeps[dep].add(component)
			}
			sources[component] = [filepath, source]
		} catch (err) {
			logParseError(filepath, err)
		}
	}
	// Do a second pass to figure out the right compilation order.
	const seq: string[] = []
	for (const component of componentList) {
		let idx = seq.length
		const deps = reverseDeps[component]
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
		seq.splice(idx, 0, component)
	}
	// Do a final pass doing the actual Component compilation.
	for (const component of seq) {
		const [filepath, source] = sources[component]
		components[component] = compile(filepath, source, component, true)
	}
}

export function render(
	page: string,
	req: express.Request,
	props?: any
): string {
	if (props && props.signedInUser) {
		throw new Error('Attempt to override signedInUser in props')
	}

	let mod: Renderer | undefined = pages[page]
	currentRequest = req

	if (!mod) {
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
	}
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

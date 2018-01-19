import * as fs from 'fs'
import * as path from 'path'
import * as svelte from 'svelte'
import * as env from 'ui/env'
import * as vm from 'vm'

interface Renderer {
	render(props?: object): {html: string}
}

const rootDir = path.dirname(__dirname)
const componentDir = path.join(rootDir, 'component')
const pageDir = path.join(rootDir, 'page')

let allComponentNames = ''
let componentList: string[] = []
let components: {[key: string]: Renderer | undefined} = {}
let pages: {[key: string]: Renderer} = {}

function compile(
	path: string,
	name: string,
	isComponent?: boolean
): Renderer | undefined {
	let source = fs.readFileSync(path, {encoding: 'utf8'})
	// Ensure that there aren't any <script> blocks with content.
	svelte.preprocess(source, {
		script: (info: any) => {
			if (info.content) {
				throw new Error(
					`ui/svelte: unexpected <script> tag found in ${pagePath}`
				)
			}
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
components: {${componentNames}}
}
</script>
`
	let compiled
	try {
		compiled = svelte.compile(source, {
			css: false,
			dev: !env.PRODUCTION,
			filename: path,
			format: 'cjs',
			generate: 'ssr',
			name: constructorName,
		})
	} catch (err) {
		if (err.name !== 'ParseError') {
			throw err
		}
		console.log(`Error parsing ${path}:${err.loc.line}:${err.loc.column}`)
		console.log()
		console.log(err.frame)
		console.log()
		console.log(err.message)
		console.log()
		return
	}
	return createModule(path, compiled.code, componentNames) as Renderer
}

function createModule(filename: string, code: string, componentNames: string) {
	const module = {exports: {}}
	const wrapper = vm.runInThisContext(
		`(function(module, exports, require, components) {
const {${componentNames}} = components
${code}
});`,
		{filename}
	)
	wrapper(module, module.exports, require, components)
	return module.exports
}

function getName(ident: string) {
	ident = ident.split('/').pop()!.replace('-', '')
	return ident.charAt(0).toUpperCase() + ident.slice(1)
}

function isFile(path: string) {
	try {
		return fs.statSync(path).isFile()
	} catch (err) {
		return false
	}
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
	for (const component of componentList) {
		components[component] = compile(
			path.join(componentDir, component + '.html'),
			component,
			true
		)
	}
}

export function render(page: string, props?: object): string {
	let mod: Renderer | undefined = pages[page]
	if (!mod) {
		let pagePath = path.join(pageDir, page + '.html')
		if (!isFile(pagePath)) {
			pagePath = path.join(pageDir, page, 'index.html')
			if (!isFile(pagePath)) {
				throw new Error(`Could not find a matching .html file for ${page}`)
			}
		}
		mod = compile(pagePath, getName(page))
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
if (!env.PRODUCTION) {
	fs.watch(componentDir, {}, resetCache)
	fs.watch(pageDir, {recursive: true}, resetCache)
}

resetCache()

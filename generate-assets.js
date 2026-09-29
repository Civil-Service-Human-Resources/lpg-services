const esbuild = require('esbuild')
const sass = require('sass')
const fs = require('node:fs')

const manifest = {}
const _id = Math.random().toString(36).substring(2, 6)

const jsDir = 'js'
const stylesDir = 'styles'
const assets = './views/assets'
const jsSrc = `${assets}/${jsDir}`
const cssSrc = `${assets}/${stylesDir}`

const jsFile = name => {
	return {name: name, ext: 'js', outName: 'main.min', outExt: 'js', src: jsSrc}
}

const cssFile = name => {
	return {name: name, ext: 'scss', outExt: 'css', src: cssSrc}
}

const files = [jsFile('main'), cssFile('main'), cssFile('main.v2'), cssFile('main-nsg')]

files.forEach(file => {
	file.outName = file.outName === undefined ? file.name : file.outName
	const sourceFile = `${file.src}/${file.name}.${file.ext}`
	const outFile = `${file.outName}.${file.outExt}`
	const outFileId = `${file.outName}.${_id}.${file.outExt}`
	console.log(`sourceFile is: ${sourceFile}\noutFile is: ${outFile}\noutFileId is: ${outFileId}`)
	if (file.ext === 'js') {
		esbuild.buildSync({
			entryPoints: [sourceFile],
			bundle: true,
			minify: true,
			sourcemap: true,
			outfile: `${file.src}/${outFile}`,
		})
	} else {
		const res = sass.compile(sourceFile, {
			loadPaths: ['.'],
			style: 'compressed',
		})
		fs.writeFileSync(`${file.src}/${outFile}`, res.css)
	}
	manifest[outFile] = outFileId
})

fs.writeFileSync(`${assets}/manifest.json`, JSON.stringify(manifest, null, 4))

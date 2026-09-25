import * as esbuild from 'esbuild'
import * as sass from 'sass'
import * as fs from 'node:fs'

const manifest = {}
const _id = Math.random()
	.toString(36)
	.substring(2, 6)
manifest['id'] = _id

const assets = './views/assets'
const jsDir = "js"
const stylesDir = "styles"
const jsAssets = `${assets}/${jsDir}`
const cssAssets = `${assets}/${stylesDir}`

const files = [
	{name: 'main', ext: 'js', outName: 'main.min', outExt: 'js', src: jsAssets},
	{name: 'main', ext: 'scss', outExt: 'css', src: cssAssets},
	{name: 'main.v2', ext: 'scss', outExt: 'css', src: cssAssets},
	{name: 'main-nsg', ext: 'scss', outExt: 'css', src: cssAssets},
]


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
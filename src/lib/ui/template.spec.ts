import * as fs from 'fs'
import * as path from 'path'
import {isDirectory} from './template'
/*tslint:disable*/
require('svelte/ssr/register')
/*tslint:enable*/
import {expect} from 'chai'

const rootDir = process.cwd()
export const uiPageDir = path.join(rootDir, 'dist', 'ui', 'page')
export const managementPageDir = path.join(
	rootDir,
	'dist',
	'management-ui',
	'page'
)

function readPageDir(dir: string, prevErr?: any[], nestedDirName?: string) {
	const prev: any[] = prevErr || []
	for (const file of fs.readdirSync(dir)) {
		if (isDirectory(path.join(dir, file))) {
			readPageDir(path.join(dir, file), prev, file)
		}

		if (file.endsWith('.html')) {
			const pagepath = `${dir}/${file}`

			if (isDirectory(pagepath)) {
				readPageDir(pagepath, prev)
			}

			try {
				require(pagepath)

				console.debug(`${pagepath} can compile`)
			} catch (e) {
				console.error(
					`Page ${pagepath} can not be compiled.`,
					e.message,
					e.frame
				)
				prev.push(e)
			}
		}
	}
	return prev
}

describe('Testing templates and templating engine', () => {
	it('Should not return any errors when compiling ui pages', () => {
		const pageErrors = readPageDir(uiPageDir)
		expect(pageErrors.length).to.equal(0)
	})
	it('Should not return any errors when compiling management-ui pages', () => {
		const pageErrors = readPageDir(managementPageDir)
		expect(pageErrors.length).to.equal(0)
	})
})

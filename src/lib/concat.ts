import * as fs from 'fs'

export function files(filepaths: string[]) {
	return filepaths
		.map(path => fs.readFileSync(path, {encoding: 'utf-8'}))
		.join('\n')
}

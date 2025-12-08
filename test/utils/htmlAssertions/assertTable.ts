import {JSDOM} from 'jsdom'
import {assertHtml, HtmlAssertion, TextContentAsserter} from '../htmlUtils'

export interface TableAssertion {
	heading: TextContentAsserter[]
	rows: TextContentAsserter[][]
}

export const assertTable = (html: string, expectedTable: TableAssertion) => {
	const assertions: HtmlAssertion[] = []
	for (let i = 0; i < expectedTable.heading.length; i++) {
		const expThContent = expectedTable.heading[i]
		const expTh: HtmlAssertion = {
			querySelector: `thead tr th:nth-of-type(${i + 1})`,
			expected: {
				content: expThContent,
			},
		}
		assertions.push(expTh)
	}
	for (let i = 0; i < expectedTable.rows.length; i++) {
		const expRow = expectedTable.rows[i]
		for (let j = 0; j < expRow.length; j++) {
			const expTdContent = expRow[j]
			const expTd: HtmlAssertion = {
				querySelector: `tbody tr:nth-of-type(${i + 1}) td:nth-of-type(${j + 1})`,
				expected: {
					content: expTdContent,
				},
			}
			assertions.push(expTd)
		}
	}
	assertHtml(html, assertions)
}
export const assertTables = (html: string, expectedTables: TableAssertion[]) => {
	const doc = new JSDOM(html).window.document
	const tableHtmls = doc.getElementsByTagName('table')
	for (let i = 0; i < expectedTables.length; i++) {
		const expectedTable = expectedTables[i]
		const tableHtml = tableHtmls[i]
		assertTable(tableHtml.outerHTML, expectedTable)
	}
}

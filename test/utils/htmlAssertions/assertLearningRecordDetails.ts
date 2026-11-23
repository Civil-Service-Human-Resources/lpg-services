import {within} from '@testing-library/dom'
import {expect} from 'chai'

export interface CourseDetailsAssertion {
	expType: string
	expDuration: string | null
	expAreasOfWork: string[] | null
	expGrades: string[] | null
	expCost: string | null
}

const assertTableRow = (tableContainer: HTMLElement, heading: string, expectedText: string) => {
	const table = within(tableContainer)
	const thElement = table.getByRole('columnheader', {name: heading})
	const rowElement = thElement.closest('tr')
	within(rowElement as HTMLElement).getByRole('cell', {name: expectedText})
}

const assertTableRowList = (tableContainer: HTMLElement, heading: string, expectedList: string[]) => {
	const table = within(tableContainer)
	const thElement = table.getByRole('columnheader', {name: heading})
	const rowElement = thElement.closest('tr')
	expectedList.forEach(li => {
		within(rowElement as HTMLElement).getByText(li)
	})
}

export const assertCourseDetails = (html: HTMLElement, expValues: CourseDetailsAssertion) => {
	const tableElement = html.querySelector('table') as HTMLElement
	expect(tableElement).to.not.eql(null)

	assertTableRow(tableElement, 'Course type', expValues.expType)

	if (expValues.expDuration) {
		assertTableRow(tableElement, 'Duration', expValues.expDuration)
	}

	if (expValues.expAreasOfWork) {
		assertTableRow(tableElement, 'Key area', expValues.expAreasOfWork.join(', '))
	}

	if (expValues.expGrades) {
		assertTableRowList(tableElement, 'Level', expValues.expGrades)
	}

	if (expValues.expCost) {
		assertTableRow(tableElement, 'Cost', expValues.expCost)
	}
}

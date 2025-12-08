import {JSDOM} from 'jsdom'
import {assertDocMultiple, HtmlAssertion, TextContentAsserter} from '../htmlUtils'

export interface CourseDetailsAssertion {
	expType: string
	expDuration: string | null
	expAreasOfWork: string[] | null
	expLocation: string | null
	expGrades: string[] | null
	expCost: string | null
}

export const getDetailsRowAssertion = (expHeading: string, expText: string): HtmlAssertion[] => {
	return [
		{
			querySelector: 'th.lpg-related-items__th',
			expected: {
				content: new TextContentAsserter(expHeading),
			},
		},
		{
			querySelector: 'td.lpg-related-items__td',
			expected: {
				content: new TextContentAsserter(expText),
			},
		},
	]
}
export const assertCourseDetails = (html: string, expValues: CourseDetailsAssertion) => {
	const doc = new JSDOM(html).window.document
	const assertions: [HtmlAssertion[]] = [getDetailsRowAssertion('Course type', expValues.expType)]
	if (expValues.expDuration) {
		assertions.push(getDetailsRowAssertion('Duration', expValues.expDuration))
	}
	if (expValues.expAreasOfWork) {
		assertions.push(getDetailsRowAssertion('Key area', expValues.expAreasOfWork.join(', ')))
	}
	if (expValues.expLocation) {
		assertions.push(getDetailsRowAssertion('Location', expValues.expLocation))
	}
	if (expValues.expGrades) {
		assertions.push(getDetailsRowAssertion('Level', expValues.expGrades.join(', ')))
	}
	if (expValues.expCost) {
		assertions.push(getDetailsRowAssertion('Cost', expValues.expCost))
	}
	const elems = doc.querySelectorAll('tr')
	for (let i = 0; i < elems.length; i++) {
		const elem = elems[i]
		const assertion = assertions[i]
		assertDocMultiple(elem, assertion)
	}
}

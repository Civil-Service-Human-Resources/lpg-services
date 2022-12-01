import {expect} from 'chai'
import {User} from 'lib/model'

import * as service from './suggestedLearningService'
import {Suggestion} from './suggestion'

const sampleUser = User.create({
	grade: {code: '7', name: 'Grade 7'},
	interests: [{name: 'Commercial'}, {name: 'EU'}],
	organisationalUnit: {
		code: 'ORG',
		id: 123,
	},
	otherAreasOfWork: [
		{id: 2, name: 'Communications'},
		{id: 3, name: 'DDaT'},
		{id: 4, name: "I don't know"},
	],
	profession: {
		id: 1,
		name: 'Analysis',
	},
})

const sampleDepartmentCodes = ['ORG', 'ORG-PARENT', 'ORG-GRANDPARENT']

describe('suggestedLearningService tests', () => {
	describe('User detail functions', () => {
		it('Should test that getAreasOfWorkForUser', () => {
			const areasOfWork = service.getAreasOfWorkForUser(sampleUser)
			expect(areasOfWork).to.eql(['Analysis'])
		})
		it('Should test that getOtherAreasOfWorkForUser', () => {
			const areasOfWork = service.getOtherAreasOfWorkForUser(sampleUser)
			expect(areasOfWork).to.eql(['Communications', 'DDaT', "I don't know"])
		})
		it('Should test that getInterestsForUser', () => {
			const areasOfWork = service.getInterestsForUser(sampleUser)
			expect(areasOfWork).to.eql(['Commercial', 'EU'])
		})
	})

	describe('Parameter building functions', () => {
		describe('createParamsForDepartmentSection function', () => {
			it('Should create suggestion parameter for the users department', () => {
				const sections = service.createParamsForDepartmentSection(sampleDepartmentCodes, sampleUser)
				const section = sections[0]
				expect(section.params!).to.eql({
					departments: 'ORG,ORG-PARENT,ORG-GRANDPARENT',
					grade: '7',
					page: 0,
					size: 200,
				})
				expect(section.key).to.eql('ORG')
				expect(section.suggestion).to.eql(Suggestion.DEPARTMENT)
			})
		})

		describe('createParamsForAreaOfWorkSection function', () => {
			it('Should create suggestion parameter for the users areas of work', () => {
				const sections = service.createParamsForAreaOfWorkSection(sampleDepartmentCodes, sampleUser)
				const section = sections[0]
				expect(section.params!).to.eql({
					areaOfWork: 'Analysis',
					excludeDepartments: 'ORG,ORG-PARENT,ORG-GRANDPARENT',
					grade: '7',
					page: 0,
					size: 200,
				})
				expect(section.key).to.eql('Analysis')
				expect(section.suggestion).to.eql(Suggestion.AREA_OF_WORK)
			})
			it(`Should create suggestion parameter for the users areas of work,
				filtering out the API params if the profession is "I don't know"`, () => {
				const user = User.create(sampleUser)
				user.areasOfWork = ["I don't know"]
				const sections = service.createParamsForAreaOfWorkSection(sampleDepartmentCodes, user)
				const section = sections[0]
				expect(section.params).to.eql(undefined)
				expect(section.key).to.eql(`I don't know`)
				expect(section.suggestion).to.eql(Suggestion.AREA_OF_WORK)
			})
		})

		describe('createParamsForOtherAreasOfWorkSection function', () => {
			it('Should create suggestion parameter for the users other areas of work, with filtering', () => {
				const sections = service.createParamsForOtherAreasOfWorkSection(sampleDepartmentCodes, sampleUser)
				const commSection = sections[0]
				expect(commSection.params!).to.eql({
					areaOfWork: 'Communications',
					excludeAreasOfWork: `Analysis,DDaT,I don't know`,
					excludeDepartments: 'ORG,ORG-PARENT,ORG-GRANDPARENT',
					grade: '7',
					page: 0,
					size: 200,
				})
				expect(commSection.key).to.eql('Communications')
				expect(commSection.suggestion).to.eql(Suggestion.OTHER_AREAS_OF_WORK)

				const ddatSection = sections[1]
				expect(ddatSection.params!).to.eql({
					areaOfWork: 'DDaT',
					excludeAreasOfWork: `Analysis,Communications,I don't know`,
					excludeDepartments: 'ORG,ORG-PARENT,ORG-GRANDPARENT',
					grade: '7',
					page: 0,
					size: 200,
				})
				expect(ddatSection.key).to.eql('DDaT')
				expect(ddatSection.suggestion).to.eql(Suggestion.OTHER_AREAS_OF_WORK)

				const iDontKnowSection = sections[2]
				expect(iDontKnowSection.params).to.eql(undefined)
				expect(iDontKnowSection.key).to.eql("I don't know")
				expect(iDontKnowSection.suggestion).to.eql(Suggestion.OTHER_AREAS_OF_WORK)
			})
		})

		describe('createParamsForInterestsSection function', () => {
			it('Should create suggestion parameter for the users interests', () => {
				const sections = service.createParamsForInterestsSection(sampleDepartmentCodes, sampleUser)
				const commercialSection = sections[0]
				expect(commercialSection.params!).to.eql({
					excludeAreasOfWork: `Analysis,Communications,DDaT,I don't know`,
					excludeDepartments: 'ORG,ORG-PARENT,ORG-GRANDPARENT',
					excludeInterests: 'EU',
					grade: '7',
					interest: 'Commercial',
					page: 0,
					size: 200,
				})
				expect(commercialSection.key).to.eql('Commercial')
				expect(commercialSection.suggestion).to.eql(Suggestion.INTERESTS)

				const euSection = sections[1]
				expect(euSection.params!).to.eql({
					excludeAreasOfWork: `Analysis,Communications,DDaT,I don't know`,
					excludeDepartments: 'ORG,ORG-PARENT,ORG-GRANDPARENT',
					excludeInterests: 'Commercial',
					grade: '7',
					interest: 'EU',
					page: 0,
					size: 200,
				})
				expect(euSection.key).to.eql('EU')
				expect(euSection.suggestion).to.eql(Suggestion.INTERESTS)
			})
		})
	})
})

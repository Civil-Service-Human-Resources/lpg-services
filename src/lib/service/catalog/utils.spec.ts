import {assert} from 'chai'
import { Audience, Course, OrganisationalUnit, User } from 'lib/model'
import * as registryClient from "lib/registry"
import { AudienceBracket, AudienceMap, AudienceWithScore,
	getAudience, getAudienceRelevanceForUser, getDepartmentRelevancyScore,
	getOrgHierarchy, MandatoryAudienceBracket, StandardAudienceBracket } from 'lib/service/catalog/utils'
import sinon = require('sinon')

const createAudienceWithDep = (depCode: string) => {
	const data = {departments: [depCode]}
	return Audience.create(data)
}

const today = new Date()
const yesterday = new Date(today)
yesterday.setDate(yesterday.getDate() - 1)

const orgStructure = [
	OrganisationalUnit.create({
		code: "DEP003",
		id: 3,
		name: "DEP003",
		paymentMethods: "",
	}),
	OrganisationalUnit.create({
		code: "DEP002",
		id: 2,
		name: "DEP002",
		paymentMethods: "",
	}),
	OrganisationalUnit.create({
		code: "DEP001",
		id: 1,
		name: "DEP001",
		paymentMethods: "",
	}),
]
const getParentOrgsStub = sinon.stub(registryClient, "getParentOrgs").returns(Promise.resolve(orgStructure))

describe('#getOrgHierarchy()', () => {
	it("Should build the hierarchy correctly", async () => {
		const hierarchyCode = "DEP003"
		const parentOrgs = await getOrgHierarchy(hierarchyCode)
		assert(getParentOrgsStub.calledWith(hierarchyCode), `stub wasn't called with ${hierarchyCode}`)
		assert(parentOrgs[0] === hierarchyCode, `1st code was ${parentOrgs[0]}`)
		assert(parentOrgs[1] === "DEP002", `2nd code was ${parentOrgs[1]}`)
		assert(parentOrgs[2] === "DEP001", `3rd code was ${parentOrgs[2]}`)
	})
})

describe('#getDepartmentRelevancyScore()', () => {
	const audience = createAudienceWithDep("TEST001")
	it("Should return a score of 0 for no matching department", async () => {
		const score = await getDepartmentRelevancyScore(audience, ["TEST005"])
		assert(score === 0, `Score was ${score}`)
	})

	it("Should return a score of 1 for a matching department", async () => {
		const score = await getDepartmentRelevancyScore(audience, ["TEST001"])
		assert(score === 1, `Score was ${score}`)
	})

	it("Should return a score of 3 for a matching mandatory parent department", async () => {
		audience.requiredBy = new Date()
		const score = await getDepartmentRelevancyScore(audience, ["TEST005", "TEST001"])
		assert(score === 3, `Score was ${score}`)
	})

	it("Should return a score of 4 for a matching mandatory department", async () => {
		audience.requiredBy = new Date()
		const score = await getDepartmentRelevancyScore(audience, ["TEST001", "TEST005"])
		assert(score === 4, `Score was ${score}`)
	})
})

describe("#getAudienceRelevanceForUser()", () => {
	it("Should return a score of 0 if there is no area of work, department or grade", async () => {
		const aud = Audience.create({})
		const audWithScore = await getAudienceRelevanceForUser(aud, [], [], "")
		assert(audWithScore.score === 0, `Score was ${audWithScore.score}`)
	})

	it("Should return a score of 1 if only the area of work matches", async () => {
		const aud = Audience.create({areasOfWork: ["AOW001"]})
		const audWithScore = await getAudienceRelevanceForUser(aud, ["AOW001"], [], "")
		assert(audWithScore.score === 0, `Score was ${audWithScore.score}`)
	})

	it("Should return a score of 1 if only the grade matches", async () => {
		const aud = Audience.create({grades: ["GRD001"]})
		const audWithScore = await getAudienceRelevanceForUser(aud, [], [], "GRD001")
		assert(audWithScore.score === 0, `Score was ${audWithScore.score}`)
	})

	it("Should return a score of -1 if there are no matches", async () => {
		const aud = Audience.create({
			areasOfWork: ["AOW001", "AOW002"],
			departments: ["DEP001"],
			grades: ["GRD001"],
		})
		const audWithScore = await getAudienceRelevanceForUser(aud, ["AOW003"], ["DEP002"], "GRD002")
		assert(audWithScore.score === -1, `Score was ${audWithScore.score}`)
	})

})

describe("#AudienceMap", () => {
	describe("#addAudience()", () => {
		it("Should correctly add audiences to the correct bracket", async () => {
			const testBrackets: AudienceBracket[] = [
				new MandatoryAudienceBracket(2, 3),
				new MandatoryAudienceBracket(0, 1),
			]
			const audienceMap = new AudienceMap(testBrackets)
			const audienceWithScoreOne = new AudienceWithScore(Audience.create({}), 2)
			const audienceWithScoreTwo = new AudienceWithScore(Audience.create({}), 0)
			audienceMap.addAudience(audienceWithScoreOne)
			audienceMap.addAudience(audienceWithScoreTwo)

			const bracketOne = await audienceMap.getBracket(2)
			assert(bracketOne!.audiences[0].score === 2)

			const bracketTwo = await audienceMap.getBracket(1)
			assert(bracketTwo!.audiences[0].score === 0)
		})

	})

	describe("#getTop", () => {

		it(
			"Should correctly choose a mandatory audience with an " +
			"earlier requiredBy date if there are more than 1", async () => {
			const testBrackets: AudienceBracket[] = [
				new MandatoryAudienceBracket(2, 3),
				new MandatoryAudienceBracket(0, 1),
			]
			const audienceMap = new AudienceMap(testBrackets)
			const todayAudienceWithScore = new AudienceWithScore(Audience.create({requiredBy: today}), 3)

			const yesterdayAudienceWithScore = new AudienceWithScore(Audience.create({requiredBy: yesterday}), 2)

			audienceMap.addAudience(todayAudienceWithScore)
			audienceMap.addAudience(yesterdayAudienceWithScore)

			const bracket = await audienceMap.getBracket(2)
			const topAudience = await bracket!.getTop()

			assert(topAudience!.score === 2)
		})

		it("Should correctly choose a standard audience with a higher score when there are more than 1", async () => {
			const regularBrackets = [
				new StandardAudienceBracket(1, 5),
			]
			const audienceMap = new AudienceMap(regularBrackets)
			const audienceWithScore1 = new AudienceWithScore(Audience.create({}), 2)
			const audienceWithScore3 = new AudienceWithScore(Audience.create({}), 3)
			const audienceWithScore4 = new AudienceWithScore(Audience.create({}), 4)

			audienceMap.addAudience(audienceWithScore1)
			audienceMap.addAudience(audienceWithScore4)
			audienceMap.addAudience(audienceWithScore3)

			const bracket = await audienceMap.getBracket(2)
			const topAudience = await bracket!.getTop()

			assert(topAudience!.score === 4)
		})

	})
})

describe("#getAudience", () => {
	const user = User.create({department: "DEP003", areasOfWork: ["AOW001"], grade: {code: "GRD001"}})

	it("Should get the closest matching audience if none of the others are mandatory", async () => {

		const course = Course.create({
			audiences: [
				Audience.create({requiredBy: today, departments: ["DEP007", ], type: "TYPE001"}),
				Audience.create({requiredBy: yesterday, departments: ["DEP006", ], type: "TYPE002"}),
				Audience.create({departments: ["DEP001", ], areasOfWork: ["AOW001", ], type: "TYPE003"}),
				Audience.create({departments: ["DEP004", ]}),
				Audience.create({departments: ["DEP005", ]}),
			],
		})

		const returnedAudience = await getAudience(course, user)
		const resultingType = returnedAudience!.type
		const expectedType = "TYPE003"
		assert(
			resultingType === expectedType,
			`Resulting audience was for department ${resultingType},  expected ${expectedType}`
		)
	})

	it(
		"Should get a parent-department-matching audience if the " +
		"user's doesn't match any immediate departments", async () => {

		const course = Course.create({
			audiences: [
				Audience.create({requiredBy: today, departments: ["DEP002", ], type: "TYPE001"}),
				Audience.create({requiredBy: yesterday, departments: ["DEP006", ], type: "TYPE002"}),
				Audience.create({departments: ["DEP001", ]}),
				Audience.create({departments: ["DEP004", ]}),
				Audience.create({departments: ["DEP005", ]}),
			],
		})

		const returnedAudience = await getAudience(course, user)
		const resultingType = returnedAudience!.type
		const expectedType = "TYPE001"
		assert(
			resultingType === expectedType,
			`Resulting audience was for department ${resultingType},  expected ${expectedType}`
		)
	})

	it("Should get an earlier requiredBy audience if two clashing audiences are found", async () => {

		const course = Course.create({
			audiences: [
				Audience.create({requiredBy: today, departments: ["DEP003", ], type: "TYPE001"}),
				Audience.create({requiredBy: yesterday, departments: ["DEP003", ], type: "TYPE002"}),
				Audience.create({departments: ["DEP001", ]}),
				Audience.create({departments: ["DEP004", ]}),
				Audience.create({departments: ["DEP005", ]}),
			],
		})

		const returnedAudience = await getAudience(course, user)
		const resultingType = returnedAudience!.type
		const expectedType = "TYPE002"
		assert(
			resultingType === expectedType,
			`Resulting audience was for department ${resultingType},  expected ${expectedType}`
		)

	})

	it("Should get an audience with a matching department and requiredBy as priority", async () => {

		const course = Course.create({
			audiences: [
				Audience.create({requiredBy: today, departments: ["DEP003"]}),
				Audience.create({requiredBy: yesterday, departments: ["DEP002"]}),
				Audience.create({departments: ["DEP001"]}),
				Audience.create({departments: ["DEP004"]}),
				Audience.create({departments: ["DEP005"]}),
			],
		})

		const returnedAudience = await getAudience(course, user)
		const resultingDepartment = returnedAudience!.departments[0]
		const expectedAudienceDepartment = "DEP003"
		assert(
			resultingDepartment === expectedAudienceDepartment,
			`Resulting audience was for department ${resultingDepartment},  expected ${expectedAudienceDepartment}`
		)
	})
})

import {assert} from 'chai'
import { Audience, Course, OrganisationalUnitFactory, User } from 'lib/model'
import * as registryClient from "lib/registry"
import * as utils from 'lib/service/catalog/utils'
import Sinon = require('sinon')

const orgStructure = [
	OrganisationalUnitFactory.create({
		code: "1003",
		id: 3,
		name: "org003",
		paymentMethods: "",
	}),
	OrganisationalUnitFactory.create({
		code: "1002",
		id: 2,
		name: "org002",
		paymentMethods: "",
	}),
	OrganisationalUnitFactory.create({
		code: "1001",
		id: 1,
		name: "org001",
		paymentMethods: "",
	}),
]

const createAudienceWithDep = (depCode: string) => {
	const data = {departments: [depCode]}
	return Audience.create(data)
}

describe('#getOrgHierarchy()', () => {
	it("Should build the hierarchy correctly", () => {
		const hierarchyCode = "1003"
		const getParentOrgsStub = Sinon.stub(registryClient, "getParentOrgs").returns(Promise.resolve(orgStructure))
		utils.getOrgHierarchy(hierarchyCode)
		.then(parentOrgs => {
			assert(getParentOrgsStub.calledOnceWith(hierarchyCode))
			assert(parentOrgs[0] === hierarchyCode)
			assert(parentOrgs[1] === "1002")
			assert(parentOrgs[2] === "1003")
		})
	})
})

describe('#getDepartmentRelevancyScore()', () => {
	const audience = createAudienceWithDep("TEST001")
	it("Should return a score of 0 for no matching department", () => {
		utils.getDepartmentRelevancyScore(audience, ["TEST005"])
		.then(score => {
			assert(score === 0)
		})
	})

	it("Should return a score of 1 for a matching department", () => {
		utils.getDepartmentRelevancyScore(audience, ["TEST001"])
		.then(score => {
			assert(score === 1)
		})
	})

	it("Should return a score of 3 for a matching mandatory parent department", () => {
		audience.requiredBy = new Date()
		utils.getDepartmentRelevancyScore(audience, ["TEST005", "TEST001"])
		.then(score => {
			assert(score === 3)
		})
	})

	it("Should return a score of 4 for a matching mandatory department", () => {
		audience.requiredBy = new Date()
		utils.getDepartmentRelevancyScore(audience, ["TEST001", "TEST005"])
		.then(score => {
			assert(score === 4)
		})
	})
})

describe("#getAudienceRelevanceForUser()", () => {
	it("Should return a score of 0 if there is no area of work, department or grade", () => {
		const aud = Audience.create({})
		utils.getAudienceRelevanceForUser(aud, [], [], "")
		.then(audWithScore => {
			assert(audWithScore.score === 0)
		})
	})

	it("Should return a score of 1 if only the area of work matches", () => {
		const aud = Audience.create({areasOfWork: ["AOW001"]})
		utils.getAudienceRelevanceForUser(aud, ["AOW001"], [], "")
		.then(audWithScore => {
			assert(audWithScore.score === 1)
		})
	})

	it("Should return a score of 1 if only the grade matches", () => {
		const aud = Audience.create({grades: ["GRD001"]})
		utils.getAudienceRelevanceForUser(aud, [], [], "GRD001")
		.then(audWithScore => {
			assert(audWithScore.score === 1)
		})
	})

	it("Should return a score of -1 if there are no matches", () => {
		const aud = Audience.create({
			areasOfWork: ["AOW001", "AOW002"],
			departments: ["DEP001"],
			grades: ["GRD001"],
		})
		utils.getAudienceRelevanceForUser(aud, ["AOW002"], ["DEP002"], "GRD002")
		.then(audWithScore => {
			assert(audWithScore.score === -1)
		})
	})

})

describe("#AudienceMap", () => {
	const testBrackets: utils.AudienceBracket[] = [
		new utils.MandatoryAudienceBracket(2, 3),
		new utils.MandatoryAudienceBracket(0, 1),
	]
	describe("#addAudience()", () => {
		it("Should correctly add audiences to the correct bracket", async () => {
			const audienceMap = new utils.AudienceMap(testBrackets)
			const audienceWithScoreOne = new utils.AudienceWithScore(Audience.create({}), 2)
			const audienceWithScoreTwo = new utils.AudienceWithScore(Audience.create({}), 0)
			audienceMap.addAudience(audienceWithScoreOne)
			audienceMap.addAudience(audienceWithScoreTwo)

			const bracketOne = await audienceMap.getBracket(2)
			assert(bracketOne!.audiences[0].score === 2)

			const bracketTwo = await audienceMap.getBracket(1)
			assert(bracketTwo!.audiences[1].score === 0)
		})

	})

	describe("#getTop", () => {

		it("Should correctly choose a mandatory audience with an earlier requiredBy date if there are more than 1", async () => {
			const audienceMap = new utils.AudienceMap(testBrackets)
			const today = new Date()
			const todayAudience = Audience.create({requiredBy: today})
			const todayAudienceWithScore = new utils.AudienceWithScore(todayAudience, 3)

			const yesterday = new Date(today)
			yesterday.setDate(yesterday.getDate() - 1)
			const yesterdayAudience = Audience.create({requiredBy: yesterday})
			const yesterdayAudienceWithScore = new utils.AudienceWithScore(yesterdayAudience, 2)

			audienceMap.addAudience(todayAudienceWithScore)
			audienceMap.addAudience(yesterdayAudienceWithScore)

			const bracket = await audienceMap.getBracket(2)
			const topAudience = await bracket!.getTop()

			assert(topAudience!.score === 2)
		})

		it("Should correctly choose a standard audience with a higher score when there are more than 1", async () => {
			const regularBrackets = [
				new utils.StandardAudienceBracket(1, 5),
			]
			const audienceMap = new utils.AudienceMap(regularBrackets)
			const audienceWithScore1 = new utils.AudienceWithScore(Audience.create({}), 2)
			const audienceWithScore3 = new utils.AudienceWithScore(Audience.create({}), 3)
			const audienceWithScore4 = new utils.AudienceWithScore(Audience.create({}), 4)

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
	const testBrackets: utils.AudienceBracket[] = [
		new utils.MandatoryAudienceBracket(2, 3),
		new utils.StandardAudienceBracket(0, 1),
	]
	it("Should get the relevant audience", () => {
		const audienceMap = new utils.AudienceMap(testBrackets)
		const today = new Date()
		const todayAudience = Audience.create({requiredBy: today, departments: ["DEP001"]})
		const todayAudienceWithScore = new utils.AudienceWithScore(todayAudience, 3)

		const yesterday = new Date(today)
		yesterday.setDate(yesterday.getDate() - 1)
		const yesterdayAudience = Audience.create({requiredBy: yesterday, departments: ["DEP002"]})
		const yesterdayAudienceWithScore = new utils.AudienceWithScore(yesterdayAudience, 2)

		const standardAudienceOne = new utils.AudienceWithScore(Audience.create({departments: ["DEP003"]}), 1)
		const standardAudienceTwo = new utils.AudienceWithScore(Audience.create({departments: ["DEP004"]}), 0)
		const standardAudienceThree = new utils.AudienceWithScore(Audience.create({departments: ["DEP005"]}), 1)

		audienceMap.addAudience(todayAudienceWithScore)
		audienceMap.addAudience(yesterdayAudienceWithScore)
		audienceMap.addAudience(standardAudienceOne)
		audienceMap.addAudience(standardAudienceTwo)
		audienceMap.addAudience(standardAudienceThree)

		Sinon.stub(utils, "getRelevancyMap").returns(Promise.resolve(audienceMap))

		utils.getAudience(Course.create({}), User.create({}))
			.then(returnedAudience => {
				assert(returnedAudience!.departments[0] === "DEP002")
			})
	})
})

import {Type} from 'class-transformer'
import {SearchFilterable, SearchLabel} from '../ui/controllers/search/models/searchPageModel'
import {LineManager, OrganisationalUnit} from './model'
import {PatchCivilServant} from './service/civilServantRegistry/models/patchCivilServant'
import {CacheableObject} from './utils/cacheableObject'
import {KeyValue} from './utils/dataUtils'

export class Grade implements KeyValue {
	constructor(
		public id: number,
		public code: string,
		public name: string
	) {}

	getId(): string {
		return this.id.toString()
	}
}

export class AreaOfWork implements KeyValue, SearchFilterable {
	@Type(() => AreaOfWork)
	public children: AreaOfWork[]

	constructor(
		public id: number,
		public name: string
	) {}

	getAsSearchFilter(): SearchLabel {
		return {
			id: this.name,
			value: this.name,
			label: this.name,
		}
	}
	getValue(): string {
		return this.name
	}

	getFlat(): AreaOfWork[] {
		const areasOfWork: AreaOfWork[] = [this]
		if (this.children) {
			for (const child of this.children) {
				areasOfWork.push(...child.getFlat())
			}
		}
		return areasOfWork
	}

	getId(): string {
		return this.id.toString()
	}
}

export class Interest implements KeyValue, SearchFilterable {
	constructor(
		public name: string,
		public id: number
	) {}

	getAsSearchFilter(): SearchLabel {
		return {
			id: this.name,
			value: this.name,
			label: this.name,
		}
	}
	getValue(): string {
		return this.name
	}

	getId(): string {
		return this.id.toString()
	}
}

export class Identity {
	constructor(public uid: string) {}
}

export class Profile implements CacheableObject {
	fullName?: string
	@Type(() => Grade)
	grade?: Grade
	@Type(() => OrganisationalUnit)
	organisationalUnit?: OrganisationalUnit
	@Type(() => OrganisationalUnit)
	otherOrganisationalUnits?: OrganisationalUnit[]
	@Type(() => AreaOfWork)
	profession?: AreaOfWork
	@Type(() => AreaOfWork)
	otherAreasOfWork?: AreaOfWork[]
	@Type(() => Interest)
	interests?: Interest[]
	lineManagerName?: string
	lineManagerEmailAddress?: string
	userId: number
	email: string
	@Type(() => Identity)
	identity: Identity

	managementLoggedIn: boolean = false
	managementShouldLogout: boolean = false
	uiLoggedIn: boolean = false
	uiShouldLogout: boolean = false
	shouldRefresh: boolean = false

	setShouldLogout() {
		this.managementShouldLogout = true
		this.uiShouldLogout = true
		this.shouldRefresh = true
	}

	getId(): string {
		return this.identity.uid
	}

	getLineManager(): LineManager | undefined {
		if (this.lineManagerEmailAddress && this.lineManagerName) {
			return {
				email: this.lineManagerEmailAddress,
				name: this.lineManagerName,
			}
		}
	}

	updateWithPatch(civilServantPatch: PatchCivilServant) {
		if (civilServantPatch.otherAreasOfWork !== undefined) {
			this.otherAreasOfWork = civilServantPatch.otherAreasOfWork
		}
		if (civilServantPatch.interests !== undefined) {
			this.interests = civilServantPatch.interests
		}
		if (civilServantPatch.grade !== undefined) {
			this.grade = civilServantPatch.grade
		}
		if (civilServantPatch.fullName !== undefined) {
			this.fullName = civilServantPatch.fullName
		}
		if (civilServantPatch.profession !== undefined) {
			this.profession = civilServantPatch.profession
		}
	}
}

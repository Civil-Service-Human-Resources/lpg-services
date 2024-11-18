import {AreaOfWork, Grade, Interest} from '../../../registry'
import {PatchCivilServantInterface} from './patchCivilServantInterface'

export class PatchCivilServant {
	constructor(
		public fullName?: string,
		public grade?: Grade,
		public interests?: Interest[],
		public profession?: AreaOfWork,
		public otherAreasOfWork?: AreaOfWork[]
	) {}

	public getAsApiParams(): PatchCivilServantInterface {
		const params: PatchCivilServantInterface = {}
		if (this.fullName) {
			params.fullName = this.fullName
		}
		if (this.grade) {
			params.grade = `/grades/${this.grade.getId()}`
		}
		if (this.interests && this.interests.length > 0) {
			params.interests = this.interests.map(i => `/interests/${i.getId()}`)
		}
		if (this.profession) {
			params.profession = `/professions/${this.profession.getId()}`
		}
		if (this.otherAreasOfWork && this.otherAreasOfWork.length > 0) {
			params.otherAreasOfWork = this.otherAreasOfWork.map(p => `/professions/${p.getId()}`)
		}
		return params
	}
}

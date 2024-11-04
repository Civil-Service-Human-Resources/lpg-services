import {Type} from 'class-transformer'
import {AreaOfWork} from 'lib/registry'
import {SortableList} from 'lib/service/civilServantRegistry/sortableList'

export class AreasOfWork extends SortableList<AreaOfWork> {

	static createFromTree(areaOfWorkTree: AreaOfWork[]) {
		const areasOfWork = areaOfWorkTree.flatMap(aow => aow.getFlat())
		const areasOfWorkCache = new AreasOfWork(areasOfWork, areaOfWorkTree)
		areasOfWorkCache.sort()
		return areasOfWorkCache
	}

	@Type(() => AreaOfWork)
	public list: AreaOfWork[]

	@Type(() => AreaOfWork)
	public topLevelList: AreaOfWork[]

	constructor(list: AreaOfWork[], topLevelList: AreaOfWork[]) {
		super(list)
		this.topLevelList = topLevelList
	}

	sort(): void {
		super.sort()
		this.topLevelList = this.topLevelList.sort(this.getCompareFn())
	}

}
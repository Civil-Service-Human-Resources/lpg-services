import {Type} from 'class-transformer'
import {Interest} from 'lib/registry'
import {SortableList} from 'lib/service/civilServantRegistry/sortableList'

export class Interests extends SortableList<Interest> {
	@Type(() => Interest)
	public list: Interest[]

	constructor(list: Interest[]) {
		super(list)
	}
}

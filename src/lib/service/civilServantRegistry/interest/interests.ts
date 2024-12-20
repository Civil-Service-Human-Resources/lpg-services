import {Type} from 'class-transformer'
import {Interest} from '../../../registry'
import {SortableList} from '../sortableList'

export class Interests extends SortableList<Interest> {
	@Type(() => Interest)
	public declare list: Interest[]

	constructor(list: Interest[]) {
		super(list)
	}
}

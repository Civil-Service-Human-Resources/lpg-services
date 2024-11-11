import {Type} from 'class-transformer'
import {Grade} from 'lib/registry'
import {SortableList} from 'lib/service/civilServantRegistry/sortableList'

export class Grades extends SortableList<Grade> {
	@Type(() => Grade)
	public list: Grade[]

	constructor(list: Grade[]) {
		super(list)
	}
}

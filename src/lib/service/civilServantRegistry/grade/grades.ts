import {Type} from 'class-transformer'
import {Grade} from '../../../registry'
import {SortableList} from '../sortableList'

export class Grades extends SortableList<Grade> {
	@Type(() => Grade)
	declare public list: Grade[]

	constructor(list: Grade[]) {
		super(list)
	}
}

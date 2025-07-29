import {Type} from 'class-transformer'
import {Grade} from '../../../registry'

export class Grades {
	@Type(() => Grade)
	public grades: Grade[]
}

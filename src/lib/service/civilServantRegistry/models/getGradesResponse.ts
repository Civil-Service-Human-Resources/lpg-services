import {Expose, plainToInstance, Transform} from 'class-transformer'
import {Grade} from '../../../registry'
import {HalObject} from './hal/halObject'

export class GetGradesResponse {
	@Expose({name: '_embedded'})
	@Transform(({value}) => {
		return value.grades.map((i: any) => {
			const obj = plainToInstance(HalObject, i)
			return new Grade(obj.id, '', obj.name)
		})
	})
	public grades: Grade[]
}

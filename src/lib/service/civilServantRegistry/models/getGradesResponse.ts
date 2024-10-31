import {Expose, plainToInstance, Transform} from 'class-transformer'
import {Grade} from 'lib/registry'
import {HalObject} from 'lib/service/civilServantRegistry/models/hal/halObject'

export class GetGradesResponse {

	@Expose({name: "_embedded"})
	@Transform(({value}) => {
		return value.grades.map((i: any) => {
			const obj = plainToInstance(HalObject, i)
			return new Grade(obj.id, '', obj.name)
		})
	})
	public grades: Grade[]

}

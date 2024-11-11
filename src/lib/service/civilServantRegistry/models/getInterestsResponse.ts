import {Expose, plainToInstance, Transform} from 'class-transformer'
import {Interest} from 'lib/registry'
import {HalObject} from 'lib/service/civilServantRegistry/models/hal/halObject'

export class GetInterestsResponse {

	@Expose({name: "_embedded"})
	@Transform(({value}) => {
		return value.interests.map((i: any) => {
			const obj = plainToInstance(HalObject, i)
			return new Interest(obj.name, obj.id)
		})
	})
	public interests: Interest[]

}

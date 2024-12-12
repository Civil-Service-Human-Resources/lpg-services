import {Expose} from 'class-transformer'
import {IsNotEmpty} from 'class-validator'
import {ValidPageModel} from '../../models/ValidPageModel'

export class GivenNamePageModel extends ValidPageModel {

	@Expose({name: 'given-name'})
	@IsNotEmpty({
		message: 'profile.given-name',
	})
	public value: string

	constructor(value: string) {
		super()
		this.value = value
	}
}

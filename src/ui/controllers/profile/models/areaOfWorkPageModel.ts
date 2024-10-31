import {Expose} from 'class-transformer'
import {IsNotEmpty} from 'class-validator'
import {OptionsBasePageModel} from './optionsBasePageModel'

export class AreaOfWorkPageModel extends OptionsBasePageModel {

	@Expose({name: 'primary-area-of-work'})
	@IsNotEmpty({
		message: 'profile.primary-area-of-work',
	})
	public areaOfWorkId: string

}

import {Expose, Transform} from 'class-transformer'
import {ArrayNotEmpty} from 'class-validator'
import {OptionsBasePageModel} from './optionsBasePageModel'

export class OtherAreasOfWorkPageModel extends OptionsBasePageModel {
	@Expose({name: 'other-areas-of-work'})
	@Transform(({value}) => {
		if (value !== undefined) {
			if (typeof value === 'string') {
				return [value]
			} else {
				return [...value]
			}
		} else {
			return []
		}
	})
	@ArrayNotEmpty({
		message: 'profile.other-areas-of-work',
	})
	public otherAreasOfWork: string[] = []
}

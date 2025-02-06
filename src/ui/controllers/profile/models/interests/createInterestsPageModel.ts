import {Expose, Transform} from 'class-transformer'
import {OptionsBasePageModel} from '../optionsBasePageModel'

export class CreateInterestsPageModel extends OptionsBasePageModel {
	@Expose({name: 'interests'})
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
	public interestIds: string[] = []
}

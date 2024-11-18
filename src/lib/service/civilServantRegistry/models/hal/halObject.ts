import {Expose, Transform} from 'class-transformer'

export class HalObject {
	public name: string

	@Expose({name: '_links'})
	@Transform(({value}) => {
		return value.self.href.split('/').pop()
	})
	public id: number
}

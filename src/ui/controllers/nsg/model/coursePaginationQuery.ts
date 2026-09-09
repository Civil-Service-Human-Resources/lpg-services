import {Transform} from 'class-transformer'
import {NSG_FLAG} from '../../../../lib/config'
import {SearchParams} from '../../../../lib/utils/search'
import {contentTypes} from '../controller'

export class CoursePaginationQuery implements SearchParams {
	@Transform(({value}) => {
		value = value - 1
		return +value
	})
	p: number = 0

	contentType?: contentTypes

	categoryUrl: string

	getAsUrlParams(page?: number) {
		const urlParts: string[] = []
		if (page) {
			urlParts.push(`p=${page}`)
		}
		const urlContentType = this.contentType === undefined ? '' : `/${this.contentType}`
		return (
			`${NSG_FLAG ? '/home' : '/nsg-homepage'}/topics/${this.categoryUrl}${urlContentType}?` + urlParts.join('&')
		)
	}
}

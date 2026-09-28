import {Transform} from 'class-transformer'
import * as striptags from 'striptags'
import {NSG_FLAG} from '../../../../lib/config'
import {SearchParams} from '../../../../lib/utils/search'
import {contentTypes} from '../controller'

export class CoursePaginationQuery implements SearchParams {
	@Transform(({value}) => {
		if (value === undefined || value === null || value === '') {
			return 0
		}
		const num = +value
		return isNaN(num) || num <= 0 ? 0 : num - 1
	})
	p: number = 0

	contentType?: contentTypes

	@Transform(({value}) => {
		return typeof value === 'string' ? striptags(value) : value
	})
	categoryUrl: string

	getAsUrlParams(page?: number) {
		const urlParts: string[] = []
		if (page) {
			urlParts.push(`p=${page}`)
		}
		const urlContentType = this.contentType === undefined ? '' : `/${this.contentType}`
		return `${NSG_FLAG ? '/home' : '/nsg-homepage'}/topics/${this.categoryUrl}${urlContentType}?` + urlParts.join('&')
	}
}

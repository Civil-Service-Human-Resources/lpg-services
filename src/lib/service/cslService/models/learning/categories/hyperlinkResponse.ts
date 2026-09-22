import {Type} from 'class-transformer'
import {Hyperlink} from './hyperlink'

export class HyperlinkResponse {
	@Type(() => Hyperlink)
	results: Hyperlink[]

	page: number
	totalResults: number
	size: number
}

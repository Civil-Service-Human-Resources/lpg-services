import {UserDto} from 'lib/service/cslService/models/UserDto'

export class BookEventDto {
	constructor(
		public accessibilityOptions: string[], public userDetailsDto: UserDto, public poNumber?: string) { }

}

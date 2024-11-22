import {UserDto} from './UserDto'

export class BookEventDto {
	constructor(
		public accessibilityOptions: string[],
		public userDetailsDto: UserDto,
		public poNumber?: string
	) {}
}

import {User} from 'lib/model'
import {BookEventDto} from 'lib/service/cslService/models/BookEventDto'
import {createUserDto} from 'lib/service/cslService/models/factory/UserDtoFactory'

export async function createBookEventDto(
	accessibilityOptions: string[], user: User, poNumber?: string): Promise<BookEventDto> {
	const userDto = await createUserDto(user)
	return new BookEventDto(accessibilityOptions, userDto, poNumber)
}

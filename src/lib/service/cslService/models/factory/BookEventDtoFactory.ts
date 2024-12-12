import {User} from '../../../../model'
import {BookEventDto} from '../BookEventDto'
import {createUserDto} from './UserDtoFactory'

export async function createBookEventDto(
	accessibilityOptions: string[],
	user: User,
	poNumber?: string
): Promise<BookEventDto> {
	const userDto = await createUserDto(user)
	return new BookEventDto(accessibilityOptions, userDto, poNumber)
}

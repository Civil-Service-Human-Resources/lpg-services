import {plainToInstance} from 'class-transformer'
import {User} from 'lib/model'
import {AreaOfWork} from 'lib/registry'
import {client} from '../config'

const URL = "professions"

export async function getProfessionsTree(user: User): Promise<AreaOfWork[]> {
	const resp: AreaOfWork[] = await client._get<AreaOfWork[]>(
		{
			url: `${URL}/tree`,
		},
		user
	)
	return plainToInstance(AreaOfWork, resp)
}

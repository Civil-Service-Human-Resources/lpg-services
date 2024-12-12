import {plainToInstance} from 'class-transformer'
import {User} from '../../../model'
import {Grade} from '../../../registry'
import {client} from '../config'
import {GetGradesResponse} from '../models/getGradesResponse'

const URL = 'grades'

export async function getGrades(user: User): Promise<Grade[]> {
	const resp: GetGradesResponse = await client._get<GetGradesResponse>(
		{
			url: URL,
		},
		user
	)
	return plainToInstance(GetGradesResponse, resp).grades
}

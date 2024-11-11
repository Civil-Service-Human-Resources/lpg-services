import {plainToInstance} from 'class-transformer'
import {User} from 'lib/model'
import {Grade} from 'lib/registry'
import {GetGradesResponse} from 'lib/service/civilServantRegistry/models/getGradesResponse'
import {client} from '../config'

const URL = "grades"

export async function getGrades(user: User): Promise<Grade[]> {
	const resp: GetGradesResponse = await client._get<GetGradesResponse>(
		{
			url: URL,
		},
		user
	)
	return plainToInstance(GetGradesResponse, resp).grades
}

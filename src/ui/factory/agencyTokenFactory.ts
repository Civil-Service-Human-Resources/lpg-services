import {AgencyToken} from "../model/agencyToken"

export class AgencyTokenFactory {
	public create(data: any): any {
		const agencyToken: AgencyToken = new AgencyToken()

		agencyToken.token = data.token
		agencyToken.capacityUsed = data.capacityUsed
		agencyToken.capacity = data.capacity

		return agencyToken
	}
}

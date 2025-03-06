import * as model from '../../../model'
import {client} from '../baseConfig'
import { Event } from './models/event'

const URL = "/events-list"

export async function getEventsByUids(eventUids: string[], user: model.User): Promise<Event[]>{
    const response = await client._get<Event[]>(
        {
            url: `${URL}?${eventUids.map(uid => `uids=${uid}`).join("&")}`
        },
        user
    )
    
    return response
}
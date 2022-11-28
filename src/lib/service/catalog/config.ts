import * as config from '../../config'
import {HttpClient} from '../httpClient'

export const client = HttpClient.createFromParams(config.COURSE_CATALOGUE.url, config.REQUEST_TIMEOUT)

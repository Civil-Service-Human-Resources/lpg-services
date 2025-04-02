import * as config from '../../config'
import {HttpClient} from '../httpClient'

export const client = HttpClient.createFromParams(config.CSL_SERVICE.url, config.REQUEST_TIMEOUT)

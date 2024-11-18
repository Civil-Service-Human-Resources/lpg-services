import {plainToClass} from 'class-transformer'
import {Profile} from '../../../registry'
import {CacheableObjectCache} from '../../../utils/cacheableObjectCache'

export class ProfileCache extends CacheableObjectCache<Profile> {
	getBaseKey(): string {
		return 'civilServants'
	}

	protected convert(cacheHit: string): Profile {
		return plainToClass(Profile, cacheHit)
	}
}

import {plainToClass} from 'class-transformer'
import {Profile} from 'lib/registry'
import {CacheableObjectCache} from 'lib/utils/cacheableObjectCache'

export class ProfileCache extends CacheableObjectCache<Profile> {
	getBaseKey(): string {
		return 'civilServants'
	}

	protected convert(cacheHit: string): Profile {
		return plainToClass(Profile, cacheHit)
	}
}

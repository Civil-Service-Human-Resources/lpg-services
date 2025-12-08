import {Cache} from './cache'
import {CacheableObject} from './cacheableObject'

export abstract class CacheableObjectCache<T extends CacheableObject> extends Cache<T> {
	async setObject(object: T, ttlOverride?: number) {
		await this.set(object.getId(), object, ttlOverride)
	}

	protected abstract convert(cacheHit: any): T
	protected abstract getBaseKey(): string
}

import {Cache} from './cache'
import {CacheableObject} from './cacheableObject'

export abstract class CacheableObjectCache<T extends CacheableObject> extends Cache<T> {
	async setObject(object: T, ttlOverride?: number) {
		await this.set(object.getId(), object, ttlOverride)
	}

	async setMultiple(objects: T[]) {
		this.logger.debug(
			`Setting ${objects.length} objects with ids [${objects.map(o => o.getId())}] to the '${this.getBaseKey()}' cache`
		)
		return Promise.all(objects.map(o => this.set(o.getId(), o)))
	}
	protected abstract convert(cacheHit: any): T
	protected abstract getBaseKey(): string
}

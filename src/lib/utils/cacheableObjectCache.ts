import {Cache} from 'lib/utils/cache'
import {CacheableObject} from 'lib/utils/cacheableObject'

export abstract class CacheableObjectCache <T extends CacheableObject> extends Cache<T> {
	async setMultiple(objects: T[]) {
		this.logger.debug(
			`Setting ${objects.length} objects with ids [${objects.map(o => o.getId())}] to the '${this.getBaseKey()}' cache`
		)
		return Promise.all(objects.map(o => this.set(o.getId(), o)))
	}
	protected abstract convert(cacheHit: any): T
	protected abstract getBaseKey(): string

}

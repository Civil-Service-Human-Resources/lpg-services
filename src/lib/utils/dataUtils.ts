import {CacheableObject} from 'lib/utils/cacheableObject'

export interface KeyValue extends CacheableObject {
	id: number
	name: string
}

export function asMap <T extends KeyValue>(list: T[]): Map<number, T> {
	return new Map<number, T>(list.map((elem): [number, T] => {
		return [elem.id, elem]
	}))
}

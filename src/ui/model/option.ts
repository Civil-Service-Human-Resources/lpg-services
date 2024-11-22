import {OrganisationalUnit} from '../../lib/model'
import {KeyValue} from '../../lib/utils/dataUtils'

export interface Option {
	id: string
	name: string
	checked: boolean
}

export function keysToOptions(keyValues: KeyValue[], selectedValues: string[] = []): Option[] {
	return keyValues.map(kv => {
		return {id: kv.getId(), name: kv.name, checked: selectedValues.includes(kv.getId())}
	})
}

export function organisationsToOptions(organisations: OrganisationalUnit[]): Option[] {
	return organisations.map(o => {
		return {id: o.getId(), name: o.formattedName, checked: false}
	})
}

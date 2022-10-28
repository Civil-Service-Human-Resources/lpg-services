import { Cache } from '../../../utils/cache';
import { OrganisationalUnit } from '../../../model';
import { plainToClass } from 'class-transformer';

export class OrganisationalUnitCache extends Cache<OrganisationalUnit> {
    protected convertList(cachedList: string[]): OrganisationalUnit[] {
        return plainToClass(OrganisationalUnit, cachedList)
    }

    protected convert(cacheHit: any): OrganisationalUnit {
        return plainToClass(OrganisationalUnit, cacheHit)
    };
}
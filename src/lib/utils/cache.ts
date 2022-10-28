import { createClient } from 'redis'
import {promisify} from 'util'

export class Cache {
    constructor(readonly host: string, readonly port: number, readonly password: string) {
    }
    
    private getClient() {
        return createClient({
            auth_pass: this.password,
            host: this.host,
            no_ready_check: true,
            port: this.port,
        })
    }

    async get(key:string){
        const client = this.getClient()
        return await promisify(client.hgetall)(key)
    }
}
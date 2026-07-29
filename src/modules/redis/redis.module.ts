import config from '../../config/config';
import { Global, Module } from '@nestjs/common';
import Redis from 'ioredis';

export const REDIS_CLIENT = 'REDIS_CLIENT';

@Global()
@Module({
    providers: [
        {
            provide: REDIS_CLIENT,
            useFactory: (): Redis => {
                return new Redis({
                    host: config.redis.host,
                    port: config.redis.port,
                    password: config.redis.password,
                });
            },
        },
    ],
    exports: [REDIS_CLIENT],
})
export class RedisModule {}

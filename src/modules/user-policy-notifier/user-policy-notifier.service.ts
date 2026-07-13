import config from '../../config/config';
import { readFileSync } from 'fs';
import {Inject, Injectable, Logger} from '@nestjs/common';
import Redis from 'ioredis';
import {REDIS_CLIENT} from '../redis/redis.module';

const CHANNEL = 'OnUserPolicyUpdated';

@Injectable()
export class UserPolicyNotifierService {
    private readonly logger = new Logger(UserPolicyNotifierService.name);

    constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {
    }

    /**
     * Builds the "<serverId>::<userId>::<policyJson>" message
     * and publishes it to the OnUserPolicyUpdated channel.
     */
    async publishPolicyUpdate(
        serverId: string,
        userGuid: string
    ): Promise<void> {
        // const policy = { ...this.loadPolicyTemplate(), IsDisabled: isDisabled };
        const policy = this.loadPolicyTemplate();

        const message = `${serverId}::${userGuid}::${JSON.stringify(policy)}`;

        await this.redis.publish(CHANNEL, message);

        this.logger.log(
            `PUBLISH ${CHANNEL} for userGuid=${userGuid} serverId=${serverId}`,
        );
    }

    private loadPolicyTemplate(): Record<string, unknown> {
        const raw = readFileSync(config.redis.policyTemplatePath, 'utf-8');
        return JSON.parse(raw) as Record<string, unknown>;
    }
}

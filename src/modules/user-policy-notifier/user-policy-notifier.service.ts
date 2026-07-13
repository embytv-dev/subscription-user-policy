import config from '../../config/config';
import { readFileSync } from 'fs';
import {Inject, Injectable, Logger} from '@nestjs/common';
import Redis from 'ioredis';
import {REDIS_CLIENT} from '../redis/redis.module';

@Injectable()
export class UserPolicyNotifierService {
    private readonly logger = new Logger(UserPolicyNotifierService.name);
    private readonly chanel = config.publish.channel;
    private readonly serverId = config.publish.serverId;

    constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {
    }

    /**
     * Builds the "<serverId>::<userId>::<policyJson>" message
     * and publishes it to the OnUserPolicyUpdated channel.
     */
    async publishPolicyUpdate(userGuid: string): Promise<void> {
        // const policy = { ...this.loadPolicyTemplate(), IsDisabled: isDisabled };
        const policy = this.loadPolicyTemplate();

        const message = `${this.serverId}::${userGuid}::${JSON.stringify(policy)}`;

        await this.redis.publish(this.chanel, message);

        this.logger.log(
            `PUBLISH ${this.chanel} for userGuid=${userGuid} serverId=${this.serverId}`,
        );
    }

    private loadPolicyTemplate(): Record<string, unknown> {
        const raw = readFileSync(config.publish.policyTemplatePath, 'utf-8');
        return JSON.parse(raw) as Record<string, unknown>;
    }
}

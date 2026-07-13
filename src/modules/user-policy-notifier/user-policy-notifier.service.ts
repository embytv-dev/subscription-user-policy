import { Inject, Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../redis/redis.module';

const CHANNEL = 'OnUserPolicyUpdated';

@Injectable()
export class UserPolicyNotifierService {
  private readonly logger = new Logger(UserPolicyNotifierService.name);

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  /**
   * Builds the "<serverId>::<userId>::<policyJson>" message
   * and publishes it to the OnUserPolicyUpdated channel.
   */
  async publishPolicyUpdate(
    serverId: string,
    userId: string
  ): Promise<void> {
    const policyJson = ''; //TODO: read from file
    const message = `${serverId}::${userId}::${policyJson}`;

    await this.redis.publish(CHANNEL, message);

    this.logger.log(
      `PUBLISH ${CHANNEL} for userId=${userId} serverId=${serverId}`,
    );
  }
}

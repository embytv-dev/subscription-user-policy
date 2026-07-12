import { Inject, Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../redis/redis.module';

const CHANNEL = 'OnUserPolicyUpdated';

@Injectable()
export class UserPolicyNotifierService {
  private readonly logger = new Logger(UserPolicyNotifierService.name);

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  /**
   * Формирует сообщение "<serverId>::<userId>::<policyJson>"
   * и публикует его в канал OnUserPolicyUpdated.
   */
  async publishPolicyUpdate(
    serverId: string,
    userId: string,
    policyJson: string,
  ): Promise<void> {
    const message = `${serverId}::${userId}::${policyJson}`;

    await this.redis.publish(CHANNEL, message);

    this.logger.log(
      `PUBLISH ${CHANNEL} для userId=${userId} serverId=${serverId}`,
    );
  }
}

import { Inject, Injectable, Logger } from '@nestjs/common';
import type { Pool } from 'mysql2/promise';
import { MYSQL_POOL } from '../mysql/mysql.module';
import { UsersPendingDisableService } from '../users-pending-disable/users-pending-disable.service';
import { SubscriptionsService } from '../users-pending-disable/subscriptions.service';
import { UserPolicyNotifierService } from '../user-policy-notifier/user-policy-notifier.service';

@Injectable()
export class WorkerService {
  private readonly logger = new Logger(WorkerService.name);

  constructor(
    @Inject(MYSQL_POOL) private readonly pool: Pool,
    private readonly pendingService: UsersPendingDisableService,
    private readonly subscriptionService: SubscriptionsService,
    private readonly notifier: UserPolicyNotifierService,
  ) {}

  /**
   * Main loop: repeats processing of a single record up to `iterations` times.
   * Stops early if the queue is empty.
   */
  async run(iterations: number): Promise<void> {
    for (let i = 0; i < iterations; i++) {
      const hasMore = await this.processOne();
      if (!hasMore) {
        this.logger.log(
          'users_pending_disable queue is empty — stopping the loop',
        );
        break;
      }
    }
  }

  /**
   * One loop step, entirely within a single transaction on a single connection:
   *   1. SELECT ... FOR UPDATE SKIP LOCKED — fetch and lock a record
   *   2. if no record — signal to exit the loop
   *   3. clarifying SELECT of the user's subscription/policy
   *   4. if the policy says "disabled" — PUBLISH to Redis, otherwise skip
   *   5. DELETE the processed record from the queue
   */
  private async processOne(): Promise<boolean> {
    const conn = await this.pool.getConnection();

    try {
      await conn.beginTransaction();

      const user = await this.pendingService.getUserForDisable(conn);
      console.log('PENDING', user);

      if (!user) {
        await conn.commit();
        return false;
      }

      const isHasActiveSubscription = await this.subscriptionService.isHasActiveSubscription(
        conn,
        user.ldap_user_name,
      );

      if (isHasActiveSubscription) {
        this.logger.log(
            `Publishing for user=${user.ldap_user_name} (subscription found successful)`,
        );
        await this.notifier.publishPolicyUpdate(
          `${process.env.PUBLISH_SERVER_ID}`,
          user.guid,
        );
      } else {
        this.logger.log(
          `Skipped publishing for user=${user.ldap_user_name} (subscription not found)`,
        );
      }

      await this.pendingService.removeById(conn, user.id);

      await conn.commit();
      this.logger.log(
        `Processed record id=${user.id} userId=${user.ldap_user_name}`,
      );
      return true;
    } catch (err) {
      await conn.rollback();
      this.logger.error(
        'Error while processing record, transaction rolled back',
        err as Error,
      );
      throw err;
    } finally {
      conn.release();
    }
  }
}

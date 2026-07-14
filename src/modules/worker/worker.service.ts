import {Inject, Injectable, Logger} from '@nestjs/common';
import type {Pool} from 'mysql2/promise';
import {MYSQL_POOL} from '../mysql/mysql.module';
import {
    UsersPendingDisableRow,
    UsersPendingDisableService
} from '../users-pending-disable/users-pending-disable.service';
import {SubscriptionsService} from '../users-pending-disable/subscriptions.service';
import {UserPolicyNotifierService} from '../user-policy-notifier/user-policy-notifier.service';

@Injectable()
export class WorkerService {
    private readonly logger = new Logger(WorkerService.name);

    constructor(
        @Inject(MYSQL_POOL) private readonly pool: Pool,
        private readonly pendingService: UsersPendingDisableService,
        private readonly subscriptionService: SubscriptionsService,
        private readonly notifier: UserPolicyNotifierService,
    ) {
    }

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
     *   1. SELECT ... FOR UPDATE SKIP LOCKED — fetch and lock a user record
     *   2. if no record — signal to exit the loop
     *   3. clarifying if SELECT of the user's subscription/policy
     *   4. if the policy says "disabled" — PUBLISH to Redis, otherwise skip
     *   5. DELETE the processed record from the queue
     */
    private async processOne(): Promise<boolean> {
        const conn = await this.pool.getConnection();

        try {
            this.logger.log('BEGIN TRANSACTION');
            await conn.beginTransaction();

            this.logger.log(`Finding UsersPendingDisable row`);
            const upd = await this.pendingService.getUserForDisable(conn);
            if (!upd) {
                this.logger.log('COMMIT TRANSACTION');
                await conn.commit();
                return false;
            }

            this.logger.log(`Finding active subscription for user=${upd.ldap_user_name}`);
            const isHasActiveSubscription = await this.subscriptionService.isHasActiveSubscription(
                conn,
                upd.ldap_user_name,
            );

            if (isHasActiveSubscription) {
                this.logger.log(`Publishing for user=${upd.ldap_user_name} (subscription found)`);
                await this.notifier.publishPolicyUpdate(upd.user_guid);
            } else {
                this.logger.log(`Skipped publishing for user=${upd.ldap_user_name} (subscription not found)`);
            }

            this.logger.log(`Removing record id=${upd.id}, user=${upd.ldap_user_name} from UsersPendingDisable`);
            await this.pendingService.removeById(conn, upd.id);

            this.logger.log('COMMIT TRANSACTION');
            await conn.commit();

            this.logger.log(`Processed record id=${upd.id} user=${upd.ldap_user_name}`);
            return true;
        } catch (err) {
            await conn.rollback();
            this.logger.error('Error while processing record, transaction rolled back', err as Error);
            throw err;
        } finally {
            conn.release();
        }
    }
}

import { Inject, Injectable, Logger } from '@nestjs/common';
import type { Pool } from 'mysql2/promise';
import { MYSQL_POOL } from '../mysql/mysql.module';
import { UsersPendingDisableService } from '../users-pending-disable/users-pending-disable.service';
import { UserSubscriptionService } from '../users-pending-disable/user-subscription.service';
import { UserPolicyNotifierService } from '../user-policy-notifier/user-policy-notifier.service';

@Injectable()
export class WorkerService {
  private readonly logger = new Logger(WorkerService.name);

  constructor(
    @Inject(MYSQL_POOL) private readonly pool: Pool,
    private readonly pendingService: UsersPendingDisableService,
    private readonly subscriptionService: UserSubscriptionService,
    private readonly notifier: UserPolicyNotifierService,
  ) {}

  /**
   * Основной цикл: до `iterations` раз повторяет обработку одной записи.
   * Останавливается раньше, если очередь опустела.
   */
  async run(iterations: number): Promise<void> {
    for (let i = 0; i < iterations; i++) {
      const hasMore = await this.processOne();
      if (!hasMore) {
        this.logger.log('Очередь users_pending_disable пуста — завершаем цикл');
        break;
      }
    }
  }

  /**
   * Один шаг цикла целиком в одной транзакции на одном соединении:
   *   1. SELECT ... FOR UPDATE SKIP LOCKED — забираем и блокируем запись
   *   2. если записи нет — сигнал на выход из цикла
   *   3. уточняющий SELECT подписки/политики пользователя
   *   4. если политика говорит "disabled" — PUBLISH в Redis, иначе пропускаем
   *   5. DELETE обработанной записи из очереди
   */
  private async processOne(): Promise<boolean> {
    const conn = await this.pool.getConnection();

    try {
      await conn.beginTransaction();

      const pending = await this.pendingService.getNextPending(conn);
      if (!pending) {
        await conn.commit();
        return false;
      }

      const subscription = await this.subscriptionService.isHasActiveSubscription(
        conn,
        pending.userId,
        pending.serverId,
      );

      if (subscription && subscription.isDisabled) {
        await this.notifier.publishPolicyUpdate(
          pending.serverId,
          pending.userId,
          subscription.policyJson,
        );
      } else {
        this.logger.debug(
          `Публикация пропущена для userId=${pending.userId} (подписка не найдена или isDisabled=false)`,
        );
      }

      await this.pendingService.removeById(conn, pending.id);

      await conn.commit();
      this.logger.log(
        `Обработана запись id=${pending.id} userId=${pending.userId}`,
      );
      return true;
    } catch (err) {
      await conn.rollback();
      this.logger.error(
        'Ошибка при обработке записи, транзакция откачена',
        err as Error,
      );
      throw err;
    } finally {
      conn.release();
    }
  }
}

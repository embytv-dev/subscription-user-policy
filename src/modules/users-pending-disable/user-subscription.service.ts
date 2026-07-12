import { Injectable, Logger } from '@nestjs/common';
import { PoolConnection, RowDataPacket } from 'mysql2/promise';

export interface UserSubscriptionRow {
  userId: string;
  serverId: string;
  isDisabled: boolean;
  /** Готовая JSON-строка политики — ровно то, что уходит вторым сегментом в PUBLISH */
  policyJson: string;
}

/**
 * ДОПУЩЕНИЕ (не подтверждено): таблица с "уточняющими параметрами" записи.
 * Предполагаемая структура:
 *   user_id      varchar/char(36)
 *   server_id    varchar/char(36)
 *   is_disabled  tinyint(1)
 *   policy_json  text/json  -- готовый JSON UserPolicy, как в примере PUBLISH
 *
 * Если схема другая — поменяйте SQL ниже и/или соберите policyJson
 * из отдельных колонок (см. закомментированный пример в конце файла).
 */
const TABLE = 'user_subscriptions';

interface SubscriptionQueryRow extends RowDataPacket {
  userId: string;
  serverId: string;
  isDisabled: number;
  policyJson: string | Record<string, unknown>;
}

@Injectable()
export class UserSubscriptionService {
  private readonly logger = new Logger(UserSubscriptionService.name);

  async isHasActiveSubscription(
    conn: PoolConnection,
    userId: string,
    serverId: string,
  ): Promise<UserSubscriptionRow | null> {
    const [rows] = await conn.query<SubscriptionQueryRow[]>(
      `SELECT user_id AS userId, server_id AS serverId, is_disabled AS isDisabled, policy_json AS policyJson
       FROM ${TABLE}
       WHERE user_id = ? AND server_id = ?
       LIMIT 1`,
      [userId, serverId],
    );

    if (rows.length === 0) {
      this.logger.warn(
        `Подписка не найдена для userId=${userId} serverId=${serverId}`,
      );
      return null;
    }

    const row = rows[0];
    return {
      userId: row.userId,
      serverId: row.serverId,
      isDisabled: Boolean(row.isDisabled),
      policyJson:
        typeof row.policyJson === 'string'
          ? row.policyJson
          : JSON.stringify(row.policyJson),
    };
  }
}

/* Альтернатива, если policy собирается из отдельных колонок, а не хранится единым JSON:
const policyObject = {
  IsAdministrator: Boolean(row.isAdministrator),
  IsHidden: Boolean(row.isHidden),
  IsDisabled: Boolean(row.isDisabled),
  // ...остальные поля из вашего примера PUBLISH
};
const policyJson = JSON.stringify(policyObject);
*/

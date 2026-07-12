import { Injectable, Logger } from '@nestjs/common';
import { PoolConnection, RowDataPacket } from 'mysql2/promise';

export interface UserSubscriptionRow {
  userId: string;
  serverId: string;
  isDisabled: boolean;
  /** Ready-made policy JSON string — exactly what goes as the second segment in PUBLISH */
  policyJson: string;
}

/**
 * ASSUMPTION (not confirmed): the table holding the "clarifying parameters"
 * of the record. Expected structure:
 *   user_id      varchar/char(36)
 *   server_id    varchar/char(36)
 *   is_disabled  tinyint(1)
 *   policy_json  text/json  -- ready-made UserPolicy JSON, as in the PUBLISH example
 *
 * If your schema differs — change the SQL below and/or assemble policyJson
 * from separate columns (see the commented example at the end of the file).
 */
const TABLE = `${process.env.MYSQL_DB_PORTAL}.user_subscriptions`;

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
        `Subscription not found for userId=${userId} serverId=${serverId}`,
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

/* Alternative, if the policy is assembled from separate columns instead of a single JSON blob:
const policyObject = {
  IsAdministrator: Boolean(row.isAdministrator),
  IsHidden: Boolean(row.isHidden),
  IsDisabled: Boolean(row.isDisabled),
  // ...remaining fields from your PUBLISH example
};
const policyJson = JSON.stringify(policyObject);
*/

import { Injectable, Logger } from '@nestjs/common';
import { PoolConnection, RowDataPacket } from 'mysql2/promise';

export interface UserSubscriptionRow {
  userId: string;
  serverId: string;
  isDisabled: boolean;
  /** Ready-made policy JSON string — exactly what goes as the second segment in PUBLISH */
  policyJson: string;
}

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
    userId: string
  ): Promise<UserSubscriptionRow | null> {
    const [rows] = await conn.query<SubscriptionQueryRow[]>(
      `SELECT user_id AS userId, server_id AS serverId, is_disabled AS isDisabled, policy_json AS policyJson
       FROM ${TABLE}
       WHERE user_id = ? AND server_id = ?
       LIMIT 1`,
      [userId],
    );

    if (rows.length === 0) {
      this.logger.warn(
        `Subscription not found for userId=${userId}`,
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

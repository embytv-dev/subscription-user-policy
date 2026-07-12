import { Injectable, Logger } from '@nestjs/common';
import { PoolConnection, RowDataPacket } from 'mysql2/promise';

export interface PendingRow {
  id: number;
  userId: string;
  serverId: string;
}

/**
 * ASSUMPTION: status/created_at columns — if they don't exist in the real
 * table, simplify the WHERE/ORDER BY below.
 */
const TABLE = `${process.env.MYSQL_DB_PORTAL}.users_pending_disable`;

interface PendingQueryRow extends RowDataPacket {
  id: number;
  userId: string;
  serverId: string;
}

@Injectable()
export class UsersPendingDisableService {
  private readonly logger = new Logger(UsersPendingDisableService.name);

  /**
   * Locks and returns a single record from the queue.
   * SKIP LOCKED (MySQL 8+) — so that parallel worker runs don't wait
   * on each other for the same locked row.
   */
  async getNextPending(conn: PoolConnection): Promise<PendingRow | null> {
    const [rows] = await conn.query<PendingQueryRow[]>(
      `SELECT id, user_id AS userId, server_id AS serverId
       FROM ${TABLE}
       WHERE status = 'pending'
       ORDER BY created_at ASC
       LIMIT 1
       FOR UPDATE SKIP LOCKED`,
    );

    if (rows.length === 0) {
      return null;
    }

    const row = rows[0];
    return { id: row.id, userId: row.userId, serverId: row.serverId };
  }

  /**
   * Final step of the loop — remove the processed record from the queue.
   */
  async removeById(conn: PoolConnection, id: number): Promise<void> {
    await conn.query(`DELETE FROM ${TABLE} WHERE id = ?`, [id]);
    this.logger.debug(`Removed record id=${id} from ${TABLE}`);
  }
}

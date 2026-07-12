import { Injectable, Logger } from '@nestjs/common';
import { PoolConnection, RowDataPacket } from 'mysql2/promise';

export interface PendingRow {
  id: number;
  userId: string;
  serverId: string;
}

/**
 * ДОПУЩЕНИЕ: колонки status/created_at — если их нет в реальной таблице,
 * упростите WHERE/ORDER BY ниже.
 */
const TABLE = 'users_pending_disable';

interface PendingQueryRow extends RowDataPacket {
  id: number;
  userId: string;
  serverId: string;
}

@Injectable()
export class UsersPendingDisableService {
  private readonly logger = new Logger(UsersPendingDisableService.name);

  /**
   * Блокирует и возвращает одну запись из очереди.
   * SKIP LOCKED (MySQL 8+) — чтобы параллельные запуски воркера
   * не ждали друг друга на одной заблокированной строке.
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
   * Финальный шаг цикла — удаление обработанной записи из очереди.
   */
  async removeById(conn: PoolConnection, id: number): Promise<void> {
    await conn.query(`DELETE FROM ${TABLE} WHERE id = ?`, [id]);
    this.logger.debug(`Удалена запись id=${id} из ${TABLE}`);
  }
}

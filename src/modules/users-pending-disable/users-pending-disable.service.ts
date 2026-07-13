import { Injectable, Logger } from '@nestjs/common';
import { PoolConnection, RowDataPacket } from 'mysql2/promise';

export interface UsersPendingDisableRow {
  id: number;
  ldap_user_name: string;
  created_at: Date;
  updated_at: Date;
}

const USERS_PENDING_DISABLE_TABLE = `${process.env.MYSQL_DB_PORTAL}.users_pending_disable`;
const LOCAL_USERS_TABLE = `${process.env.MYSQL_DB_EMBY}.localusersv2`;

interface UsersPendingDisableQueryRow extends RowDataPacket {
  id: number;
  ldap_user_name: string;
  created_at: Date;
  updated_at: Date;
}

@Injectable()
export class UsersPendingDisableService {
  private readonly logger = new Logger(UsersPendingDisableService.name);

  /**
   * Locks and returns a single record from the queue.
   * SKIP LOCKED (MySQL 8+) — so that parallel worker runs don't wait
   * on each other for the same locked row.
   */
  async getUserForDisable(conn: PoolConnection): Promise<UsersPendingDisableRow | null> {
    const [rows] = await conn.query<UsersPendingDisableQueryRow[]>(
      `SELECT 
        upd.*
       FROM ${USERS_PENDING_DISABLE_TABLE} AS upd
       INNER JOIN ${LOCAL_USERS_TABLE} AS lu ON lu.Name = upd.ldap_user_name 
       ORDER BY id ASC
       LIMIT 1
       FOR UPDATE SKIP LOCKED`,
    );

    if (rows.length === 0) {
      return null;
    }

    const row = rows[0];
    return { id: row.id, ldap_user_name: row.ldap_user_name, created_at: row.created_at, updated_at: row.updated_at };
    //return row;
  }

  async removeById(conn: PoolConnection, id: number): Promise<void> {
    await conn.query(`DELETE FROM ${USERS_PENDING_DISABLE_TABLE} WHERE id = ?`, [id]);
    this.logger.debug(`Removed record id=${id} from ${USERS_PENDING_DISABLE_TABLE}`);
  }
}

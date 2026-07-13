import { Global, Module } from '@nestjs/common';
import * as mysql from 'mysql2/promise';

export const MYSQL_POOL = 'MYSQL_POOL';

/**
 * Single MySQL server, multiple databases (schemas) on it.
 * `database` below is only a "default schema" for unqualified queries —
 * it does NOT restrict which databases the connection can reach.
 * Cross-database queries use a fully qualified `db_name.table_name`
 * (see TABLES in users-pending-disable.service.ts / user-subscription.service.ts).
 *
 * The MySQL user just needs GRANT privileges on every database it touches.
 * If you don't want a default schema at all, leave MYSQL_DATABASE unset —
 * `database` below will simply be undefined, which mysql2 accepts fine.
 */
@Global()
@Module({
  providers: [
    {
      provide: MYSQL_POOL,
      useFactory: (): mysql.Pool => {
        return mysql.createPool({
          host: process.env.MYSQL_HOST ?? 'localhost',
          port: Number(process.env.MYSQL_PORT ?? 3306),
          user: process.env.MYSQL_USER,
          password: process.env.MYSQL_PASSWORD,
          database: process.env.MYSQL_DB_PORTAL,
          waitForConnections: true,
          connectionLimit: 5,
        });
      },
    },
  ],
  exports: [MYSQL_POOL],
})

export class MysqlModule {}

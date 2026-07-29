import config from '../../config/config';
import { Global, Module } from '@nestjs/common';
import * as mysql from 'mysql2/promise';

export const MYSQL_POOL = 'MYSQL_POOL';

/**
 * Single MySQL server, multiple databases (schemas) on it.
 * `database` below is only a "default schema" for unqualified queries —
 * it does NOT restrict which databases the connection can reach.
 * Cross-database queries use a fully qualified `db_name.table_name`
 * (see TABLES in users-pending-disable.service.ts / subscriptions.service.ts).
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
                    host: config.mysql.host,
                    port: config.mysql.port,
                    user: config.mysql.user,
                    password: config.mysql.password,
                    database: config.mysql.dbPortal,
                    waitForConnections: true,
                    connectionLimit: 5,
                    // debug: config.debug
                });
            },
        },
    ],
    exports: [MYSQL_POOL],
})
export class MysqlModule {}

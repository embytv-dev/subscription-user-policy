import { Global, Module } from '@nestjs/common';
import * as mysql from 'mysql2/promise';

export const MYSQL_POOL = 'MYSQL_POOL';

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
          database: process.env.MYSQL_DATABASE,
          waitForConnections: true,
          connectionLimit: 5,
        });
      },
    },
  ],
  exports: [MYSQL_POOL],
})
export class MysqlModule {}

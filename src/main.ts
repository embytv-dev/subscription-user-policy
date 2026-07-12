import { NestFactory } from '@nestjs/core';
import { Pool } from 'mysql2/promise';
import Redis from 'ioredis';
import { AppModule } from './app.module';
import { WorkerService } from './modules/worker/worker.service';
import { MYSQL_POOL } from './modules/mysql/mysql.module';
import { REDIS_CLIENT } from './modules/redis/redis.module';

async function bootstrap() {
  // Console application — no HTTP server
  const appContext = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'warn', 'error'],
  });

  const iterations = Number(process.argv[2] ?? process.env.ITERATIONS ?? 10);

  try {
    const worker = appContext.get(WorkerService);
    await worker.run(iterations);
  } catch (err) {
    console.error('Application terminated with an error:', err);
    process.exitCode = 1;
  } finally {
    const pool = appContext.get<Pool>(MYSQL_POOL);
    const redis = appContext.get<Redis>(REDIS_CLIENT);

    await pool.end();
    redis.disconnect();

    await appContext.close();
  }
}
void bootstrap();

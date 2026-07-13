import {Module} from '@nestjs/common';
import {ConfigModule} from '@nestjs/config';
import {AppService} from './app.service';
import {MysqlModule} from './modules/mysql/mysql.module';
import {RedisModule} from './modules/redis/redis.module';
import {WorkerModule} from './modules/worker/worker.module';

@Module({
    imports: [
        ConfigModule.forRoot({isGlobal: true}),
        MysqlModule,
        RedisModule,
        WorkerModule,
    ],
    providers: [AppService],
})
export class AppModule {
}

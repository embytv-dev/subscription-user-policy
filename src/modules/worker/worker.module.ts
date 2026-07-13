import {Module} from '@nestjs/common';
import {WorkerService} from './worker.service';
import {UsersPendingDisableModule} from '../users-pending-disable/users-pending-disable.module';
import {UserPolicyNotifierModule} from '../user-policy-notifier/user-policy-notifier.module';

@Module({
    imports: [UsersPendingDisableModule, UserPolicyNotifierModule],
    providers: [WorkerService],
    exports: [WorkerService],
})
export class WorkerModule {
}

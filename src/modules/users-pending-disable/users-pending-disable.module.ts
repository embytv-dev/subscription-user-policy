import { Module } from '@nestjs/common';
import { UsersPendingDisableService } from './users-pending-disable.service';
import { UserSubscriptionService } from './user-subscription.service';

@Module({
  providers: [UsersPendingDisableService, UserSubscriptionService],
  exports: [UsersPendingDisableService, UserSubscriptionService],
})
export class UsersPendingDisableModule {}

import { Module } from '@nestjs/common';
import { UsersPendingDisableService } from './users-pending-disable.service';
import { SubscriptionsService } from './subscriptions.service';

@Module({
  providers: [UsersPendingDisableService, SubscriptionsService],
  exports: [UsersPendingDisableService, SubscriptionsService],
})
export class UsersPendingDisableModule {}

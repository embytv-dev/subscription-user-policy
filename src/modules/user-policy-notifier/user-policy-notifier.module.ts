import { Module } from '@nestjs/common';
import { UserPolicyNotifierService } from './user-policy-notifier.service';

@Module({
  providers: [UserPolicyNotifierService],
  exports: [UserPolicyNotifierService],
})
export class UserPolicyNotifierModule {}

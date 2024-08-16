import { Module } from '@nestjs/common';
import { SubscriberController } from './subscriber.controller';
import { SubscriberService } from './subscriber.service';

@Module({
  providers:[SubscriberService]
  controllers: [SubscriberController]
})
export class SubscriberModule {}

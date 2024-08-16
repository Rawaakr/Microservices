import { Module } from '@nestjs/common';
import { PublisherModule } from './publisher/publisher.module';
import { SubscriberService } from './subscriber/subscriber.service';
import { SubscriberModule } from './subscriber/subscriber.module';
import { PublisherService } from './publisher/publisher.service';


@Module({
  imports: [PublisherModule, SubscriberModule],
  controllers: [],
  providers: [PublisherService,SubscriberService],
  exports: [PublisherService, SubscriberService],
})
export class AppModule {}

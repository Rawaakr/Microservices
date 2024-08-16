import { Controller, Post } from '@nestjs/common';
import { SubscriberService } from './subscriber.service';

@Controller('subscriber')
export class SubscriberController {
    constructor(private readonly subscriberService: SubscriberService){}
    @Post('/subscribe')
    onModuleInit() {
        return this.subscriberService.onModuleInit();
    }

}

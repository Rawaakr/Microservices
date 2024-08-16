import { Controller, Post } from '@nestjs/common';
import { PublisherService } from './publisher.service';

@Controller('publisher')
export class PublisherController {
    constructor(private readonly publisherService: PublisherService) {}
    @Post('/publish')
    publishMessage() {
        return this.publisherService.publishMessage();
    }
}

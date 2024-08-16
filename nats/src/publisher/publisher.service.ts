import { Injectable, OnModuleInit } from '@nestjs/common';
import { StringCodec, connect, NatsConnection } from 'nats';

@Injectable()
export class PublisherService implements OnModuleInit {
  private natsConnection: NatsConnection;

  async onModuleInit() {
    this.natsConnection = await connect({ servers: ['nats://localhost:4222'] });
    console.log('Publisher connected to NATS');
  }

  async publishMessage() {
    const sc = StringCodec();
    await this.natsConnection.publish("notif", sc.encode("Hello among us"));
    console.log("Message published");
  }
}

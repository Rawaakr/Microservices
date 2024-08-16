import { Injectable, OnModuleInit } from '@nestjs/common';
import { StringCodec, connect, NatsConnection, Subscription } from 'nats';

@Injectable()
export class SubscriberService implements OnModuleInit {
  private natsConnection: NatsConnection;
  private subscription: Subscription;

  async onModuleInit() {
    this.natsConnection = await connect({ servers: ['nats://localhost:4222'] });
    console.log('Subscriber connected to NATS');
    
    this.subscription = this.natsConnection.subscribe('notif');
    const sc = StringCodec();
    
    (async () => {
      console.log('Subscriber is listening for messages...');
      for await (const msg of this.subscription) {
        console.log(`[${this.subscription.getProcessed()}]: ${sc.decode(msg.data)}`);
      }
    })();
  }
}

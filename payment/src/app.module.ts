import { Module, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { PaymentModule } from './payment/payment.module';
import { PaymentController } from './payment/payment.controller';
import { PaymentService } from './payment/payment.service';
import { PrismaService } from './prisma/prisma.service';
import { PrismaModule } from './prisma/prisma.module';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { NatsConfig } from './nats-config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    HttpModule,
    PaymentModule,
    PrismaModule,
    ClientsModule.registerAsync([
      {
        name: 'NATS_SERVICE',
        imports: [ConfigModule],
        useFactory: async (configService: ConfigService) => ({
          transport: Transport.NATS,
          options: {
            servers: configService.get<string>('NATS_SERVER'),
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  providers: [PaymentService, PrismaService],
  exports: [ClientsModule],
})
export class AppModule implements OnModuleDestroy {  

  async onModuleDestroy() {
    await NatsConfig.disconnect();
  }
}



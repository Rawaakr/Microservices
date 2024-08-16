import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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
  ],
  exports: [ClientsModule],
  controllers: [PaymentController],
  providers: [PaymentService, PrismaService],
})
export class AppModule implements OnModuleInit{
  async onModuleInit() {
      await NatsConfig.connect();
  }
}

import { Module, OnModuleInit } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { NatsConfig } from './nats-config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }), // Configuration module should be first
    AuthModule,
    PrismaModule,
  ],
  exports: [ClientsModule],
})
export class AppModule implements OnModuleInit {
  async onModuleInit() {
      await NatsConfig.connect();
  }
  async onModuleDestroy() {
    await NatsConfig.disconnect();
  }
}

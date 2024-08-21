import { Module, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { NatsConfig } from './nats-config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }), // Configuration module should be first
    AuthModule,
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
  exports: [ClientsModule],
})
export class AppModule implements OnModuleInit, OnModuleDestroy {
  constructor(private configService :ConfigService){}
  async onModuleInit() {
    await NatsConfig.connect(this.configService.get<string>('NATS_SERVER'));
  }

  async onModuleDestroy() {
    await NatsConfig.disconnect();
  }
}

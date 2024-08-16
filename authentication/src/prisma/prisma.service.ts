import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit{
    constructor(private configService : ConfigService){
        super({
            datasources: {
              db: {
                url: configService.get<string>('DATABASE_URL'), // Utilisation de ConfigService pour récupérer l'URL de la base de données
              },
            },
          });
    }
    async onModuleInit() {
        await this.$connect();
    }
}

import { HttpModule, HttpService } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentController } from './payment.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
    imports : [HttpModule,PrismaModule],
    providers : [PaymentService,PrismaService],
    controllers : [PaymentController],
    exports: [PaymentService],
})
export class PaymentModule {}

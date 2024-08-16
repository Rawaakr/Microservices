import { HttpModule, HttpService } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
    imports : [HttpModule],
    providers : [PaymentService,PrismaService]})
export class PaymentModule {}

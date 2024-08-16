import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { PaymentDto } from './dto/Payment.dto';
import { PaymentService } from './payment.service';

@Controller('payment')
export class PaymentController {
    constructor(private readonly paymentservice:PaymentService){}
    @Post('create-payment')
    initPayment(@Body() paymentDto : PaymentDto) {
        return this.paymentservice.initPayment(paymentDto);
    }
    @Get('get-payment/:paymentId')
    getPayment(@Param('paymentId') paymentId: string) {
        return this.paymentservice.getPayment(paymentId);
    }
    @Get('webhook')
    handlewebhook(@Query('payment_ref') paymentRef : string){
        console.log('Received webhook for paymentRef:', paymentRef);
        return this.paymentservice.handleWebhook(paymentRef);
    }
    @Get('get-status/:paymentRef')
    getPaymentStatus(@Param("paymentRef") paymentRef: string){
        return this.paymentservice.getPaymentStatus(paymentRef);
    }
}

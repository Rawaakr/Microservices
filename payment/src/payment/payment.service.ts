import { HttpService } from '@nestjs/axios';
import { Injectable, NotFoundException, OnModuleInit, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentDto } from './dto/Payment.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { NatsConfig } from 'src/nats-config';
import { Subjects } from "../../../common/src/subjects/subjects";
import { UserConnectedEvent } from "../../../common/src/events/user-connected";
import { ConsumerOptsBuilder, JetStreamSubscription } from 'nats';
@Injectable()
export class PaymentService implements OnModuleInit{
    private connectedUsers: Set<string>= new Set();
    private apiKey : string;
    private apiUrl : string ;
    private WEBHOOK_URL : string ;
    constructor(private readonly httpService: HttpService,
        private configService : ConfigService,
        private readonly prismaService : PrismaService,
    ){
        this.apiKey = this.configService.get('KONNECT_API_KEY');
        this.apiUrl = this.configService.get('KONNECT_API_URL');
        this.WEBHOOK_URL = this.configService.get<string>('WEBHOOK_URL');

    }  
    private getHeaders() {
        return {
            'x-api-key': this.apiKey,
            'Content-Type': 'application/json',
        };
    }
    async onModuleInit() {
        await this.UserConnectedListener();
    } 
    
    private async UserConnectedListener() {
    
        const js = NatsConfig.getJetStream();
        const sub:JetStreamSubscription =await  js.subscribe(Subjects.UserConnected,{});
        (async () => {
            for await ( const msg of sub){
                const event: UserConnectedEvent = JSON.parse(msg.data.toString());
                this.handleUserConnected(event);
            }
        })();
    }
    handleUserConnected(event: UserConnectedEvent) {
        this.connectedUsers.add(event.email);
        console.log(`user with email : ${event.email} is available for payments`)
    }
    async initPayment(paymentDto: PaymentDto): Promise<any> {

        if(!this.connectedUsers.has(paymentDto.email)){
            throw new UnauthorizedException(`User is not connected. Payment cannot be initiated `)
        }

        console.log("Webhook URL:", this.WEBHOOK_URL);

        const paymentDtoWithWebhook = {
            ...paymentDto,
            webhook: this.WEBHOOK_URL
        };
        console.log("Payment DTO with Webhook:", paymentDtoWithWebhook);
        try {
            const response = await this.httpService.post(`${this.apiUrl}/payments/init-payment`, paymentDtoWithWebhook, {
                headers: this.getHeaders()
            }).toPromise();
    
            console.log("HTTP Response:", response.data);
            
            await this.prismaService.payments.create({ data : {paymentId: response.data.paymentRef}
            });
            return response.data;
        } catch (err) {
            console.error("Error initiating payment", err);
            throw err; 
        }
    }

    async getPayment(paymentId : string): Promise<any> {
        try {
        const response = await this.httpService.get(`${this.apiUrl}/payments/${paymentId}`,{headers: this.getHeaders()}).toPromise();
        return response.data;
        } catch(err) {
            console.error("Error getting payment",err)
        }
    }
    async handleWebhook(paymentRef: string) : Promise<void> { 

        const response = await this.httpService.get(`${this.apiUrl}/payments/${paymentRef}`,{headers: this.getHeaders()}).toPromise();
        const Payment = await this.prismaService.payments.findUnique({where : {paymentId : paymentRef}}) ;
        if (!Payment) throw new NotFoundException("Payment not found");
        const paymentToUpdate = response.data ; 
        console.log("payment to update",paymentToUpdate);
        if (paymentToUpdate && paymentToUpdate.payment.id) {
            await this.prismaService.payments.update({
                where: { paymentId: paymentToUpdate.payment.id },
                data: { status: paymentToUpdate.payment.status}
            });
        } else {
            throw new Error('Invalid payment data received');
        }

    }

    async getPaymentStatus(paymentRef : string): Promise<{ "Payment status": string }> {
        try{
        const response = await this.httpService.get(`${this.apiUrl}/payments/${paymentRef}`,{headers: this.getHeaders()}).toPromise();
        return { "Payment status" : response.data.payment.status};
        } catch (err) {
            console.error("Error checking payment status", err);
            throw err;
        }
    }
   
}

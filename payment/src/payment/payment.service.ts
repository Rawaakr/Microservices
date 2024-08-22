import { HttpService } from '@nestjs/axios';
import { Injectable, NotFoundException, OnModuleDestroy, OnModuleInit, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentDto } from './dto/Payment.dto';
import { PrismaService } from '../prisma/prisma.service';
import { NatsConfig } from '../nats-config';
import { UserConnectedEvent } from "@common/events/user-connected";
import { consumerOpts, JetStreamClient, JetStreamSubscription } from 'nats';
import * as AsyncLock from "async-lock";
const lock = new AsyncLock();
@Injectable()
export class PaymentService implements OnModuleInit, OnModuleDestroy {
    private connectedUsers: Set<string> = new Set();
    private apiKey: string;
    private apiUrl: string;
    private WEBHOOK_URL: string;
    private js: JetStreamClient;
    private listenerInitialized = false;
    private sub: JetStreamSubscription;
    constructor(private readonly httpService: HttpService,
        private configService: ConfigService,
        private readonly prismaService: PrismaService,
    ) {
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
        if (!this.listenerInitialized) {
            await NatsConfig.connect(this.configService.get<string>('NATS_SERVER'));
            this.js = NatsConfig.getJetStream();
            console.log(this.listenerInitialized);
            await this.UserConnectedListener();
            this.listenerInitialized = true;
            console.log(this.listenerInitialized);
            
        }
        
    }
    async onModuleDestroy() {
        if (this.sub) {
            await this.sub.unsubscribe();
            this.sub = null ;
        }
        await NatsConfig.disconnect();
    }

    private async UserConnectedListener() {
    if (this.sub) {
        console.log("UserConnectedListener is already set up, skipping...");
        return;
    }

    const key = `${this.sub}`;
    return await lock.acquire(key, async () => {
        const opts = consumerOpts();
        opts.durable("service-payment");
        opts.ackExplicit();
        opts.ackWait(5000);
        opts.deliverTo("connected_user_deliver_subject");
        
        try {
            // Check if there's already an active subscription before creating a new one
            if (!this.sub) {
                this.sub = await this.js.subscribe('user:connected', opts);
                console.log("UserConnectedListener set up successfully");
                (async () => {
                    try {
                        for await (const msg of this.sub) {
                            console.log("Message received:", msg.data.toString());
                            const event: UserConnectedEvent = JSON.parse(msg.data.toString());
                            await this.handleUserConnected(event);
                            await msg.ack();
                            console.log("Message ack sent");
                        }
                    } catch (err) {
                        console.error("Error processing messages:", err);
                    }
                })();
            } else {
                console.log("Subscription already exists, skipping setup.");
            }
        } catch (err) {
            console.error("Failed to subscribe to the subject:", err);
        }
    });
}

    
    private async handleUserConnected(event: UserConnectedEvent) {
        this.connectedUsers.add(event.email);
        console.log(`user with email : ${event.email} is available for payments`)
    }
    async initPayment(paymentDto: PaymentDto): Promise<any> {

        if (!this.connectedUsers.has(paymentDto.email)) {
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

            await this.prismaService.payments.create({
                data: { paymentId: response.data.paymentRef }
            });
            return response.data;
        } catch (err) {
            console.error("Error initiating payment", err);
            throw err;
        }
    }
    

    async getPayment(paymentId: string): Promise<any> {
        try {
            const response = await this.httpService.get(`${this.apiUrl}/payments/${paymentId}`, { headers: this.getHeaders() }).toPromise();
            return response.data;
        } catch (err) {
            console.error("Error getting payment", err)
        }
    }
    async handleWebhook(paymentRef: string): Promise<void> {

        const response = await this.httpService.get(`${this.apiUrl}/payments/${paymentRef}`, { headers: this.getHeaders() }).toPromise();
        const Payment = await this.prismaService.payments.findUnique({ where: { paymentId: paymentRef } });
        if (!Payment) throw new NotFoundException("Payment not found");
        const paymentToUpdate = response.data;
        console.log("payment to update", paymentToUpdate);
        if (paymentToUpdate && paymentToUpdate.payment.id) {
            await this.prismaService.payments.update({
                where: { paymentId: paymentToUpdate.payment.id },
                data: { status: paymentToUpdate.payment.status }
            });
        } else {
            throw new Error('Invalid payment data received');
        }

    }

    async getPaymentStatus(paymentRef: string): Promise<{ "Payment status": string }> {
        try {
            const response = await this.httpService.get(`${this.apiUrl}/payments/${paymentRef}`, { headers: this.getHeaders() }).toPromise();
            return { "Payment status": response.data.payment.status };
        } catch (err) {
            console.error("Error checking payment status", err);
            throw err;
        }
    }

}

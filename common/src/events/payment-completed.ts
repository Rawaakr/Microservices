export interface PaymentInitiatedEvent {
    amount : number ; 
    paymentId : string ;
    userId : number;
    status : string;
}
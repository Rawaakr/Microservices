import { JetStreamClient, NatsConnection, connect} from "nats";

export class NatsConfig {

    private static connection : NatsConnection;
    private static js : JetStreamClient;

    static async connect(): Promise<void> {
        if(!this.connection){
            this.connection = await connect({servers : 'nats://localhost:4222'});
            this.js = this.connection.jetstream();
            console.log("Authentication pub connected");
        }
    }

    static getJetStream(): JetStreamClient {
        if(!this.js) {
            throw new Error('NATS JetStream not connected');
        }
        return this.js;
    }

    static async disconnect(): Promise<void>{
        if(this.connection){
            await this.connection.close();
        }
    }
}
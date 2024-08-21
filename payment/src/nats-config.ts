import { Subjects } from "@common/subjects/subjects";
import { ConfigService } from "@nestjs/config";
import { JetStreamClient, JetStreamManager, NatsConnection, connect, StorageType,RetentionPolicy, AckPolicy} from "nats";

export class NatsConfig {
    constructor(){}
    private static connection : NatsConnection;
    private static js : JetStreamClient;
    private static jsm : JetStreamManager;

    static async connect(natsServer : string): Promise<void> {
        if(!this.connection){
            this.connection = await connect({servers :  natsServer });
            console.log("Connected to NATS server successfully");
            console.log("Creating JetStream client...");
            this.js = this.connection.jetstream();
            // console.log("JetStream client created successfully");
            // this.jsm = await this.js.jetstreamManager() ; 
            // console.log("JetStream Manager created successfully");


            // await this.jsm.consumers.add("MY_STREAM",{
            //     durable_name: "payment-service",
            //     ack_policy: AckPolicy.Explicit,
            //     ack_wait : 5000 ,

            // });
            //console.log("consumer created")
        }
    }

    static getJetStream(): JetStreamClient{
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
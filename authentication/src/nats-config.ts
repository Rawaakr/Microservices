import { JetStreamClient, JetStreamManager, NatsConnection, connect, StorageType,RetentionPolicy} from "nats";

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
            console.log("JetStream client created successfully");
            this.jsm = await this.js.jetstreamManager() ; 
            console.log("JetStream Manager created successfully");
            try {
                await this.jsm.streams.add({
                    name: "MY_STREAM",
                    subjects: ["user:connected"],
                    storage: StorageType.File,
                    retention: RetentionPolicy.Limits,
                });
                console.log("Stream created successfully");
            } catch (error) {
                // Stream already exists or some other issue
                console.log("Stream creation failed or already exists:", error);
            }
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
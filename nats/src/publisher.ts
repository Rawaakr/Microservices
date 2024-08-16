import { StringCodec, connect } from "nats";
import { Servers } from "nats/lib/nats-base-client/servers";


const main = async() => {
    const nc = await connect({servers : [
        "http://localhost:4222"
    ]});
    console.log("Connected to Nats");
    const sc = StringCodec()
    nc.publish("notif", sc.encode("Hello among us"));
}
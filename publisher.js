import WinnipegTransitAPI from "winnipegtransitapi";
import kafka from './kafka.js';

// create a WT transit api client with your API_KEY
const { API_KEY, STOP_NUMBER, KAFKA_TOPIC = 'stop_schedules' } = process.env;
const client = new WinnipegTransitAPI(API_KEY);

const producer = kafka.producer();

// You can run this to create a topic programmatically
// const admin = kafka.admin();
// await admin.connect();
// await admin.createTopics({
//     topics: [{ topic: KAFKA_TOPIC }],
//     waitForLeaders: true
// });

const fetchAndPublishStopInfo = async () => {
    // load a stop schedule from the winnipegtransitapi
    const stop_schedule = await client.getStopSchedule(STOP_NUMBER);

    // Send result to Kafka
    const send_responses = await producer.send({
        topic: KAFKA_TOPIC,
        messages: [{
            key: STOP_NUMBER,
            value: JSON.stringify(stop_schedule),
        }]
    });
    console.log("Published schedule message to kafka at base offset %s", send_responses[0].baseOffset); // could print send_responses
};

const main = async () => {
    console.log("Logging stop schedules for stop %s with Transit API Key: %s", STOP_NUMBER, API_KEY);
    // Wait until our producer is connected.
    await producer.connect();

    // Run this every 20 seconds.
    setInterval(function() {
        fetchAndPublishStopInfo(producer).catch((error) => {
            console.log("Error => ", error);
            process.exit(1);
        });
    }, 20 * 1000);
}

main().catch((exception) => {
   console.log("Error => ", exception);
   process.exit(1);
});
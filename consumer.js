import elasticsearch from 'elasticsearch';
import kafka from './kafka.js';

const consumer = kafka.consumer({
    groupId: process.env.GROUP_ID || 'schedule_logger'
});

const esClient = elasticsearch.Client({
    host: process.env.ES_HOST || 'localhost:9200',
    // log: 'trace',
    ssl: { rejectUnauthorized: false, pfx: [] },
});

const main = async () => {
    await consumer.connect()

    await consumer.subscribe({
        topic: process.env.KAFKA_TOPIC || 'stop_schedules',
        // fromBeginning: true
    });

    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            console.log('Received message', {
                topic,
                partition,
                key: message.key.toString(),
                value: message.value.toString()
            })

            let json = JSON.parse(message.value);

            const stop_number = json['stop-schedule']['stop'].key;
            const route_schedules = json['stop-schedule']['route-schedules'];

            route_schedules.forEach((scheduled_route) => {
                scheduled_route['scheduled-stops'].forEach((scheduled_stop) => {
                    esClient.index({
                        index: `scheduled_stops`,
                        body: {
                            ...scheduled_stop,
                            stop_number,
                        }
                    }).then(response => {
                        console.log("INDEX SUCCESSFUL!"); // response => ", response);
                    }).catch(err => {
                        console.log("ERROR => ", err);
                        process.exit(1);
                    });
                });
            });
        }
    });
}

main().catch(async error => {
    console.error(error)
    try {
        await consumer.disconnect()
    } catch (e) {
        console.error('Failed to gracefully disconnect consumer', e)
    }
    process.exit(1)
})
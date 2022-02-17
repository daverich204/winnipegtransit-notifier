# winnipegtransit-notifier 
Not production ready, just a quick proof of concept I wrote while learning kafka. 

## What does it do?

The `publisher` will poll the Winnipeg Transit API for stop schedules every 20 seconds, and send
this data using a kafka producer. 

The consumer takes this data, and splits it apart into individual scheduled stops, storing these scheduled stops
in an elastic search index so you can have historical data for arrivals at a stop.

# Pre-requisites 

This requires kafka to be setup and running, by default it will
try to connect to a local kafka instance on `localhost:9092` but you can override
this by passing in a `KAFKA_BOOTSTRAP_SERVER='host:port'` environment variable.

# Installation

`npm install` or `yarn`

# Usage 

Here's how I get everything up and running in development;

## Run Zookeeper / Kafka 

```bash
bin/zookeeper-server-start.sh config/zookeeper.properties
```
and 

```bash
bin/kafka-server-start.sh config/server.properties
```

## Run the Publisher 

You can run one or more publishers for different `API_KEY` and `STOP_NUMBER` combinations.

```js
API_KEY=YOUR_WINNIPEG_TRANSIT_API_KEY STOP_NUMBER=10064 node publisher.js
```

if you want to monitor multiple stops, you can open a new tab in a terminal and
run

```bash
API_KEY=YOUR_WINNIPEG_TRANSIT_API_KEY STOP_NUMBER=10638 node publisher.js
```

## Run the Consumer 

You can run the sample consumer to read from kafka, and log scheduled stops to an elastic search index. 

By default, it will try and connect to elasticsearch on `localhost:9200`, but this can be configured by passing in an `ES_HOST`
environment variable. 

```bash
ES_HOST=YOUR_ELASTICSEARCH_HOST:PORT node consumer.js
```
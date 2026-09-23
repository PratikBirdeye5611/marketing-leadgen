import { Consumer, EachMessagePayload } from 'kafkajs';
import { getKafkaInstance } from './kafka.client';
import { KafkaTopicsConstants } from '../config/constants';

let consumer: Consumer | null = null;

export async function startCreateBusinessConsumer(): Promise<void> {
  const kafka = getKafkaInstance();
  consumer = kafka.consumer({ groupId: 'create-business-consumer-group' });

  await consumer.connect();
  await consumer.subscribe({ topic: KafkaTopicsConstants.CREATE_BUSINESS_KAFKA_TOPIC, fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }: EachMessagePayload) => {
      try {
        const parsed = JSON.parse(message.value?.toString() || '{}');
        console.log(
          `Received message on kafka topic ${topic}, partition: ${partition}, offset: ${message.offset}, contactRequestId: ${parsed.contactRequestId}`,
        );
        console.log('contactRequestMessage:', parsed.messageObject?.contactRequestMessage);

        // Placeholder only — mirrors CreateBusinessKafkaListener.listen() in Java.
        // Real business-creation logic (contactRequestService, businessProfileService, etc.)
        // will live in its own service later; this consumer just verifies delivery for now.
      } catch (err) {
        console.error(`Error processing message on topic ${topic}, offset ${message.offset}:`, err);
      }
    },
  });

  console.log(`CreateBusiness consumer started, listening on topic: ${KafkaTopicsConstants.CREATE_BUSINESS_KAFKA_TOPIC}`);
}

export async function stopCreateBusinessConsumer(): Promise<void> {
  if (consumer) {
    await consumer.disconnect();
    consumer = null;
  }
}
import { Kafka, Producer, ProducerRecord } from 'kafkajs';
import { env } from '../config/env';

let producer: Producer | null = null;
let kafka: Kafka | null = null;

export function getKafkaInstance(): Kafka {
  if (!kafka) {
    kafka = new Kafka({
      clientId: env.kafka.clientId,
      brokers: env.kafka.brokers,
    });
  }
  return kafka;
}

export async function getKafkaProducer(): Promise<Producer> {
  if (!producer) {
    producer = getKafkaInstance().producer();
    await producer.connect();
  }
  return producer;
}

export async function closeKafkaProducer(): Promise<void> {
  if (producer) {
    await producer.disconnect();
    producer = null;
  }
}

import { getKafkaProducer } from './kafka.client';
import { IKafkaMessage, CreateBusinessKafkaMessage } from '../types/kafka.types';
import { IContactRequest } from '../types/contact-request.types';
import { serialize } from '../utils/json.util';

export interface IKafkaProducer {
  sendMessage(message: IKafkaMessage<unknown>): Promise<void>;
  publishMessageToKafka(topicName: string, key: unknown, data: unknown): Promise<void>;
  constructCreateBusinessMessage(
    kafkaTopic: string,
    contactRequestMessage: IContactRequest,
    contactRequestId: number,
    contextMap?: Record<string, string>,
  ): IKafkaMessage<CreateBusinessKafkaMessage>;
}

export class KafkaProducer implements IKafkaProducer {
  async sendMessage(message: IKafkaMessage<unknown>): Promise<void> {
    if (!message || !message.messageObject) {
      throw new Error('Malformed or null kafka message');
    }
    try {
      const producer = await getKafkaProducer();
      const result = await producer.send({
        topic: message.kafkaTopic,
        messages: [
          {
            key: message.contactRequestId != null ? String(message.contactRequestId) : undefined,
            value: serialize(message),
          },
        ],
      });
      console.log(
        `Successfully sent message to kafka for contactRequestId ${message.contactRequestId}, kafkaTopic: ${message.kafkaTopic}`,
        result,
      );
    } catch (error) {
      console.error(
        `Error while sending message to kafka for contactRequestId ${message.contactRequestId}, kafkaTopic: ${message.kafkaTopic}`,
        error,
      );
      throw error;
    }
  }

  async publishMessageToKafka(topicName: string, key: unknown, data: unknown): Promise<void> {
    if (!data) {
      throw new Error('Malformed or null kafka message');
    }
    try {
      const producer = await getKafkaProducer();
      await producer.send({
        topic: topicName,
        messages: [
          {
            key: key != null ? serialize(key) : undefined,
            value: serialize(data),
          },
        ],
      });
    } catch (error) {
      console.error(`Error publishing message to kafka topic ${topicName}:`, error);
      throw error;
    }
  }

  // NEW — equivalent of constructKafkaMessageForCreatingBusiness(...) in the Java code
  constructCreateBusinessMessage(
    kafkaTopic: string,
    contactRequestMessage: IContactRequest,
    contactRequestId: number,
    contextMap?: Record<string, string>,
  ): IKafkaMessage<CreateBusinessKafkaMessage> {
    const business: CreateBusinessKafkaMessage = {
      contactRequestId,
      contactRequestMessage,
    };

    return {
      kafkaTopic,
      messageObject: business,
      contactRequestId,
      contextMap,
    } as IKafkaMessage<CreateBusinessKafkaMessage>;
  }
}
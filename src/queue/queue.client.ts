import { Queue, Worker, Job, ConnectionOptions } from 'bullmq';
import { env } from '../config/env';
import { JobName } from './job-names';

const connection: ConnectionOptions = {
  host: env.redis.host,
  port: env.redis.port,
  password: env.redis.password || undefined,
  maxRetriesPerRequest: null,
  enableOfflineQueue: false,
  lazyConnect: true,
};

const queues = new Map<string, Queue>();

export function getQueue(name: string): Queue {
  if (!queues.has(name)) {
    queues.set(name, new Queue(name, {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'fixed', delay: 15000 },
        removeOnComplete: true,
        removeOnFail: false,
      },
    }));
  }
  return queues.get(name)!;
}

export async function publishJob(jobName: JobName, payload: unknown): Promise<void> {
  try {
    const queue = getQueue(jobName);
    await queue.add(jobName, payload);
  } catch (error) {
    console.warn(`Failed to publish job ${jobName} to queue (Redis unavailable):`, (error as Error).message);
  }
}

export function createWorker(
  jobName: JobName,
  processor: (job: Job) => Promise<void>,
  concurrency = 5,
): Worker {
  return new Worker(jobName, processor, {
    connection,
    concurrency,
  });
}

export async function closeAllQueues(): Promise<void> {
  for (const queue of queues.values()) {
    await queue.close();
  }
  queues.clear();
}

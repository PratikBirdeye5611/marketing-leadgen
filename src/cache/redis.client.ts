import Redis from 'ioredis';
import { env } from '../config/env';

let redisClient: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redisClient) {
    console.log('Creating Redis client with host:', env.redis.host, 'port:', env.redis.port);
    redisClient = new Redis({
      host: env.redis.host,
      port: env.redis.port,
      password: env.redis.password || undefined,
      db: env.redis.database ?? 0,
      connectTimeout: 5000,
      commandTimeout: 2000,
      maxRetriesPerRequest: 1,
      retryStrategy: (times) => {
        if (times > 3) return null;
        return Math.min(times * 500, 2000);
      },
      enableOfflineQueue: true,
      tls: env.redis.ssl ? {} : undefined,
    });

    redisClient.on('error', (err) => {
      console.warn('Redis connection error (non-fatal):', err.message);
    });

    redisClient.on('connect', () => {
      console.log('Redis connected successfully');
    });

    redisClient.on('ready', () => {
      console.log('Redis ready');
    });
  }
  return redisClient;
}

// Call once during server bootstrap, before the app starts accepting traffic.
export async function initRedis(): Promise<void> {
  const client = getRedisClient();

  if (client.status === 'ready') return;

  await new Promise<void>((resolve, reject) => {
    const onReady = () => {
      client.removeListener('error', onError);
      resolve();
    };
    const onError = (err: Error) => {
      client.removeListener('ready', onReady);
      reject(err);
    };
    client.once('ready', onReady);
    client.once('error', onError);
  });
}

export async function closeRedisClient(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}
import should from 'should';
import { RedisClientType, createClient as RedisCreateClient } from 'redis';
import { GrpcMockServer } from '@alenon/grpc-mock-server';
import { createServiceConfig } from '@restorecommerce/service-config';
import { createLogger } from '@restorecommerce/logger';
import { Events, Topic } from '@restorecommerce/kafka-client';
import { Worker } from '../src/worker';
import { rules } from './mocks';

export const cfg = createServiceConfig(process.cwd());
export const logger = createLogger(cfg.get('logger'));
export { samples } from './mocks';

export async function startWorker(): Promise<Worker> {
  const worker = new Worker();
  await worker.start(cfg, logger);
  return worker;
}
  
export async function connectEvents(): Promise<Events> {
  const events = new Events({
    ...cfg.get('events:kafka'),
    groupId: 'restore-fulfillment-srv-test-runner',
    kafka: {
      ...cfg.get('events:kafka:kafka'),
    }
  }, logger);
  await events.start();
  return events;
}

export async function connectTopics(events: Events, resourceName: string): Promise<Topic> {
  const topic = cfg.get(`events:kafka:topics:${resourceName}:topic`);
  should.exist(topic);
  return events.topic(topic);
}

export async function mockServices(configs: { [key: string]: any }) {
  return await Promise.all(Object.entries(configs).map(async ([name, config]) => { 
    if (!config?.mock) {
      return;
    }

    if (!rules[name]) {
      throw new Error(`No mocking rules for ${name} in mocks.ts!`);
    }

    return await new GrpcMockServer(
      config.address,
    ).addService(
      config.mock.protoPath,
      config.mock.packageName,
      config.mock.serviceName,
      rules[name],
      config.mock.protoLoadOptions,
    ).start();
  }).filter(m => !!m)) as GrpcMockServer[];
};

let redisClient: RedisClientType;
export async function getRedisInstance() {
  if (redisClient) {
    return redisClient;
  }
  const redisConfig = cfg.get('redis');
  redisConfig.database = cfg.get('redis:db-indexes:db-subject');
  redisClient = RedisCreateClient(redisConfig);
  redisClient.on('error', (err: any) => logger.error('Redis Client Error', err));
  await redisClient.connect();
  return redisClient;
}
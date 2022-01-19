import * as should from 'should';
import { createServiceConfig } from '@restorecommerce/service-config';
import { createLogger } from '@restorecommerce/logger';
import { Events, Topic } from '@restorecommerce/kafka-client';
import { Worker } from '../src/worker';

const envPath = __dirname + "/../.env"
require('dotenv').config({path:envPath})

export const cfg = createServiceConfig(process.cwd() + '/test');
export const logger = createLogger(cfg.get('logger'));
export const samples = require('./cfg/samples.json');

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
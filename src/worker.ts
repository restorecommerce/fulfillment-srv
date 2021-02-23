import * as _ from 'lodash';
import {
  Server, OffsetStore, database,
  CommandInterface, ServerReflection,
  Health
} from '@restorecommerce/chassis-srv';
import { Events, Topic } from '@restorecommerce/kafka-client';
import { createLogger } from '@restorecommerce/logger';
import { createServiceConfig } from '@restorecommerce/service-config';
import {
  FulfillmentResourceService, FulfillmentCourierResourceService
} from './service';
import { RedisClient, createClient } from 'redis';
import { Arango } from '@restorecommerce/chassis-srv/lib/database/provider/arango/base';
import { Logger } from 'winston';


const Fulfillment_Created = 'fulfillmentCreated';
const Fulfillment_Status = 'fulfillmentStatus';
const Create_Fulfillment = 'createFulfillment';
const QUEUED_JOB = 'queuedJob';


class FulfillmentCommandInterface extends CommandInterface {
  logger: any;
  cfg: any;
  events: Events;
  constructor(server: Server, cfg: any, logger: Logger, events: Events, redisClient: RedisClient) {
    super(server, cfg, logger, events, redisClient);
    this.logger = logger;
  }
}

export class Worker {
  cfg: any;
  offsetStore: OffsetStore;
  server: Server;
  events: Events;
  logger: Logger;
  topics: Map<string, Topic>;
  cis: FulfillmentCommandInterface;
  redisClient: RedisClient;
  constructor(cfg?: any) {
    this.cfg = cfg || createServiceConfig(process.cwd());
    this.logger = createLogger(this.cfg.get('logger'));
  }

  async start(cfg?: any): Promise<any> {
    // Load config
    cfg = cfg || createServiceConfig(process.cwd());

    // create server
    const logger = createLogger(cfg.get('logger'));
    this.server = new Server(cfg.get('server'), logger);

    // get database connection
    const db = await database.get(cfg.get('database:main'), logger);

    // create events
    const kafkaCfg = cfg.get('events:kafka');
    this.events = new Events(kafkaCfg, logger);
    await this.events.start();
    this.offsetStore = new OffsetStore(this.events, cfg, logger);


    const topicTypes = _.keys(kafkaCfg.topics);
    this.topics = new Map<string, Topic>();

    const redisConfig = cfg.get('redis');
    redisConfig.db = this.cfg.get('redis:db-indexes:db-subject');
    this.redisClient = createClient(redisConfig);

    const that = this;
    let fulfillmentService: FulfillmentResourceService;
    let fulfillmentServiceEventListener = async (msg: any, context: any, config: any, eventName: string) => {
      if (eventName == Create_Fulfillment) {
        const reqmsg = { request: msg };
        await fulfillmentService.createFulfillment(reqmsg);
      } else if (eventName == QUEUED_JOB) {
        if (msg && msg.type == that.cfg.get('fulfillmentTrackingJob')) {
          const type = { request: { type: 'job' } };
          await fulfillmentService.trackFulfillment(type);
        }
      } else {
        // command events
        await that.cis.command(msg, context);
      }
    };

    for (let topicType of topicTypes) {
      const topicName = kafkaCfg.topics[topicType].topic;
      const topic = this.events.topic(topicName);
      const offSetValue: number = await this.offsetStore.getOffset(topicName);
      logger.info('subscribing to topic with offset value', topicName, offSetValue);
      if (kafkaCfg.topics[topicType].events) {
        const eventNames = kafkaCfg.topics[topicType].events;
        for (let eventName of eventNames) {
          await topic.on(eventName, fulfillmentServiceEventListener, {
            startingOffset: offSetValue
          });
        }
      }
      this.topics.set(topicType, topic);
    }

    fulfillmentService =
      new FulfillmentResourceService(this.topics.get('fulfillment.resource'), db, cfg, logger);

    const fullfillmentCourierService =
    new FulfillmentCourierResourceService(this.topics.get('fulfillment_courier.resource'), db, cfg, logger);

    this.cis = new FulfillmentCommandInterface(this.server, cfg, logger, this.events, this.redisClient);

    const serviceNamesCfg = cfg.get('serviceNames');
    await this.server.bind(serviceNamesCfg.fulfillment, fulfillmentService);
    await this.server.bind(serviceNamesCfg.fulfillment_courier, fullfillmentCourierService);
    await this.server.bind(serviceNamesCfg.cis, this.cis);

    // Add reflection service
    const reflectionServiceName = serviceNamesCfg.reflection;
    const transportName = cfg.get(`server:services:${reflectionServiceName}:serverReflectionInfo:transport:0`);
    const transport = this.server.transport[transportName];
    const reflectionService = new ServerReflection(transport.$builder, this.server.config);
    await this.server.bind(reflectionServiceName, reflectionService);

    await this.server.bind(serviceNamesCfg.health, new Health(this.cis, {
      readiness: async () => !!await ((db as Arango).db).version()
    }));

    // start server
    await this.server.start();
    this.logger.info('server started successfully');
  }

  async stop(): Promise<any> {
    this.logger.info('Shutting down');
    await this.server.stop();
    await this.events.stop();
    await this.offsetStore.stop();
  }
}

if (require.main === module) {
  const service = new Worker();
  const logger = service.logger;
  service.start().then().catch((err) => {
    logger.error('startup error', err);
    process.exit(1);
  });

  process.on('SIGINT', () => {
    service.stop().then().catch((err) => {
      logger.error('shutdown error', err);
      process.exit(1);
    });
  });
}

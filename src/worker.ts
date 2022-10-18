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
  FulfillmentResourceService,
  FulfillmentCourierResourceService,
  FulfillmentProductResourceService
} from './services/';
import { RedisClientType as RedisClient, createClient } from 'redis';
import { Arango } from '@restorecommerce/chassis-srv/lib/database/provider/arango/base';
import { Logger } from 'winston';

const CREATE_FULFILLMENTS = 'createFulfillments';
const TRACK_FULFILLMENTS = 'trackFulfillments';
const CANCEL_FULFILLMENTS = 'cancelFulfillments';
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
  private _cfg: any;
  offsetStore: OffsetStore;
  server: Server;
  events: Events;
  logger: Logger;
  topics: Map<string, Topic>;
  cis: FulfillmentCommandInterface;
  redisClient: RedisClient;

  get cfg(): any {
    return this._cfg;
  }

  async start(cfg?: any, logger?: any): Promise<any> {
    // Load config
    this._cfg = cfg = cfg || createServiceConfig(process.cwd());

    // create server
    this.logger = logger = logger || createLogger(cfg.get('logger'));
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
    const fulfillmentCourierService = new FulfillmentCourierResourceService(
      this.topics.get('fulfillment_courier.resource'), db, cfg, logger
    );
    const fulfillmentProductService = new FulfillmentProductResourceService(
      fulfillmentCourierService, this.topics.get('fulfillment_product.resource'), db, cfg, logger
    );
    const fulfillmentService = new FulfillmentResourceService(
      fulfillmentCourierService, fulfillmentProductService, this.topics.get('fulfillment.resource'), db, cfg, logger
    );
    const fulfillmentServiceEventListener = async (msg: any, context: any, config: any, eventName: string) => {
      if (eventName == CREATE_FULFILLMENTS) {
        await fulfillmentService.create({ request: msg }, context).then(
          () => that.logger.info(`Event ${eventName} done.`),
          err => that.logger.error(`Event ${eventName} failed: ${err}`)
        );
      }
      else if (eventName == QUEUED_JOB && msg?.type == CREATE_FULFILLMENTS) {
        await fulfillmentService.create({ request: msg?.data?.payload }, context).then(
          () => that.logger.info(`Job ${eventName} done.`),
          err => that.logger.error(`Job ${eventName} failed: ${err}`)
        );
      }
      else if (eventName == TRACK_FULFILLMENTS) {
        await fulfillmentService.track({ request: msg }, context).then(
          () => that.logger.info(`Event ${eventName} done.`),
          err => that.logger.error(`Event ${eventName} failed: ${err}`)
        );
      }
      else if (eventName == QUEUED_JOB && msg?.type == TRACK_FULFILLMENTS) {
        await fulfillmentService.track({ request: msg?.data?.payload }, context).then(
          () => that.logger.info(`Job ${eventName} done.`),
          err => that.logger.error(`Job ${eventName} failed: ${err}`)
        );
      }
      else if (eventName == CANCEL_FULFILLMENTS) {
        await fulfillmentService.track({ request: msg }, context).then(
          () => that.logger.info('Event trackFulfillments done.'),
          err => that.logger.error(`Event trackFulfillments failed: ${err}`)
        );
      }
      else if (eventName == QUEUED_JOB && msg?.type == CANCEL_FULFILLMENTS) {
        await fulfillmentService.track({ request: msg?.data?.payload }, context).then(
          () => that.logger.info(`Job ${eventName} done.`),
          err => that.logger.error(`Job ${eventName} failed: ${err}`)
        );
      }
      else {
        await that.cis.command(msg, context);
      }
    };

    for (let topicType of topicTypes) {
      const topicName = kafkaCfg.topics[topicType].topic;
      const topic = await this.events.topic(topicName);
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

    this.cis = new FulfillmentCommandInterface(this.server, cfg, logger, this.events, this.redisClient);

    const serviceNamesCfg = cfg.get('serviceNames');
    await this.server.bind(serviceNamesCfg.fulfillment, fulfillmentService);
    await this.server.bind(serviceNamesCfg.fulfillment_courier, fulfillmentCourierService);
    await this.server.bind(serviceNamesCfg.fulfillment_product, fulfillmentProductService);
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

if (require.main == module) {
  const service = new Worker();
  const logger = service.logger;
  service.start().then().catch((err) => {
    console.log(err);
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

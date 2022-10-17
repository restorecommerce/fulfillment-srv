import * as _ from 'lodash';
import {
  Server, OffsetStore, database,
  CommandInterface,
  //Health
} from '@restorecommerce/chassis-srv';
import { Events, Topic } from '@restorecommerce/kafka-client';
import { createLogger } from '@restorecommerce/logger';
import { createServiceConfig } from '@restorecommerce/service-config';
import {
  FulfillmentService,
  FulfillmentCourierService,
  FulfillmentProductService
} from './services/';
import { RedisClientType as RedisClient, createClient } from 'redis';
//import { Arango } from '@restorecommerce/chassis-srv/lib/database/provider/arango/base';
import { Logger } from 'winston';
import { BindConfig } from '@restorecommerce/chassis-srv/lib/microservice/transport/provider/grpc';
import { ServiceDefinition as FulfillmentServiceDefinition } from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/fulfillment';
import { ServiceDefinition as FulfillmentCourierServiceDefinition } from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/fulfillment_courier';
import { ServiceDefinition as FulfillmentProductServiceDefinition } from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/fulfillment_product';
import { ServiceDefinition as CommandInterfaceServiceDefinition } from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/commandinterface';


const CREATE_FULFILLMENTS = 'createFulfillments';
const SUBMIT_FULFILLMENTS = 'submitFulfillments';
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
    const fulfillmentServiceActions = {
      [CREATE_FULFILLMENTS]: (msg: any, context: any, config: any, eventName: string) => {
        return fulfillmentService.create(msg, context).then(
          () => that.logger.info(`Event ${eventName} done.`),
          err => that.logger.error(`Event ${eventName} failed: ${err}`)
        );
      },
      [SUBMIT_FULFILLMENTS]: (msg: any, context: any, config: any, eventName: string) => {
        return fulfillmentService.submit(msg, context).then(
          () => that.logger.info(`Event ${eventName} done.`),
          err => that.logger.error(`Event ${eventName} failed: ${err}`)
        );
      },
      [TRACK_FULFILLMENTS]: (msg: any, context: any, config: any, eventName: string) => {
        return fulfillmentService.track(msg, context).then(
          () => that.logger.info(`Event ${eventName} done.`),
          err => that.logger.error(`Event ${eventName} failed: ${err}`)
        );
      },
      [CANCEL_FULFILLMENTS]: (msg: any, context: any, config: any, eventName: string) =>  {
        return fulfillmentService.track(msg, context).then(
          () => that.logger.info(`Event ${eventName} done.`),
          err => that.logger.error(`Event ${eventName} failed: ${err}`)
        );
      }
    };

    const fulfillmentServiceEventListeners = (msg: any, context: any, config: any, eventName: string) => {
      if (eventName == QUEUED_JOB) {
        return fulfillmentServiceActions[msg?.type](msg?.data?.payload, context, config, msg?.type).then(
          () => that.logger.info(`Job ${msg?.type} done.`),
          err => that.logger.error(`Job ${msg?.type} failed: ${err}`)
        );
      }
      else {
        return fulfillmentServiceActions[eventName](msg, context, config, eventName);
      }
    };

    for (let topicType of topicTypes) {
      const topicName = kafkaCfg.topics[topicType].topic;
      const topic = await this.events.topic(topicName);
      const offSetValue: number = await this.offsetStore.getOffset(topicName);
      logger.info('subscribing to topic with offset value', topicName, offSetValue);
      kafkaCfg.topics[topicType]?.events?.forEach(
        eventName => topic.on(
          eventName,
          fulfillmentServiceEventListeners[eventName],
          { startingOffset: offSetValue }
        )
      );
      this.topics.set(topicType, topic);
    }

    const fulfillmentCourierService = new FulfillmentCourierService(
      this.topics.get('fulfillment_courier.resource'), db, cfg, logger
    );
    const fulfillmentProductService = new FulfillmentProductService(
      fulfillmentCourierService, this.topics.get('fulfillment_product.resource'), db, cfg, logger
    );
    const fulfillmentService = new FulfillmentService(
      fulfillmentCourierService, fulfillmentProductService, this.topics.get('fulfillment.resource'), db, cfg, logger
    );
    this.cis = new FulfillmentCommandInterface(this.server, cfg, logger, this.events, this.redisClient);

    const serviceNamesCfg = cfg.get('service_names');

    await this.server.bind(serviceNamesCfg.fulfillment, {
      service: FulfillmentServiceDefinition,
      implementation: fulfillmentService
    } as BindConfig<FulfillmentServiceDefinition>);

    await this.server.bind(serviceNamesCfg.fulfillment_courier, {
      service: FulfillmentCourierServiceDefinition,
      implementation: fulfillmentCourierService,
    } as BindConfig<FulfillmentCourierServiceDefinition>);

    await this.server.bind(serviceNamesCfg.fulfillment_product, {
      service: FulfillmentProductServiceDefinition,
      implementation: fulfillmentProductService,
    } as BindConfig<FulfillmentProductServiceDefinition>);

    await this.server.bind(serviceNamesCfg.cis, {
      service: CommandInterfaceServiceDefinition,
      implementation: this.cis
    } as BindConfig<CommandInterfaceServiceDefinition>);

    // Add reflection service
    /*
    const reflectionServiceName = serviceNamesCfg.reflection;
    const transportName = cfg.get(`server:services:${reflectionServiceName}:serverReflectionInfo:transport:0`);
    const transport = this.server.transport[transportName];
    const reflectionService = new ServerReflection(transport.$builder, this.server.config);
    await this.server.bind(reflectionServiceName, reflectionService);
    await this.server.bind(serviceNamesCfg.health, new Health(this.cis, {
      readiness: async () => !!await ((db as Arango).db).version()
    }));
    */

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

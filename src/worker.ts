import {
  Server,
  OffsetStore,
  database,
  CommandInterface,
  buildReflectionService,
  Health
} from '@restorecommerce/chassis-srv';
import {
  Events,
  Topic,
  registerProtoMeta
} from '@restorecommerce/kafka-client';
import { createLogger } from '@restorecommerce/logger';
import { createServiceConfig } from '@restorecommerce/service-config';
import {
  FulfillmentService,
  FulfillmentCourierService,
  FulfillmentProductService
} from './services/';
import { RedisClientType as RedisClient, createClient } from 'redis';
import { Arango } from '@restorecommerce/chassis-srv/lib/database/provider/arango/base';
import { Logger } from 'winston';
import { BindConfig } from '@restorecommerce/chassis-srv/lib/microservice/transport/provider/grpc';
import { 
  FulfillmentServiceDefinition,
  protoMetadata as FulfillmentMeta,
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/fulfillment';
import {
  FulfillmentCourierServiceDefinition,
  protoMetadata as FulfillmentCourierMeta,
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/fulfillment_courier';
import {
  FulfillmentProductServiceDefinition,
  protoMetadata as FulfillmentProductMeta,
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/fulfillment_product';
import { 
  CommandInterfaceServiceDefinition,
  protoMetadata as CommandInterfaceMeta,
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/commandinterface';
import { HealthDefinition } from '@restorecommerce/rc-grpc-clients/dist/generated-server/grpc/health/v1/health';
import { ServerReflectionService } from 'nice-grpc-server-reflection';

const FULFILLMENT_ACTIONS = {
  createFulfillments: 'create',
  updateFulfillments: 'update',
  upsertFulfillments: 'upsert',
  submitFulfillments: 'submit',
  trackFulfillments: 'track',
  cancelFulfillments: 'cancel',
  deleteFulfillments: 'delete',
}

const QUEUED_JOB = 'queuedJob';

registerProtoMeta(
  FulfillmentMeta,
  FulfillmentCourierMeta,
  FulfillmentProductMeta,
  CommandInterfaceMeta
);

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
    this._cfg = cfg = cfg ?? createServiceConfig(process.cwd());

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

    const topicTypes = Object.keys(kafkaCfg.topics);
    this.topics = new Map<string, Topic>();

    const redisConfig = cfg.get('redis');
    redisConfig.db = this.cfg.get('redis:db-indexes:db-subject');
    this.redisClient = createClient(redisConfig);

    const that = this;
    const serviceActions = Object.entries(FULFILLMENT_ACTIONS).reduce(
      (actions, [key, value]) => {
        actions[key] = (
          msg: any,
          context?: any,
          config?: any,
          eventName?: string
        ) => fulfillmentService[value](msg, context).then(
          () => that.logger.info(`Event ${eventName} done.`),
          (err: any) => that.logger.error(`Event ${eventName} failed: ${err}`)
        );
        return actions;
      },
      {}
    );

    serviceActions[QUEUED_JOB] = (
      msg?: any,
      context?: any,
      config?: any,
      eventName?: string
    ) => {
      return serviceActions[msg?.type](
        msg?.data?.payload,
        context,
        config,
        msg?.type
      ).then(
        () => that.logger.info(`Job ${msg?.type ?? eventName} done.`),
        (err: any) => that.logger.error(`Job ${msg?.type ?? eventName} failed: ${err}`)
      );
    };

    for (let topicType of topicTypes) {
      const topicName = kafkaCfg.topics[topicType].topic;
      const topic = await this.events.topic(topicName);
      const offsetValue: number = await this.offsetStore.getOffset(topicName);
      logger.info('subscribing to topic with offset value', topicName, offsetValue);
      kafkaCfg.topics[topicType]?.events?.forEach(
        eventName => topic.on(
          eventName,
          serviceActions[eventName],
          { startingOffset: offsetValue }
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

    const serviceNamesCfg = cfg.get('serviceNames');

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
    const reflectionServiceName = serviceNamesCfg.reflection;
    const reflectionService = buildReflectionService([
      { descriptor: FulfillmentMeta.fileDescriptor },
      { descriptor: FulfillmentCourierMeta.fileDescriptor },
      { descriptor: FulfillmentProductMeta.fileDescriptor },
    ]);

    await this.server.bind(reflectionServiceName, {
      service: ServerReflectionService,
      implementation: reflectionService
    });

    await this.server.bind(serviceNamesCfg.health, {
      service: HealthDefinition,
      implementation: new Health(this.cis, {
        logger,
        cfg,
        dependencies: [],
        readiness: async () => !!await (db as Arango).db.version()
      })
    } as BindConfig<HealthDefinition>);

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

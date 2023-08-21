import {
  Server,
  OffsetStore,
  database,
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
import { RedisClientType as RedisClient, createClient } from 'redis';
import { Arango } from '@restorecommerce/chassis-srv/lib/database/provider/arango/base';
import { Logger } from 'winston';
import { BindConfig } from '@restorecommerce/chassis-srv/lib/microservice/transport/provider/grpc';
import { 
  FulfillmentServiceDefinition,
  protoMetadata as FulfillmentMeta,
  FulfillmentList,
  FulfillmentIdList,
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/fulfillment';
import {
  FulfillmentCourierServiceDefinition,
  protoMetadata as FulfillmentCourierMeta,
  FulfillmentCourierList,
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
import {
  FulfillmentService,
  FulfillmentCourierService,
  FulfillmentProductService,
  FulfillmentCommandInterface
} from './services';
import { DeleteRequest } from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/resource_base';

registerProtoMeta(
  FulfillmentMeta,
  FulfillmentCourierMeta,
  FulfillmentProductMeta,
  CommandInterfaceMeta
);

export class Worker {
  private _cfg: any;
  private _offsetStore: OffsetStore;
  private _server: Server;
  private _events: Events;
  private _logger: Logger;
  private _redisClient: RedisClient;
  private _fulfillmentService: FulfillmentService;
  private _fulfillmentCourierService: FulfillmentCourierService;
  private _fulfillmentProductService: FulfillmentProductService;
  private _fulfillmentCommandInterface: FulfillmentCommandInterface;

  get cfg() {
    return this._cfg;
  }

  protected set cfg(value: any) {
    this._cfg = value;
  }

  get offsetStore() {
    return this._offsetStore;
  }

  protected set offsetStore(value: OffsetStore) {
    this._offsetStore = value;
  }

  get server() {
    return this._server;
  }

  protected set server(value: Server) {
    this._server = value;
  }

  get events() {
    return this._events;
  }

  protected set events(value: Events) {
    this._events = value;
  }

  get logger() {
    return this._logger;
  }

  protected set logger(value: Logger) {
    this._logger = value;
  }

  get redisClient() {
    return this._redisClient;
  }

  protected set redisClient(value: RedisClient) {
    this._redisClient = value;
  }

  get fulfillmentService() {
    return this._fulfillmentService;
  }

  protected set fulfillmentService(value: FulfillmentService) {
    this._fulfillmentService = value;
  }

  get fulfillmentProductService() {
    return this._fulfillmentProductService;
  }

  protected set fulfillmentProductService(value: FulfillmentProductService) {
    this._fulfillmentProductService = value;
  }

  get fulfillmentCourierService() {
    return this._fulfillmentCourierService;
  }

  protected set fulfillmentCourierService(value: FulfillmentCourierService) {
    this._fulfillmentCourierService = value;
  }

  get fulfillmentCommandInterface() {
    return this._fulfillmentCommandInterface;
  }

  protected set fulfillmentCommandInterface(value: FulfillmentCommandInterface) {
    this._fulfillmentCommandInterface = value;
  }

  protected readonly topics = new Map<string, Topic>();
  protected readonly serviceActions = new Map<string, ((msg: any, context: any, config: any, eventName: string) => Promise<void>)>();
  protected readonly jobService = {
    handleQueuedJob: (msg: any, context: any, config: any, eventName: string) => {
      return this.serviceActions.get(msg?.type)(msg?.data?.payload, context, config, msg?.type).then(
        () => this.logger.info(`Job ${msg?.type} done.`),
        (err: any) => this.logger.error(`Job ${msg?.type} failed: ${err}`)
      );
    }
  }
  
  bindHandler(serviceName: string, functionName: string) {
    return (msg: any, context: any, config: any, eventName: string): Promise<any> => { 
      return this[serviceName]?.[functionName]?.(msg, context).then(
        () => this.logger.info(`Event ${eventName} handled.`),
        (err: any) => this.logger.error(`Error while handling event ${eventName}: ${err}`),
      );
    };
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
    const redisConfig = cfg.get('redis');
    redisConfig.db = this.cfg.get('redis:db-indexes:db-subject');
    this.redisClient = createClient(redisConfig);

    await Promise.all(Object.keys(kafkaCfg.topics).map(async key => {
      const topicName = kafkaCfg.topics[key].topic;
      const topic = await this.events.topic(topicName);
      const offsetValue: number = await this.offsetStore.getOffset(topicName);
      logger.info('subscribing to topic with offset value', topicName, offsetValue);
      Object.entries(kafkaCfg.topics[key]?.events as { [key: string]: string } ?? {}).forEach(
        ([eventName, handler]) => {
          const [serviceName, functionName] = handler.split('.');
          this.serviceActions.set(eventName, this.bindHandler(serviceName, functionName));
          topic.on(
            eventName as string,
            this.serviceActions.get(eventName),
            { startingOffset: offsetValue }
          )
        }
      );
      this.topics.set(key, topic);
    }));

    logger.verbose('Setting up command interface services');
    this.fulfillmentCommandInterface = new FulfillmentCommandInterface(
      this.server,
      this.events,
      this.redisClient,
      cfg, logger,
    );
    logger.verbose('Setting up fulfillment courier services');
    this.fulfillmentCourierService = new FulfillmentCourierService(
      this.topics.get('fulfillment_courier.resource'),
      db, cfg, logger,
    );
    logger.verbose('Setting up fulfillment product services');
    this.fulfillmentProductService = new FulfillmentProductService(
      this.fulfillmentCourierService,
      this.topics.get('fulfillment_product.resource'),
      db, cfg, logger,
    );
    logger.verbose('Setting up fulfillment services');
    this.fulfillmentService = new FulfillmentService(
      this.fulfillmentCourierService,
      this.fulfillmentProductService,
      this.topics.get('fulfillment.resource'),
      db, cfg, logger,
    );

    const serviceNamesCfg = cfg.get('serviceNames');

    await this.server.bind(serviceNamesCfg.fulfillment, {
      service: FulfillmentServiceDefinition,
      implementation: this.fulfillmentService
    } as BindConfig<FulfillmentServiceDefinition>);

    await this.server.bind(serviceNamesCfg.fulfillment_courier, {
      service: FulfillmentCourierServiceDefinition,
      implementation: this.fulfillmentCourierService,
    } as BindConfig<FulfillmentCourierServiceDefinition>);

    await this.server.bind(serviceNamesCfg.fulfillment_product, {
      service: FulfillmentProductServiceDefinition,
      implementation: this.fulfillmentProductService,
    } as BindConfig<FulfillmentProductServiceDefinition>);

    await this.server.bind(serviceNamesCfg.cis, {
      service: CommandInterfaceServiceDefinition,
      implementation: this.fulfillmentCommandInterface,
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
      implementation: new Health(
        this.fulfillmentCommandInterface,
        {
          logger,
          cfg,
          dependencies: [],
          readiness: async () => !!await (db as Arango).db.version()
        }
      )
    } as BindConfig<HealthDefinition>);

    // start server
    await this.server.start();
    this.logger.info('server started successfully');
  }

  async stop(): Promise<any> {
    this.logger.info('Shutting down');
    await Promise.allSettled([
      this.server?.stop(),
      this.events?.stop(),
      this.offsetStore?.stop(),
    ]);
  }
}

if (require.main === module) {
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

import { RedisClientType as RedisClient } from 'redis';
import { type Logger } from '@restorecommerce/logger';
import { type ServiceConfig } from '@restorecommerce/service-config';
import { Events } from '@restorecommerce/kafka-client';
import {
  Server,
  CommandInterface,
} from '@restorecommerce/chassis-srv';

export class FulfillmentCommandInterface extends CommandInterface {
  constructor(
    server: Server,
    cfg: ServiceConfig,
    logger: Logger,
    events: Events,
    redisClient: RedisClient,
  ) {
    super(server, cfg, logger, events as any, redisClient);
    this.logger = logger;
  }
}
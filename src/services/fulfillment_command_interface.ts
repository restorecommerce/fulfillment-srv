import { Logger } from 'winston';
import { RedisClientType as RedisClient } from 'redis';
import { ServiceConfig } from '@restorecommerce/service-config';
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
    super(server, cfg, logger, events, redisClient);
    this.logger = logger;
  }
}
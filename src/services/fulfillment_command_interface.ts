import { Logger } from 'winston';
import { RedisClientType as RedisClient } from 'redis';
import { Events } from '@restorecommerce/kafka-client';
import {
  Server,
  CommandInterface,
} from '@restorecommerce/chassis-srv';

export class FulfillmentCommandInterface extends CommandInterface {
  constructor(
    server: Server,
    events: Events,
    redisClient: RedisClient,
    cfg: any,
    logger: Logger,
  ) {
    super(server, cfg, logger, events, redisClient);
    this.logger = logger;
  }
}
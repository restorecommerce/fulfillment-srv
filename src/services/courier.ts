import { ResourcesAPIBase, ServiceBase } from '@restorecommerce/resource-base-interface';
import { DatabaseProvider } from '@restorecommerce/chassis-srv';
import { Topic } from '@restorecommerce/kafka-client';

export class FulfillmentCourierResourceService extends ServiceBase {
  constructor(topic: Topic, db: DatabaseProvider, cfg: any, logger: any) {
    super('fulfillment_courier', topic, logger,
      new ResourcesAPIBase(db, 'fulfillment_courier', cfg.get('fieldHandlers:fulfillment_courier')), true);
  }
}
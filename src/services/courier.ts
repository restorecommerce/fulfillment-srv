import { ResourcesAPIBase, ServiceBase } from '@restorecommerce/resource-base-interface';
import { DatabaseProvider } from '@restorecommerce/chassis-srv';
import { Topic } from '@restorecommerce/kafka-client';
import { 
  FulfillmentCourierResponseList,
  FulfillmentCourierList
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/fulfillment_courier';

const ENTITY_NAME = 'fulfillment_courier';
const COLLECTION_NAME = 'fulfillment_couriers';

export class FulfillmentCourierService extends ServiceBase<FulfillmentCourierResponseList, FulfillmentCourierList> {
  constructor(topic: Topic, db: DatabaseProvider, cfg: any, logger: any) {
    super(ENTITY_NAME, topic, logger,
      new ResourcesAPIBase(db, COLLECTION_NAME, cfg.get('fieldHandlers:fulfillment_courier')), true);
  }
}
import { ResourcesAPIBase, ServiceBase } from '@restorecommerce/resource-base-interface';
import { DatabaseProvider } from '@restorecommerce/chassis-srv';
import { Topic } from '@restorecommerce/kafka-client';
import { 
  FulfillmentCourierListResponse,
  FulfillmentCourierList,
  FulfillmentCourierServiceImplementation,
} from '@restorecommerce/types/server/io/restorecommerce/fulfillment_courier';

const ENTITY_NAME = 'fulfillment_courier';
const COLLECTION_NAME = 'fulfillment_couriers';

export class FulfillmentCourierService
  extends ServiceBase<FulfillmentCourierListResponse, FulfillmentCourierList>
  implements FulfillmentCourierServiceImplementation
{
  constructor(topic: Topic, db: DatabaseProvider, cfg: any, logger: any) {
    super(ENTITY_NAME, topic, logger,
      new ResourcesAPIBase(db, COLLECTION_NAME, cfg.get('fieldHandlers:fulfillment_courier')), true);
  }
}
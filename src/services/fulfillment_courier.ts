import { ResourcesAPIBase, ServiceBase } from '@restorecommerce/resource-base-interface';
import { DatabaseProvider } from '@restorecommerce/chassis-srv';
import { Topic } from '@restorecommerce/kafka-client';
import { 
  FulfillmentCourierListResponse,
  FulfillmentCourierList,
  FulfillmentCourierServiceImplementation,
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/fulfillment_courier';

export class FulfillmentCourierService
  extends ServiceBase<FulfillmentCourierListResponse, FulfillmentCourierList>
  implements FulfillmentCourierServiceImplementation
{
  constructor(topic: Topic, db: DatabaseProvider, cfg: any, logger: any) {
    super(
      cfg.get('database:main:entities:1') ?? 'fulfillment_courier',
      topic,
      logger,
      new ResourcesAPIBase(
        db,
        cfg.get('database:main:collections:1') ?? 'fulfillment_couriers',
        cfg.get('fieldHandlers:fulfillment_courier')
      ),
      true
    );
  }
}
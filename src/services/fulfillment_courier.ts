import { type Logger } from '@restorecommerce/logger';
import { type DatabaseProvider } from '@restorecommerce/chassis-srv';
import { type ServiceConfig } from '@restorecommerce/service-config';
import { Topic } from '@restorecommerce/kafka-client';
import {
  FulfillmentCourierListResponse,
  FulfillmentCourierList,
  FulfillmentCourierServiceImplementation,
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/fulfillment_courier.js';
import {
  ReadRequest
} from '@restorecommerce/rc-grpc-clients';
import { AccessControlledServiceBase } from '../experimental/AccessControlledServiceBase.js';
import { FulfillmentSolutionQuery } from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/fulfillment_product.js';
import { Subject } from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/auth.js';
import {
  Filter_Operation,
  Filter_ValueType,
  FilterOp_Operator
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/resource_base.js';

export class FulfillmentCourierService
  extends AccessControlledServiceBase<FulfillmentCourierListResponse, FulfillmentCourierList>
  implements FulfillmentCourierServiceImplementation
{
  constructor(
    topic:
    Topic,
    db: DatabaseProvider,
    cfg: ServiceConfig,
    logger?: Logger
  ) {
    super(
      cfg.get('database:main:entities:1') ?? 'fulfillment_courier',
      topic,
      db,
      cfg,
      logger,
      cfg.get('events:enableEvents')?.toString() === 'true',
      cfg.get('database:main:collections:1') ?? 'fulfillment_couriers',
    );
  }

  public async find(
    query: FulfillmentSolutionQuery,
    subject?: Subject,
    context?: any,
  ): Promise<FulfillmentCourierListResponse> {
    const ids = [...new Set(
      query.preferences?.courier_ids?.map(id => id) ?? []
    ).values()];
    const call = ReadRequest.fromPartial({
      filters: [
        {
          filters: [
            {
              field: 'shop_ids',
              operation: Filter_Operation.in,
              value: query.shop_id
            },
            ...(
              ids?.length ?
              [{
                field: '_key', // _key is faster
                operation: Filter_Operation.in,
                type: Filter_ValueType.ARRAY,
                value: JSON.stringify(ids),
              }] : []
            )
          ],
          operator: FilterOp_Operator.and
        }
      ],
      subject,
    });

    const response = await this.read(call, context).then(
      resp => {
        if (resp.operation_status?.code !== 200) {
          throw resp.operation_status;
        }
        else {
          return resp;
        }
      }
    );
    this.logger?.debug('Available Couriers:', response);
    return response;
  }
}
import { FlatAggregatedFulfillmentList } from '../utils.js';
import { Stub } from '../stub.js';
import { FulfillmentProduct, FulfillmentSolutionQuery } from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/fulfillment_product.js';

export class Dummy extends Stub {
  protected override async evaluateImpl(
    fulfillments: FlatAggregatedFulfillmentList[]
  ): Promise<FlatAggregatedFulfillmentList[]> {
    return fulfillments;
  }

  protected override async submitImpl(
    fulfillments: FlatAggregatedFulfillmentList[]
  ): Promise<FlatAggregatedFulfillmentList[]> {
    return fulfillments;
  }

  protected override async trackImpl(
    fulfillments: FlatAggregatedFulfillmentList[]
  ): Promise<FlatAggregatedFulfillmentList[]> {
    return fulfillments;
  }

  protected override async cancelImpl(
    fulfillments: FlatAggregatedFulfillmentList[]
  ): Promise<FlatAggregatedFulfillmentList[]> {
    return fulfillments;
  }

  async matchesZone(
    product: FulfillmentProduct,
    query: FulfillmentSolutionQuery,
    helper: any,
  ): Promise<boolean> {
    return false;
  }
}

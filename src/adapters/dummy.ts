import { FlatAggregatedFulfillment } from '../utils.js';
import { Adapter } from '../adapter.js';
import {
  FulfillmentProduct,
  FulfillmentSolutionQuery,
  Variant
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/fulfillment_product.js';
import { Package } from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/product.js';

export class Dummy extends Adapter {
  get type(): string {
    throw new Error('Method not implemented.');
  }
  public calcNet(product: Variant, pack: Package, precision: number): Promise<BigNumber> {
    throw new Error('Method not implemented.');
  }
  protected override async evaluateImpl(
    fulfillments: FlatAggregatedFulfillment[]
  ): Promise<FlatAggregatedFulfillment[]> {
    return fulfillments;
  }

  protected override async submitImpl(
    fulfillments: FlatAggregatedFulfillment[]
  ): Promise<FlatAggregatedFulfillment[]> {
    return fulfillments;
  }

  protected override async trackImpl(
    fulfillments: FlatAggregatedFulfillment[]
  ): Promise<FlatAggregatedFulfillment[]> {
    return fulfillments;
  }

  protected override async cancelImpl(
    fulfillments: FlatAggregatedFulfillment[]
  ): Promise<FlatAggregatedFulfillment[]> {
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

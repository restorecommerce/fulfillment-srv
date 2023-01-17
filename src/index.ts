import { randomUUID } from 'crypto';
import { Logger } from 'winston';
import {
  Fulfillment,
  FulfillmentAddress,
  State,
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/fulfillment';
import { FulfillmentCourier as Courier } from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/fulfillment_courier';
import { FulfillmentProduct as Product } from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/fulfillment_product';

export interface AggregatedFulfillment extends Fulfillment
{
  couriers: Courier[];
  products: Product[];
  options: any;
}

export interface FlatAggregatedFulfillment extends Fulfillment
{
  uuid: string;
  courier: Courier;
  product: Product;
  options: any;
}

export abstract class Stub
{
  abstract get type(): string;

  constructor(
    public courier?: Courier,
    public cfg?: any,
    public logger?: Logger
  ) {}

  abstract submit (request: FlatAggregatedFulfillment[]): Promise<FlatAggregatedFulfillment[]>;
  abstract track (request: FlatAggregatedFulfillment[]): Promise<FlatAggregatedFulfillment[]>;
  abstract cancel (request: FlatAggregatedFulfillment[]): Promise<FlatAggregatedFulfillment[]>;
  abstract getZoneFor(address: FulfillmentAddress): Promise<string>;

  protected static STUB_TYPES: { [key: string]: (courier: Courier, kwargs?: { [key: string]: any }) => Stub } = {};
  static REGISTER: { [key: string]: Stub } = {};
  static instantiate(courier: Courier, kwargs?: { [key: string]: any }): Stub
  {
    let stub = Stub.REGISTER[courier?.id];
    if (!stub)
    {
      stub = Stub.STUB_TYPES[courier?.stub_type] && Stub.STUB_TYPES[courier.stub_type](courier, kwargs);
      Stub.REGISTER[courier.id] = stub;
    }
    return stub;
  }
};

export const flattenAggregatedFulfillments = (fulfillments: AggregatedFulfillment[]): FlatAggregatedFulfillment[] =>
  [].concat(...fulfillments.map((fulfillment) =>
    fulfillment.order.parcels.map((parcel,i) => {
      const uuid = fulfillment.id || randomUUID();
      return {
        ...fulfillment,
        uuid,
        labels: [fulfillment.labels[i]],
        courier: fulfillment.couriers[i],
        product: fulfillment.products[i],
        order: Object.assign({}, fulfillment.order, {
          parcels: [parcel]
        })
      };
    })
  )
);

export const mergeFulfillments = (fulfillments: FlatAggregatedFulfillment[]): Fulfillment[] => {
  const merged_fulfillments: { [uuid: string]: Fulfillment } = {};
  fulfillments.forEach(b => {
    const c = merged_fulfillments[b.uuid];
    if (c) {
      c.order.parcels.push(...b.order.parcels);
      c.labels.push(...b.labels);
      c.tracking.push(...b.tracking);
      c.state = State[b.state] < State[c.state] ? b.state : c.state;
    }
    else {
      merged_fulfillments[b.uuid] = b;
      delete b.uuid;
      delete b.courier;
      delete b.product;
    }
  });
  return Object.values(merged_fulfillments);
};

// Register Stubs at the end of this file
import { DHL } from './stubs/dhl'; DHL.register();
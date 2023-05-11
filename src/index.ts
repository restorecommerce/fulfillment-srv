import { randomUUID } from 'crypto';
import { Logger } from 'winston';
import {
  Fulfillment,
  State,
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/fulfillment';
import { FulfillmentCourierResponse } from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/fulfillment_courier';
import { FulfillmentProductResponse } from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/fulfillment_product';
import { ShippingAddress } from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/address';

export type Courier = FulfillmentCourierResponse;
export type Product = FulfillmentProductResponse;

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
  
  abstract submit (fulfillments: FlatAggregatedFulfillment[]): Promise<FlatAggregatedFulfillment[]>;
  abstract track (fulfillments: FlatAggregatedFulfillment[]): Promise<FlatAggregatedFulfillment[]>;
  abstract cancel (fulfillments: FlatAggregatedFulfillment[]): Promise<FlatAggregatedFulfillment[]>;
  abstract getZoneFor(address: ShippingAddress): Promise<string>;

  protected static STUB_TYPES: { [key: string]: (new (courier: Courier, kwargs?: { [key: string]: any }) => Stub) } = {};
  protected static REGISTER: { [key: string]: Stub } = {};

  static all() {
    return Object.values(Stub.REGISTER);
  }

  static submit(
    couriers: Courier[],
    fulfillments: FlatAggregatedFulfillment[],
    kwargs: any
  ) {
    return couriers.map(
      (courier) => Stub.getInstance(
        courier,
        kwargs
      ).submit(
        fulfillments
      )
    );
  }

  static track(
    couriers: Courier[],
    fulfillments: FlatAggregatedFulfillment[],
    kwargs: any
  ) {
    return couriers.map(
      (courier) => Stub.getInstance(
        courier,
        kwargs
      ).track(
        fulfillments
      )
    );
  }

  static cancel(
    couriers: Courier[],
    fulfillments: FlatAggregatedFulfillment[],
    kwargs: any
  ) {
    return couriers.map(
      (courier) => Stub.getInstance(
        courier,
        kwargs
      ).cancel(
        fulfillments
      )
    );
  }

  static register<T extends Stub>(
    typeName: string,
    type: (new (courier: Courier, kwargs?: { [key: string]: any }) => T)
  ) {
    Stub.STUB_TYPES[typeName] = type;
  }
  
  static getInstance(courier: Courier, kwargs?: { [key: string]: any }): Stub
  {
    let stub = Stub.REGISTER[courier.payload.id];
    if (!stub && (courier.payload.stub_type in Stub.STUB_TYPES))
    {
      stub = new Stub.STUB_TYPES[courier.payload.stub_type](courier, kwargs);
      Stub.REGISTER[courier.payload.id] = stub;
    }
    return stub;
  }
};

export const flattenAggregatedFulfillments = (fulfillments: AggregatedFulfillment[]): FlatAggregatedFulfillment[] =>
  [].concat(...fulfillments.map((fulfillment) =>
    fulfillment.packing.parcels.map((parcel,i) => {
      const uuid = fulfillment.id || randomUUID();
      return {
        ...fulfillment,
        uuid,
        labels: [fulfillment.labels[i]],
        courier: fulfillment.couriers[i],
        product: fulfillment.products[i],
        packing: Object.assign({}, fulfillment.packing, {
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
      c.packing.parcels.push(...b.packing.parcels);
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
export { DHL } from './stubs/dhl';
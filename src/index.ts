import { randomUUID } from 'crypto';
import { Logger } from 'winston';
import { Address } from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/address';
import { Country } from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/country';
import {
  Fulfillment,
  FulfillmentAddress,
  Label,
  Parcel,
  State,
  Order
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/fulfillment';
import { FulfillmentCourier as Courier } from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/fulfillment_courier';
import { FulfillmentProduct as Product } from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/fulfillment_product';

export interface AggregatedAddress extends Address
{
  country: Country;
}

export interface AggregatedFulfillmentAddress extends FulfillmentAddress
{
  address: AggregatedAddress;
}

export interface AggregatedFulfillmentOrder extends Order
{
  sender: AggregatedFulfillmentAddress;
  receiver: AggregatedFulfillmentAddress
}

export interface AggregatedFulfillment extends Fulfillment
{
  order: AggregatedFulfillmentOrder;
  couriers: Courier[];
  products: Product[];
}

export interface FlatAggregatedFulfillment extends Fulfillment
{
  uuid: string;
  label: Label;
  order: AggregatedFulfillmentOrder;
  courier: Courier;
  product: Product;
  parcel: Parcel;
}

export abstract class Stub
{
  abstract get type(): string;

  constructor(
    public courier?: Courier,
    public cfg?: any,
    public logger?: Logger
  ) {}

  abstract order (request: FlatAggregatedFulfillment[]): Promise<FlatAggregatedFulfillment[]>;
  abstract track (request: FlatAggregatedFulfillment[]): Promise<FlatAggregatedFulfillment[]>;
  abstract cancel (request: FlatAggregatedFulfillment[]): Promise<FlatAggregatedFulfillment[]>;
  abstract getZoneFor(address: Address): Promise<string>;

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
      return Object.assign({}, fulfillment, {
        uuid,
        courier: fulfillment.couriers[i],
        product: fulfillment.products[i],
        parcel,
        couriers: [fulfillment.couriers[i]],
        products: [fulfillment.products[i]],
        order: Object.assign({}, fulfillment.order, {
          parcels: [parcel]
        })
      });
    })
  )
);

/*
export const flattenFulfillments = (fulfillments: AggregatedFulfillment[]): FlatAggregatedFulfillment[] =>
  [].concat(...fulfillments.map(fulfillment =>
    fulfillment?.labels?.map((label,i) =>
      Object.assign(fulfillment, {
        uuid: randomUUID(),
        label,
        labels: [label],
        courier: fulfillment.couriers[i],
        product: fulfillment.products[i],
      }) || fulfillment
    )
  )
);

export const flattenAggregatedTrackingRequest = (requests: AggregatedTrackingRequest[]): FlatAggregatedTrackingRequest[] =>
  [].concat(...requests.map((request) =>
    request?.fulfillment?.labels?.map((label,i) =>
      Object.assign({}, request, {
        shipment_number: label.shipment_number,
        shipment_numbers: [label.shipment_number],
        fulfillment: Object.assign(request.fulfillment, {
          uuid: randomUUID(),
          label,
          labels: [label],
          courier: request.fulfillment.couriers[i],
          product: request.fulfillment.products[i],
        })
      }) || request
    )
  )
);
*/

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
      delete b.label;
    }
  });
  return Object.values(merged_fulfillments);
};

/*
export const mergeTrackingResults = (trackings: TrackingResult[]): TrackingResult[] => {
  const merged_tracks: { [id: string]: TrackingResult } = {};
  trackings.forEach(b => {
    const c = merged_tracks[b.fulfillment.id];
    if (c) {
      c.tracks.push(...b.tracks);
      c.fulfillment.fulfilled &&= b.fulfillment.fulfilled;
    }
    else {
      merged_tracks[b.fulfillment.id] = b;
    }
  });
  return Object.values(merged_tracks);
};
*/

// Register Stubs at the end of this file
import { DHL } from './stubs/dhl'; DHL.register();
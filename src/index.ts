import { randomUUID } from 'crypto';
import { Logger } from 'winston';
import {
  Address,
  FulfillmentRequest,
  Fulfillment,
  TrackingRequest,
  TrackingResult,
  Label,
  Parcel
} from './generated/io/restorecommerce/fulfillment';
import { FulfillmentCourier as Courier } from './generated/io/restorecommerce/fulfillment_courier';
import { FulfillmentProduct as Product } from './generated/io/restorecommerce/fulfillment_product';

export interface AggregatedFulfillmentRequest extends FulfillmentRequest
{
  couriers: Courier[];
  products: Product[];
}

export interface FlatAggregatedFulfillmentRequest extends FulfillmentRequest
{
  uuid: string;
  courier: Courier;
  product: Product;
  parcel: Parcel;
}

export interface AggregatedFulfillment extends Fulfillment
{
  couriers: Courier[];
  products: Product[];
}

export interface FlatAggregatedFulfillment extends Fulfillment
{
  uuid: string;
  label: Label;
  courier: Courier;
  product: Product;
  parcel: Parcel;
}

export interface AggregatedTrackingRequest extends TrackingRequest
{
  fulfillment: AggregatedFulfillment;
}

export interface FlatAggregatedTrackingRequest extends TrackingRequest
{
  shipmentNumber: string;
  fulfillment: FlatAggregatedFulfillment;
}

export abstract class Stub
{
  abstract get type(): string;

  constructor(
    public courier?: Courier,
    public cfg?: any,
    public logger?: Logger
  ) {}

  abstract order (request: FlatAggregatedFulfillmentRequest[]): Promise<FlatAggregatedFulfillment[]>;
  abstract track (request: FlatAggregatedTrackingRequest[]): Promise<TrackingResult[]>;
  abstract cancel (request: FlatAggregatedFulfillment[]): Promise<FlatAggregatedFulfillment[]>;
  abstract getZoneFor(address: Address): Promise<string>;

  protected static STUB_TYPES: { [key: string]: (courier: Courier, kwargs?: { [key: string]: any }) => Stub } = {};
  static REGISTER: { [key: string]: Stub } = {};
  static instantiate(courier: Courier, kwargs?: { [key: string]: any }): Stub
  {
    let stub = Stub.REGISTER[courier?.id];
    if (!stub)
    {
      stub = Stub.STUB_TYPES[courier?.stubType] && Stub.STUB_TYPES[courier.stubType](courier, kwargs);
      Stub.REGISTER[courier.id] = stub;
    }
    return stub;
  }
};

export const flattenAggregatedFulfillmentRequest = (requests: AggregatedFulfillmentRequest[]): FlatAggregatedFulfillmentRequest[] =>
  [].concat(...requests.map((request) =>
    request?.order?.parcels?.map((parcel,i) =>
      Object.assign({}, request, {
        uuid: randomUUID(),
        courier: request.couriers[i],
        product: request.products[i],
        parcel,
        couriers: [request.couriers[i]],
        products: [request.products[i]],
        order: Object.assign({}, request.order, {
          parcels: [parcel]
        })
      }) || request
    )
  )
  );

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
        shipmentNumber: label.shipmentNumber,
        shipmentNumbers: [label.shipmentNumber],
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

export const mergeFulfillments = (fulfillments: FlatAggregatedFulfillment[]): Fulfillment[] => {
  const mergedFulfillments: { [uuid: string]: Fulfillment } = {};
  fulfillments.forEach(b => {
    const c = mergedFulfillments[b.uuid];
    if (c) {
      c.order.parcels.push(...b.order.parcels);
      c.labels.push(...b.labels);
      c.fulfilled &&= b.fulfilled;
    }
    else {
      delete b.uuid;
      delete b.courier;
      delete b.product;
      delete b.label;
      mergedFulfillments[b.uuid] = b;
    }
  });
  return Object.values(mergedFulfillments);
};

export const mergeTrackingResults = (trackings: TrackingResult[]): TrackingResult[] => {
  const mergedTracks: { [id: string]: TrackingResult } = {};
  trackings.forEach(b => {
    const c = mergedTracks[b.fulfillment.id];
    if (c) {
      c.tracks.push(...b.tracks);
      c.fulfillment.fulfilled &&= b.fulfillment.fulfilled;
    }
    else {
      mergedTracks[b.fulfillment.id] = b;
    }
  });
  return Object.values(mergedTracks);
};

// Register Stubs at the end of this file
import { DHL } from './stubs/dhl'; DHL.register();
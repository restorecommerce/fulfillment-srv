import { randomUUID } from 'crypto';
import { Logger } from 'winston';
import {
  FulfillmentResponse,
  Label,
  Parcel,
  State,
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/fulfillment';
import {
  FulfillmentCourier,
  FulfillmentCourierResponse,
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/fulfillment_courier';
import {
  FulfillmentProduct,
  FulfillmentProductResponse,
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/fulfillment_product';
import { Country, CountryResponse } from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/country';

export type Courier = FulfillmentCourier;
export type CourierResponse = FulfillmentCourierResponse;
export type CourierMap = { [id: string]: Courier };
export type CourierResponseMap = { [id: string]: CourierResponse };

export type Product = FulfillmentProduct;
export type ProductResponse = FulfillmentProductResponse;
export type ProductResponseMap = { [id: string]: ProductResponse };

export type CountryResponseMap = { [id: string]: CountryResponse };


export const StateRank = Object.values(State).reduce((a, b, i) => {
  a[b] = i;
  return a; 
}, {} as { [key: string]: number });

export interface AggregatedFulfillment extends FulfillmentResponse
{
  products: ProductResponse[];
  couriers: CourierResponse[];
  sender_country: CountryResponse;
  receiver_country: CountryResponse;
  options: any;
}

export interface FlatAggregatedFulfillment extends FulfillmentResponse
{
  uuid: string;
  product: Product;
  courier: Courier;
  sender_country: Country;
  receiver_country: Country;
  parcel: Parcel;
  label: Label;
  options: any;
}

export abstract class Stub
{
  protected static readonly STUB_TYPES: { [key: string]: (new (courier: Courier, kwargs?: { [key: string]: any }) => Stub) } = {};
  protected static readonly REGISTER: { [key: string]: Stub } = {};
  static cfg: any = null;
  static logger: Logger = null;

  abstract get type(): string;

  constructor(
    public courier: Courier,
    public cfg?: any,
    public logger?: Logger
  ) {}

  protected abstract evaluateImpl (fulfillments: FlatAggregatedFulfillment[]): Promise<FlatAggregatedFulfillment[]>;
  protected abstract submitImpl (fulfillments: FlatAggregatedFulfillment[]): Promise<FlatAggregatedFulfillment[]>;
  protected abstract trackImpl (fulfillments: FlatAggregatedFulfillment[]): Promise<FlatAggregatedFulfillment[]>;
  protected abstract cancelImpl (fulfillments: FlatAggregatedFulfillment[]): Promise<FlatAggregatedFulfillment[]>;

  /**
   * Evaluate the tarife code
   * @param address 
   */
  abstract getTariffCode(fulfillment: FlatAggregatedFulfillment): Promise<string>;
  
  readonly evaluate = (fulfillments: FlatAggregatedFulfillment[]) => this.evaluateImpl(
    fulfillments.filter(f => f.product?.courier_id === this.courier.id)
  );

  readonly submit = (fulfillments: FlatAggregatedFulfillment[]) => this.submitImpl(
    fulfillments.filter(f => f.product?.courier_id === this.courier.id)
  );

  readonly track = (fulfillments: FlatAggregatedFulfillment[]) => this.trackImpl(
    fulfillments.filter(f => f.product?.courier_id === this.courier.id)
  );

  readonly cancel = (fulfillments: FlatAggregatedFulfillment[]) => this.cancelImpl(
    fulfillments.filter(f => f.product?.courier_id === this.courier.id)
  );

  static all() {
    return Object.values(Stub.REGISTER);
  }

  static evaluate(
    fulfillments: FlatAggregatedFulfillment[],
    kwargs?: any
  ) {
    return Object.values(extractCouriers(fulfillments)).map(
      (courier) => Stub.getInstance(
        courier,
        {
          cfg: Stub.cfg,
          logger: Stub.logger,
          ...kwargs
        }
      ).evaluate(
        fulfillments
      )
    );
  }

  static submit(
    fulfillments: FlatAggregatedFulfillment[],
    kwargs?: any
  ) {
    return Object.values(extractCouriers(fulfillments)).map(
      (courier) => Stub.getInstance(
        courier,
        {
          cfg: Stub.cfg,
          logger: Stub.logger,
          ...kwargs
        }
      ).submit(
        fulfillments
      )
    );
  }

  static track(
    fulfillments: FlatAggregatedFulfillment[],
    kwargs?: any
  ) {
    return Object.values(extractCouriers(fulfillments)).map(
      (courier) => Stub.getInstance(
        courier,
        {
          cfg: Stub.cfg,
          logger: Stub.logger,
          ...kwargs
        }
      ).track(
        fulfillments
      )
    );
  }

  static cancel(
    fulfillments: FlatAggregatedFulfillment[],
    kwargs?: any
  ) {
    return Object.values(extractCouriers(fulfillments)).map(
      (courier) => Stub.getInstance(
        courier,
        {
          cfg: Stub.cfg,
          logger: Stub.logger,
          ...kwargs
        }
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
    let stub = Stub.REGISTER[courier.id];
    if (!stub && (courier.stub_type in Stub.STUB_TYPES))
    {
      stub = new Stub.STUB_TYPES[courier.stub_type](courier, kwargs);
      Stub.REGISTER[courier.id] = stub;
    }
    return stub;
  }
};

export const extractCouriers = (fulfillments: FlatAggregatedFulfillment[]): CourierMap => {
  return fulfillments.reduce(
    (a, b) => {
      a[b.courier?.id] = b.courier;
      return a;
    },
    {} as CourierMap
  );
} 

export const flatMapAggregatedFulfillments = (fulfillments: AggregatedFulfillment[]): FlatAggregatedFulfillment[] => {
  return fulfillments.flatMap((fulfillment) =>
    fulfillment.payload?.packaging?.parcels.map((parcel, i) => {
      const uuid = fulfillment.payload.id ?? randomUUID();
      const product = fulfillment.products[i].payload;
      const courier = fulfillment.couriers[i].payload;
      const label = fulfillment.payload.labels[i];
      return {
        payload: {
          ...fulfillment.payload,
          total_price: parcel.price,
          total_vat: parcel.vats.reduce((a, b) => a + b.vat, 0)
        },
        uuid,
        labels: [label],
        sender_country: fulfillment.sender_country.payload,
        receiver_country: fulfillment.receiver_country.payload,
        product,
        courier,
        label,
        parcel,
        packaging: {
          ...fulfillment.payload.packaging,
          parcels: [parcel]
        },
        options: fulfillment.options,
        status: fulfillment.status,
      };
    })
  );
}

export const mergeFulfillments = (fulfillments: FlatAggregatedFulfillment[]): FulfillmentResponse[] => {
  const merged_fulfillments: { [uuid: string]: FulfillmentResponse } = {};
  fulfillments.forEach(a => {
    const b = a.payload;
    const c = merged_fulfillments[a?.uuid];
    if (b && c) {
      c.payload.packaging?.parcels.push(a?.parcel);
      c.payload.labels.push(a?.label);
      c.payload.tracking.push(...b?.tracking);
      c.payload.state = StateRank[b.state] < StateRank[c.payload.state] ? b.state : c.payload.state;
      c.status = c.status.code > a.status.code ? c.status : a.status;
      c.payload.total_price += a.payload.total_price;
      c.payload.total_vat += a.payload.total_vat;
    }
    else {
      delete a.uuid;
      delete a.product;
      delete a.parcel;
      delete a.label;
      merged_fulfillments[a.uuid] = a;
    }
  });
  return Object.values(merged_fulfillments);
};

// Register Stubs at the end of this file
export { DHL } from './stubs/dhl';
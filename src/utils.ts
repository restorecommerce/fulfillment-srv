import { randomUUID } from 'crypto';
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
import { Behavior, TaxTypeResponse } from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/tax_type';
import { TaxResponse } from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/tax';

export type Courier = FulfillmentCourier;
export type CourierResponse = FulfillmentCourierResponse;
export type CourierMap = { [id: string]: Courier };
export type CourierResponseMap = { [id: string]: CourierResponse };

export type Product = FulfillmentProduct;
export type ProductResponse = FulfillmentProductResponse;
export type ProductResponseMap = { [id: string]: ProductResponse };

export type CountryResponseMap = { [id: string]: CountryResponse };
export type TaxResponseMap = { [id: string]: TaxResponse };
export type TaxTypeResponseMap = { [id: string]: TaxTypeResponse };


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

export const applyVat = (
  gross: number,
  tax_ratio: number,
  tax_type: Behavior,
) => {
  switch (tax_type as any) {
    case 'INCLUSIVE': return 0;
    case 'EXCLUSIVE': return gross * tax_ratio;
    default: 0;
  }
}

export const getVat = (
  gross: number,
  tax_ratio: number,
  tax_type: Behavior,
) => {
  switch (tax_type as any) {
    case 'INCLUSIVE': return gross * -tax_ratio;
    case 'EXCLUSIVE': return gross * tax_ratio;
    default: 0;
  }
}
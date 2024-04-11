import { randomUUID } from 'crypto';
import { Client } from '@restorecommerce/grpc-client';
import {
  FulfillmentResponse,
  Label,
  Parcel,
  State,
  Tracking,
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/fulfillment.js';
import {
  FulfillmentCourier,
  FulfillmentCourierResponse,
  FulfillmentCourierServiceImplementation,
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/fulfillment_courier.js';
import {
  FulfillmentProduct,
  FulfillmentProductResponse,
  FulfillmentProductServiceImplementation,
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/fulfillment_product.js';
import {
  UserServiceDefinition
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/user.js';
import {
  CustomerServiceDefinition
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/customer.js';
import {
  ShopServiceDefinition
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/shop.js';
import {
  OrganizationServiceDefinition
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/organization.js';
import {
  ContactPointServiceDefinition
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/contact_point.js';
import {
  Tax,
  TaxServiceDefinition,
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/tax.js';
import {
  AddressServiceDefinition
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/address.js';
import {
  Country,
  CountryResponse,
  CountryServiceDefinition
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/country.js';
import {
  InvoiceServiceDefinition
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/invoice.js';
import {
  OperationStatus,
  Status
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/status.js';

export type CRUDClient = Client<TaxServiceDefinition>
| Client<UserServiceDefinition>
| Client<CustomerServiceDefinition>
| Client<ShopServiceDefinition>
| Client<OrganizationServiceDefinition>
| Client<ContactPointServiceDefinition>
| Client<AddressServiceDefinition>
| Client<CountryServiceDefinition>
| Client<InvoiceServiceDefinition>
| FulfillmentCourierServiceImplementation
| FulfillmentProductServiceImplementation;

export type Courier = FulfillmentCourier;
export type CourierResponse = FulfillmentCourierResponse;
export type CourierMap = { [id: string]: Courier };

export type Payload = { id?: string };
export type Response<T extends Payload> = { 
  payload?: T,
  status?: Status,
};
export type ResponseList<T extends Payload> = {
  items?: Response<T>[],
  operation_status?: OperationStatus,
}
export type ResponseMap<T extends Payload> = { [id: string]: Response<T> }

export const filterTax = (
  tax: Tax,
  origin: Country,
  target: Country,
  commercial: boolean,
) => (
  commercial &&
  tax.country_id === origin.id &&
  (
    !target.economic_areas ||
    origin.economic_areas?.some(
      e => e in target.economic_areas
    )
  )
);

export const StateRank = Object.values(State).reduce((a, b, i) => {
  a[b] = i;
  return a; 
}, {} as { [key: string]: number });

export interface AggregatedFulfillment extends FulfillmentResponse
{
  products: FulfillmentProductResponse[];
  couriers: CourierResponse[];
  sender_country: CountryResponse;
  recipient_country: CountryResponse;
  options: any;
}

export interface FlatAggregatedFulfillment extends FulfillmentResponse
{
  uuid: string;
  product: FulfillmentProduct;
  courier: Courier;
  sender_country: Country;
  recipient_country: Country;
  parcel: Parcel;
  label: Label;
  tracking: Tracking;
  options: any;
}

export const createStatusCode = (
  entity: string,
  id: string,
  status: Status,
  details?: string,
): Status => ({
  id,
  code: status?.code ?? 500,
  message: status?.message?.replace(
    '{entity}', entity
  ).replace(
    '{id}', id
  ).replace(
    '{details}', details
  ) ?? 'Unknown status',
});

export const throwStatusCode = <T>(
  entity: string,
  id: string,
  status: Status,
  details?: string,
): T => {
  throw createStatusCode(
    entity,
    id,
    status,
    details
  );
};

export const createOperationStatusCode = (
  entity: string,
  status: OperationStatus,
  details?: string,
): OperationStatus => ({
  code: status?.code ?? 500,
  message: status?.message?.replace(
    '{entity}', entity
  ).replace(
    '{details}', details
  ) ?? 'Unknown status',
});

export const throwOperationStatusCode = <T>(
  entity: string,
  status: OperationStatus,
  details?: string,
): T => {
  throw createOperationStatusCode(
    entity,
    status,
    details,
  );
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
  return fulfillments.flatMap((fulfillment) => {
    const uuid = randomUUID();
    return fulfillment.payload?.packaging?.parcels.map((parcel, i): FlatAggregatedFulfillment => {
      const product = fulfillment.products?.[i].payload;
      const courier = fulfillment.couriers?.[i].payload;
      const label = fulfillment.payload?.labels?.[i];
      const tracking = fulfillment.payload?.trackings?.[i];
      return {
        uuid,
        payload: {
          ...fulfillment.payload,
          state: label?.state ?? fulfillment.payload?.state,
        },
        sender_country: fulfillment.sender_country?.payload,
        recipient_country: fulfillment.recipient_country?.payload,
        product,
        courier,
        parcel,
        label,
        tracking,
        options: fulfillment.options,
        status: tracking?.status ?? label?.status ?? fulfillment.status,
      };
    })
  });
}

export const mergeFulfillments = (fulfillments: FlatAggregatedFulfillment[]): FulfillmentResponse[] => {
  const merged_fulfillments: { [uuid: string]: FulfillmentResponse } = {};
  fulfillments.forEach(a => {
    const b = a.payload;
    const c = merged_fulfillments[a?.uuid];
    if (b && c) {
      if (a.parcel) c.payload.packaging.parcels.push(a.parcel);
      if (a.label) c.payload.labels.push(a.label);
      if (a.tracking) c.payload.trackings.push(a.tracking);
      c.payload.state = StateRank[b.state] < StateRank[c.payload.state] ? b.state : c.payload.state;
      c.status = c.status.code > a.status.code ? c.status : a.status;
      c.payload.total_amounts = a.payload.total_amounts?.reduce(
        (a, b) => {
          const c = a.find(c => c.currency_id === b.currency_id);
          if (c) {
            c.gross += b.gross;
            c.net += b.net;
            c.vats = b.vats.reduce(
              (a, b) => {
                const c = a.find(c => c.tax_id === b.tax_id);
                if (c) {
                  c.vat += b.vat;
                }
                else {
                  a.push({...b});
                }
                return a;
              },
              c.vats,
            );
          }
          else {
            a.push({...b});
          }
          return a;
        },
        c.payload.total_amounts ?? [],
      ) ?? [];
    }
    else {
      b.packaging.parcels = a.parcel ? [a.parcel] : [];
      b.labels = a.label ? [a.label] : [];
      b.trackings = a.tracking ? [a.tracking] : [];
      merged_fulfillments[a.uuid] = a;
    }
  });
  return Object.values(merged_fulfillments);
};
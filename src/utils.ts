import { randomUUID } from 'crypto';
import { Client } from '@restorecommerce/grpc-client';
import {
  FulfillmentResponse,
  Label,
  Parcel,
  State,
} from '@restorecommerce/types/server/io/restorecommerce/fulfillment';
import {
  FulfillmentCourier,
  FulfillmentCourierResponse,
  FulfillmentCourierServiceImplementation,
} from '@restorecommerce/types/server/io/restorecommerce/fulfillment_courier';
import {
  FulfillmentProduct,
  FulfillmentProductResponse,
  FulfillmentProductServiceImplementation,
} from '@restorecommerce/types/server/io/restorecommerce/fulfillment_product';
import {
  UserResponse,
  UserServiceDefinition
} from '@restorecommerce/types/server/io/restorecommerce/user';
import {
  CustomerResponse,
  CustomerServiceDefinition
} from '@restorecommerce/types/server/io/restorecommerce/customer';
import {
  ShopResponse,
  ShopServiceDefinition
} from '@restorecommerce/types/server/io/restorecommerce/shop';
import {
  OrganizationResponse,
  OrganizationServiceDefinition
} from '@restorecommerce/types/server/io/restorecommerce/organization';
import {
  ContactPointResponse,
  ContactPointServiceDefinition
} from '@restorecommerce/types/server/io/restorecommerce/contact_point';
import {
  Tax,
  TaxResponse,
  TaxServiceDefinition,
} from '@restorecommerce/types/server/io/restorecommerce/tax';
import {
  AddressResponse,
  AddressServiceDefinition
} from '@restorecommerce/types/server/io/restorecommerce/address';
import {
  Country,
  CountryResponse,
  CountryServiceDefinition
} from '@restorecommerce/types/server/io/restorecommerce/country';
import {
  InvoiceServiceDefinition
} from '@restorecommerce/types/server/io/restorecommerce/invoice';

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

export type Product = FulfillmentProduct;
export type ProductResponse = FulfillmentProductResponse;
export type Courier = FulfillmentCourier;
export type CourierResponse = FulfillmentCourierResponse;

export type CourierMap = { [id: string]: Courier };
export type CourierResponseMap = { [id: string]: CourierResponse };
export type ProductResponseMap = { [id: string]: ProductResponse };
export type UserResponseMap = { [id: string]: UserResponse };
export type CustomerResponseMap = { [id: string]: CustomerResponse };
export type ShopResponseMap = { [id: string]: ShopResponse };
export type OrganizationResponseMap = { [id: string]: OrganizationResponse };
export type ContactPointResponseMap = { [id: string]: ContactPointResponse };
export type AddressResponseMap = { [id: string]: AddressResponse };
export type CountryResponseMap = { [id: string]: CountryResponse };
export type TaxResponseMap = { [id: string]: TaxResponse };

export const COUNTRY_CODES_EU = [
  'AT', 'BE', 'BG', 'CY', 'CZ', 'DE', 'DK', 'EE', 'ES',
  'FI', 'FR', 'GR', 'HR', 'HU', 'IE', 'IT', 'LT', 'LU',
  'LV', 'MT', 'NL', 'PL', 'PT', 'RO', 'SE', 'SI', 'SK'
];

export const COUNTRY_CODES_ALL = [
  'AD', 'AE', 'AF', 'AG', 'AL', 'AM', 'AO', 'AR', 'AT',
  'AU', 'AZ', 'BA', 'BB', 'BD', 'BE', 'BF', 'BG', 'BH',
  'BI', 'BJ', 'BN', 'BO', 'BR', 'BS', 'BT', 'BW', 'BY',
  'BZ', 'CA', 'CD', 'CF', 'CG', 'CH', 'CI', 'CL', 'CM',
  'CN', 'CO', 'CR', 'CU', 'CV', 'CY', 'CZ', 'DE', 'DJ',
  'DK', 'DM', 'DO', 'DZ', 'EC', 'EE', 'EG', 'ER', 'ES',
  'ET', 'FI', 'FJ', 'FM', 'FR', 'GA', 'GB', 'GD', 'GE',
  'GH', 'GM', 'GN', 'GQ', 'GR', 'GT', 'GW', 'GY', 'HN',
  'HR', 'HT', 'HU', 'ID', 'IE', 'IL', 'IN', 'IQ', 'IR',
  'IS', 'IT', 'JM', 'JO', 'JP', 'KE', 'KG', 'KH', 'KI',
  'KM', 'KN', 'KP', 'KR', 'KW', 'KZ', 'LA', 'LB', 'LC',
  'LI', 'LK', 'LR', 'LS', 'LT', 'LU', 'LV', 'LY', 'MA',
  'MC', 'MD', 'ME', 'MG', 'MH', 'MK', 'ML', 'MM', 'MN',
  'MR', 'MT', 'MU', 'MV', 'MW', 'MX', 'MY', 'MZ', 'NA',
  'NE', 'NG', 'NI', 'NL', 'NO', 'NP', 'NR', 'NZ', 'OM',
  'PA', 'PE', 'PG', 'PH', 'PK', 'PL', 'PT', 'PW', 'PY',
  'QA', 'RO', 'RS', 'RU', 'RW', 'SA', 'SB', 'SC', 'SD',
  'SE', 'SG', 'SI', 'SK', 'SL', 'SM', 'SN', 'SO', 'SR',
  'SS', 'ST', 'SV', 'SY', 'SZ', 'TA', 'TD', 'TG', 'TH',
  'TJ', 'TL', 'TM', 'TN', 'TO', 'TR', 'TT', 'TV', 'TW',
  'TZ', 'UA', 'UG', 'US', 'UY', 'UZ', 'VA', 'VC', 'VE',
  'VN', 'VU', 'WS', 'YE', 'ZA', 'ZM', 'ZW'
];

export const COUNTRY_CODES_NON_EU = COUNTRY_CODES_ALL.filter(
  c => !COUNTRY_CODES_EU.includes(c)
);

export const filterTax = (
  tax: Tax,
  origin: Country,
  target: Country,
  commercial: boolean,
) => (
  commercial &&
  tax.country_id === origin.id &&
  origin.country_code in COUNTRY_CODES_EU &&
  target.country_code in COUNTRY_CODES_EU
);

export const StateRank = Object.values(State).reduce((a, b, i) => {
  a[b] = i;
  return a; 
}, {} as { [key: string]: number });

export interface AggregatedFulfillment extends FulfillmentResponse
{
  products: ProductResponse[];
  couriers: CourierResponse[];
  sender_country: CountryResponse;
  recipient_country: CountryResponse;
  options: any;
}

export interface FlatAggregatedFulfillment extends FulfillmentResponse
{
  uuid: string;
  product: Product;
  courier: Courier;
  sender_country: Country;
  recipient_country: Country;
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
    fulfillment.payload?.packaging?.parcels.map((parcel, i): FlatAggregatedFulfillment => {
      const uuid = fulfillment.payload.id ?? randomUUID();
      const product = fulfillment.products[i].payload;
      const courier = fulfillment.couriers[i].payload;
      const label = fulfillment.payload.labels[i];
      return {
        payload: fulfillment.payload,
        uuid,
        sender_country: fulfillment.sender_country.payload,
        recipient_country: fulfillment.recipient_country.payload,
        product,
        courier,
        label,
        parcel,
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
      c.payload.trackings.push(...b?.trackings);
      c.payload.state = StateRank[b.state] < StateRank[c.payload.state] ? b.state : c.payload.state;
      c.status = c.status.code > a.status.code ? c.status : a.status;
      c.payload.total_amounts = a.payload.total_amounts.reduce(
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
        c.payload.total_amounts,
      );
    }
    else {
      delete a.uuid;
      delete a.product;
      delete a.parcel;
      delete a.label;
      merged_fulfillments[a.uuid] = { ...a };
    }
  });
  return Object.values(merged_fulfillments);
};
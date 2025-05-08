import { BigNumber } from 'bignumber.js';
import {
  FulfillmentResponse,
  Label,
  Parcel,
  FulfillmentState,
  Tracking,
  FulfillmentListResponse,
  Fulfillment,
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/fulfillment.js';
import {
  FulfillmentCourier,
  FulfillmentCourierResponse,
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/fulfillment_courier.js';
import {
  FulfillmentProduct,
  FulfillmentSolutionQueryList,
  Variant,
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/fulfillment_product.js';
import {
  Credential,
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/credential.js';
import {
  Tax,
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/tax.js';
import {
  Country,
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/country.js';
import {
  OperationStatus,
  Status
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/status.js';
import {
  Amount,
  VAT
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/amount.js';
import {
  Shop,
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/shop.js';
import {
  Customer,
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/customer.js';
import {
  Organization,
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/organization.js';
import {
  ContactPoint,
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/contact_point.js';
import {
  Address,
  ShippingAddress,
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/address.js';
import {
  Currency,
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/currency.js';
import {
  User,
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/user.js';
import {
  TaxType,
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/tax_type.js';
import {
  Locale,
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/locale.js';
import {
  Timezone,
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/timezone.js';
import {
  Template,
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/template.js';
import {
  RenderRequest_Strategy
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/rendering.js';
import {
  Any
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/google/protobuf/any.js';
import {
  type Aggregation,
  resolve,
  Resolver,
  ArrayResolver,
  ResourceMap,
} from '@restorecommerce/resource-base-interface/lib/experimental/index.js';
import { Product } from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/product.js';
import { Setting } from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/setting.js';

export class OperationStatusError
  extends Error
  implements OperationStatus
{
  constructor(
    public readonly code: number,
    message: string
  ) {
    super(message);
  }
}

export type AggregationBaseTemplate = {
  shops?: ResourceMap<Shop>,
  customers?: ResourceMap<Customer>,
  organizations?: ResourceMap<Organization>,
  contact_points?: ResourceMap<ContactPoint>,
  addresses?: ResourceMap<Address>,
  countries?: ResourceMap<Country>,
};
export type FulfillmentAggregationTemplate = AggregationBaseTemplate & {
  users?: ResourceMap<User>,
  products?: ResourceMap<Product>,
  taxes?: ResourceMap<Tax>,
  tax_types?: ResourceMap<TaxType>,
  fulfillment_products?: ResourceMap<FulfillmentProduct>,
  fulfillment_couriers?: ResourceMap<FulfillmentCourier>,
  locales?: ResourceMap<Locale>,
  timezones?: ResourceMap<Timezone>,
  currencies?: ResourceMap<Currency>,
  templates?: ResourceMap<Template>,
  settings?: ResourceMap<Setting>,
  credentials?: ResourceMap<Credential>,
};
export const FulfillmentAggregationTemplate = {} as FulfillmentAggregationTemplate;
export type FulfillmentSolutionQueryAggregationTemplate = AggregationBaseTemplate & {
  products?: ResourceMap<Product>,
};
export const FulfillmentSolutionQueryAggregationTemplate = {} as FulfillmentSolutionQueryAggregationTemplate;
export type AggregatedFulfillmentListResponse = Aggregation<
  FulfillmentListResponse,
  FulfillmentAggregationTemplate
>;
export type AggregatedFulfillmentSolutionQueryList = Aggregation<
  FulfillmentSolutionQueryList,
  FulfillmentSolutionQueryAggregationTemplate
>;

export type Courier = FulfillmentCourier;
export type CourierResponse = FulfillmentCourierResponse;
export const StateRank = Object.values(FulfillmentState).reduce((a, b, i) => {
  a[b] = i;
  return a;
}, {} as { [key: string]: number });

export interface FlatAggregatedFulfillment extends FulfillmentResponse
{
  product?: FulfillmentProduct;
  courier?: Courier;
  credential?: Credential;
  sender_country?: Country;
  recipient_country?: Country;
  parcel?: Parcel;
  labels?: Label[];
  trackings?: Tracking[];
  options?: Any;
};

export const DefaultUrns = {
  instanceType: 'urn:restorecommerce:acs:model:order:Order',
  ownerIndicatoryEntity: 'urn:restorecommerce:acs:names:ownerIndicatoryEntity',
  ownerInstance: 'urn:restorecommerce:acs:names:ownerInstance',
  organization: 'urn:restorecommerce:acs:model:organization.Organization',
  user: 'urn:restorecommerce:acs:model:user.User',

  shop_fulfillment_send_confirm_enabled:  'urn:restorecommerce:shop:setting:fulfillment:submit:notification:enabled',       // Sends notification on order submit if enabled (default: true)
  shop_fulfillment_send_cancel_enabled:   'urn:restorecommerce:shop:setting:fulfillment:cancel:notification:enabled',       // Sends notification on order cancel if enabled (default: true)
  shop_fulfillment_send_withdrawn_enabled:'urn:restorecommerce:shop:setting:fulfillment:withdrawn:notification:enabled', // Sends notification on order withdrawn if enabled (default: true)

  shop_invoice_create_enabled:      'urn:restorecommerce:shop:setting:fulfillment:submit:invoice:create:enabled',     // Creates invoice on order submit if enabled (default: true)
  shop_invoice_render_enabled:      'urn:restorecommerce:shop:setting:fulfillment:submit:invoice:render:enabled',     // Renders invoice on order submit if enabled, overrides create! (default: true)
  shop_invoice_send_enabled:        'urn:restorecommerce:shop:setting:fulfillment:submit:invoice:send:enabled',       // Sends invoice on order submit if enabled, overrides render! (default: true)
  shop_email_render_options:        'urn:restorecommerce:shop:setting:fulfillment:email:render:options',              // [json]: override email rendering options - default: cfg -> null
  shop_email_render_strategy:       'urn:restorecommerce:shop:setting:fulfillment:email:render:strategy',             // [enum]: override email rendering strategy - default: cfg -> INLINE
  shop_email_provider:              'urn:restorecommerce:shop:setting:fulfillment:email:provider',                    // [string]: override to supported email provider - default: cfg -> null
  shop_email_cc:                    'urn:restorecommerce:shop:setting:fulfillment:email:cc',                          // [string]: add recipients in CC (comma separated) - default: cfg -> null
  shop_email_bcc:                   'urn:restorecommerce:shop:setting:fulfillment:email:bcc',                         // [string]: add recipients in BC (comma separated) - default: cfg -> null
  customer_locales:                 'urn:restorecommerce:customer:setting:locales',                             // [string]: list of locales in descending preference (comma separated) - default: cfg -> 'en'
  customer_email_cc:                'urn:restorecommerce:customer:setting:fulfillment:email:cc',                      // [string]: add recipients in CC (comma separated) - default: cfg -> null
  customer_email_bcc:               'urn:restorecommerce:customer:setting:fulfillment:email:bcc',                     // [string]: add recipients in BC (comma separated) - default: cfg -> null
};
export type DefaultUrns = typeof DefaultUrns;

export const DefaultSetting = {
  shop_fulfillment_send_confirm_enabled: true,
  shop_fulfillment_send_cancel_enabled: true,
  shop_fulfillment_send_withdrawn_enabled: true,
  shop_invoice_create_enabled: false,
  shop_invoice_render_enabled: false,
  shop_invoice_send_enabled: false,
  shop_email_render_options: undefined as any,
  shop_email_render_strategy: RenderRequest_Strategy.INLINE,
  shop_email_provider: undefined as string,
  shop_email_cc: undefined as string[],
  shop_email_bcc: undefined as string[],
  shop_locales: ['en'] as string[],
  customer_locales: ['en'] as string[],
  customer_email_cc: undefined as string[],
  customer_email_bcc: undefined as string[],
};
export type DefaultSetting = typeof DefaultSetting;
export type SettingMap = Map<string, DefaultSetting>;
export type RatioedTax = Tax & {
  tax_ratio?: number;
};

export const merge = <T>(...lists: T[][]) => lists.filter(
  list => list
).flatMap(
  list => list
);

export const unique = <T extends Record<string, any>>(objs: T[], by = 'id'): T[] => [
  ...new Map<string, T>(
  objs.map(
    o => [o[by], o]
  )).values()
];

const parseList = (value: string) => value?.match(/^\[.*\]$/) ? JSON.parse(value) : value?.split(/\s*,\s*/)
const parseTrue = (value: string) => value?.toString().toLowerCase() === 'true';
const SettingParser: { [key: string]: (value: string) => any } = {
  shop_order_send_confirm_enabled: parseTrue,
  shop_order_send_cancel_enabled: parseTrue,
  shop_order_send_withdrawn_enabled: parseTrue,
  shop_fulfillment_evaluate_enabled: parseTrue,
  shop_fulfillment_create_enabled: parseTrue,
  shop_invoice_create_enabled: parseTrue,
  shop_invoice_render_enabled: parseTrue,
  shop_invoice_send_enabled: parseTrue,
  shop_order_error_cleanup: parseTrue,
  shop_email_render_options: JSON.parse,
  shop_locales: parseList,
  shop_email_cc: parseList,
  shop_email_bcc: parseList,
  customer_locales: parseList,
  customer_email_cc: parseList,
  customer_email_bcc: parseList,
};

export const parseSetting = (key: string, value: string) => {
  const parser = SettingParser[key];
  if (parser) {
    return parser(value);
  }
  else {
    return value;
  }
};

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
  status?: OperationStatus,
  entity?: string,
  id?: string,
): OperationStatus => new OperationStatusError(
  status?.code ?? 500,
  status?.message?.replace(
    '{entity}', entity ?? 'undefined'
  ).replace(
    '{id}', id ?? 'undefined'
  ) ?? 'Unknown status',
);

export const throwOperationStatusCode = <T>(
  status: OperationStatus,
  entity?: string,
  id?: string,
): T => {
  throw createOperationStatusCode(
    status,
    entity,
    id,
  );
};

export const marshallProtobufAny = (
  obj: any,
  type_url?: string
): Any => ({
  type_url,
  value: Buffer.from(
    JSON.stringify(
      obj
    )
  )
});

export const unmarshallProtobufAny = (payload: Any): any => (
  payload?.value
  ? JSON.parse(
    payload.value.toString()
  )
  : undefined
);

export const filterTax = (
  tax: Tax,
  origin: Country,
  destination: Country,
  private_customer: boolean,
) => (
  private_customer &&
  tax.country_id === origin.id &&
  (
    !destination.economic_areas ||
    origin.economic_areas?.some(
      e => destination.economic_areas.includes(e)
    )
  )
);

export const calcAmount = (
  gross: number | BigNumber,
  taxes: RatioedTax[],
  origin: Country,
  destination: Country,
  currency?: Currency,
  private_customer = true,
): Amount => {
  taxes = taxes.filter(
    tax => filterTax(
      tax,
      origin,
      destination,
      private_customer,
    )
  );
  gross = new BigNumber(gross);
  const precision = currency?.precision ?? 2;
  const vats = taxes.map((tax): VAT => ({
    tax_id: tax.id,
    vat: gross.multipliedBy(
      tax.rate
    ).multipliedBy(
      tax.tax_ratio ?? 1.0
    ).decimalPlaces(
      precision
    ).toNumber(),
  }));
  const net = vats.reduce(
    (a, b) => a.plus(b.vat),
    gross
  );
  return {
    currency_id: currency?.id,
    gross: gross.decimalPlaces(precision).toNumber(),
    net: net.decimalPlaces(precision).toNumber(),
    vats,
  };
};

export const calcTotalAmounts = (
  amounts: Amount[],
  currency_map?: ResourceMap<Currency>, 
): Amount[] => {
  const amount_map = amounts?.reduce(
    (a, b) => {
      const c = a[b.currency_id];
      if (c) {
        c.push(b);
      }
      else {
        a[b.currency_id] = [b];
      }
      return a;
    },
    {} as Record<string, Amount[]>
  ) ?? {};

  const total_amounts = Object.entries(amount_map).map(
    ([currency_id, amounts]) => {
      const precision = currency_map.get(currency_id, null)?.precision ?? 2;
      return {
        currency_id,
        gross: amounts.reduce(
          (a, b) => a.plus(b.gross), new BigNumber(0)
        ).decimalPlaces(precision).toNumber(),
        net: amounts.reduce(
          (a, b) => a.plus(b.net), new BigNumber(0)
        ).decimalPlaces(precision).toNumber(),
        vats: Object.entries(amounts.flatMap(
          a => a.vats
        ).reduce(
          (a, b) => {
            const c = a[b.tax_id];
            if (c) {
              c.push(b);
            }
            else {
              a[b.tax_id] = [b];
            }
            return a;
          },
          {} as Record<string, VAT[]>
        )).map(([tax_id, v]) => ({
          tax_id,
          vat: v.reduce(
            (a, b) => a.plus(b.vat), new BigNumber(0)
          ).decimalPlaces(precision).toNumber()
        })),
      } as Amount
    }
  );
  return total_amounts;
};

export const resolveShopAddress = (
  shop_id: string,
  aggregation: AggregationBaseTemplate,
  contact_point_type_id: string,
): ShippingAddress => {
  const shop = aggregation.shops?.get(
    shop_id
  );
  const contact_point = aggregation.contact_points?.getMany(
    aggregation.organizations?.get(
      shop.organization_id
    ).contact_point_ids
  )?.find(
    cp => cp?.contact_point_type_ids?.includes(contact_point_type_id)
  );
  const address = aggregation.addresses?.get(
    contact_point?.physical_address_id
  );
  delete address.meta;
  return {
    address,
    contact: {
      email: contact_point.email,
      name: contact_point.name,
      phone: contact_point.telephone,
    }
  };
};

export const resolveCustomerAddress = (
  customer_id: string,
  aggregation: AggregationBaseTemplate,
  contact_point_type_id: string,
): ShippingAddress => {
  const customer = aggregation.customers?.get(
    customer_id
  );
  const contact_point = aggregation.contact_points?.getMany(
    customer?.private?.contact_point_ids ??
    aggregation.organizations?.get(
      customer?.commercial?.organization_id
      ?? customer?.public_sector?.organization_id
    )?.contact_point_ids
  )?.find(
    cp => cp?.contact_point_type_ids?.includes(contact_point_type_id)
  );
  const address = aggregation.addresses?.get(
    contact_point?.physical_address_id
  );
  delete address.meta;
  return {
    address,
    contact: {
      email: contact_point.email,
      name: contact_point.name,
      phone: contact_point.telephone,
    }
  };
};

export const mergeFulfillmentProductVariant = (
  product: FulfillmentProduct,
  variant_id: string
): Variant => {
  const variant = product.variants.find(
    v => v.id === variant_id
  );
  if (variant) {
    variant.attributes = unique(
      merge(
        product.attributes,
        variant.attributes,
      )
    );
  }
  return variant;
}

export const mergeFulfillmentProduct = (
  product: FulfillmentProduct,
  variant_id: string
): FulfillmentProduct => {
  const variant = mergeFulfillmentProductVariant(
    product,
    variant_id,
  );
  return {
    ...product,
    variants: [variant],
  };
};

export const resolveFulfillment = (
  aggregation: AggregatedFulfillmentListResponse,
  fulfillment: Fulfillment,
) => {
  const country_resolver = Resolver('country_id', aggregation.countries);
  const currency_resolver = Resolver(
    'currency_id',
    aggregation.currencies,
    {
      countries: ArrayResolver('country_ids', aggregation.countries),
    }
  );
  const address_resolver = Resolver(
    'address_id',
    aggregation.addresses,
    {
      country: country_resolver,
    }
  );
  const contact_points_resolver = ArrayResolver(
    'contact_point_ids',
    aggregation.contact_points,
    {
      physical_address: Resolver(
        'physical_address_id',
        aggregation.addresses,
        {
          country: country_resolver,
        }
      ),
      locale: Resolver('locale_id', aggregation.locales),
      timezone: Resolver('timezone_id', aggregation.timezones),
    }
  );
  const organization_resolver = Resolver(
    'organization_id',
    aggregation.organizations,
    {
      contact_points: contact_points_resolver
    }
  );
  const user_resolver = Resolver('user_id', aggregation.users, {
    locale: Resolver('locale_id', aggregation.locales),
    timezone: Resolver('timezone_id', aggregation.timezones),
  });
  const tax_resolver = Resolver('tax_id', aggregation.taxes, {
    type: Resolver('type_id', aggregation.tax_types),
    country: country_resolver,
  });
  const taxes_resolver = ArrayResolver('tax_ids', aggregation.taxes, {
    type: Resolver('type_id', aggregation.tax_types),
    country: country_resolver,
  });
  const amount_resolver = {
    currency: currency_resolver,
    vats: [{
      tax: tax_resolver
    }]
  };
  const fulfillment_courier_resolver = Resolver('courier_id', aggregation.fulfillment_couriers);
  const fulfillment_product_resolver = Resolver('product_id', aggregation.fulfillment_products, {
    courier: fulfillment_courier_resolver,
    taxes: taxes_resolver,
    price: {
      currency: currency_resolver,
    }
  });
  const parcel_resolver = [{
    product: fulfillment_product_resolver,
    amount: amount_resolver,
    price: {
      currency: currency_resolver,
    }
  }];
  const fulfillment_resolver = {
    customer: Resolver('customer_id', aggregation.customers, {
      commercial: {
        organization: organization_resolver,
      },
      public_sector: {
        organization: organization_resolver,
      },
      private: {
        contact_points: contact_points_resolver,
        user: user_resolver,
      },
    }),
    shop: Resolver('shop_id', aggregation.shops, {
      organization: organization_resolver
    }),
    user: user_resolver,
    packaging: {
      parcels: parcel_resolver,
      sender: {
        address: address_resolver
      },
      recipient: {
        address: address_resolver
      },
    }
  };

  const resolved = resolve(
    fulfillment,
    fulfillment_resolver,
  );

  resolved.packaging?.parcels?.forEach(
    parcel => {
      parcel.product = mergeFulfillmentProduct(
        parcel.product,
        parcel.variant_id,
      );
      parcel.price = parcel.product.variants?.[0]?.price;
    }
  );
  return resolved;
};

export const packRenderData = (
  aggregation: AggregatedFulfillmentListResponse,
  fulfillment: Fulfillment,
) => {
  const resolved = {
    fulfillment: resolveFulfillment(
      aggregation,
      fulfillment
    ),
  };
  const buffer = marshallProtobufAny(resolved);
  return buffer;
};

export const flatMapAggregatedFulfillmentListResponse = (aggregation: AggregatedFulfillmentListResponse): FlatAggregatedFulfillment[] => {
  return aggregation.items.flatMap((item) => {
    const payload = item.payload;
    return payload?.packaging?.parcels.map((parcel): FlatAggregatedFulfillment => {
      const product = aggregation.fulfillment_products.get(parcel.product_id);
      const courier = aggregation.fulfillment_couriers.get(product.courier_id);
      const credential = aggregation.fulfillment_couriers.get(courier.credential_id, null);
      const labels = payload.labels?.filter(label => label.parcel_id === parcel.id);
      const trackings = payload.trackings?.filter(
        tracking => labels.some(label => label.shipment_number === tracking.shipment_number)
      );
      return {
        payload,
        sender_country: aggregation.countries.get(payload.packaging.sender.address?.country_id),
        recipient_country: aggregation.countries.get(payload.packaging.recipient.address?.country_id),
        product,
        courier,
        credential,
        parcel,
        labels,
        trackings,
        status: item.status,
      };
    });
  });
};

export const mergeFulfillments = (
  fulfillments: FlatAggregatedFulfillment[],
  currency_map: ResourceMap<Currency>,
): FulfillmentResponse[] => {
  const fulfillment_map: Record<string, FulfillmentResponse> = {};
  fulfillments.forEach(a => {
    const b = a.payload;
    const c = fulfillment_map[a?.payload.id];
    if (b && c) {
      if (a.parcel) c.payload.packaging.parcels.push(a.parcel);
      if (a.labels) c.payload.labels.push(...a.labels);
      if (a.trackings) c.payload.trackings.push(...a.trackings);
      c.payload.fulfillment_state = c.payload.labels.reduce(
        (x, y) => StateRank[x?.state] < StateRank[y?.state] ? x : y,
        undefined
      )?.state;
      c.status = c.status?.code > a.status?.code ? c.status : a.status;
      c.payload.total_amounts.push(...(b.total_amounts ?? []));
    }
    else {
      b.packaging.parcels = a.parcel ? [a.parcel] : [];
      b.labels = a.labels ? [...a.labels] : [];
      b.trackings = a.trackings ? [...a.trackings] : [];
      b.total_amounts ??= [];
      fulfillment_map[b.id] = a;
    }
  });
  const merged_fulfillments = Object.values(fulfillment_map);
  merged_fulfillments.forEach(f => {
    f.payload.total_amounts = calcTotalAmounts(
      f.payload.total_amounts,
      currency_map,
    )
  });
  return merged_fulfillments;
};
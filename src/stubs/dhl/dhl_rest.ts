import { BigNumber } from "bignumber.js";
import { js2xml } from 'xml-js';
import createClient, { 
  FetchResponse,
  type Client,
  ClientOptions,
} from "openapi-fetch";
import { type Logger } from "@restorecommerce/logger";
import { ServiceConfig } from "@restorecommerce/service-config";
import {
  FulfillmentProduct,
  FulfillmentSolutionQuery,
  Variant
} from "@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/fulfillment_product.js";
import { 
  FulfillmentState,
  Label,
} from "@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/fulfillment.js";
import { Package } from "@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/product.js";
import { paths, components, operations } from "./rest/schema.js"
import { Credential } from "@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/credential.js";
import { Attribute } from "@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/attribute.js";
import {
  AggregatedFulfillmentListResponse,
  Courier,
  FlatAggregatedFulfillment,
  OperationStatusError,
  parseAttributes,
  ParsedAttributes,
  unmarshallProtobufAny,
} from "../../utils.js";
import { Stub } from "../../stub.js";
import { Status } from "@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/status.js";
import { DHLTracking2FulfillmentTracking } from "./dhl_soap.js";

type ShipmentOrderRequest = components['schemas']['ShipmentOrderRequest'];
type ShipmentOrderResponse = components['schemas']['LabelDataResponse'];
type ShipmentOrderFetchResponse = FetchResponse<operations['createOrders'], unknown, 'application/problem+json'>;
type ShipmentOrderStatus = components['schemas']['LabelDataResponse']['status']
type ShippingConditions = components['schemas']['Shipment']['customs']['shippingConditions'];
type ShipmentOrderQuery = operations['createOrders']['parameters']['query'];
type CustomsDeclaration = components['schemas']['CustomsDetails'];
type CountryCode = components['schemas']['Country'];
type ExportType = components['schemas']['Shipment']['customs']['exportType'];
type VAS = components['schemas']['VAS'];

type Config = {
  ordering?: {
    tokenUrl?: string,
    client_id?: string,
    client_secret?: string,
    username?: string,
    password?: string,
    profile?: string,
    costCenter?: string,
    billingNumber?: string,
    accountNumber?: string,
    productName?: string,
    grant_type?: string,
    language?: string,
  } & ClientOptions 
    & ShipmentOrderQuery,
  tracking?: {
    appname?: string,
    endpoint?: string,
    username?: string,
    password?: string,
    secret?: string,
  }
};

type AccessToken = {
  access_token?: string,
  token_type?: 'Bearer',
  expires_in?: number,
};

const isShipmentOrderStatus = (
  status: ShipmentOrderStatus | any
): status is ShipmentOrderStatus => (
  !Number.isInteger(status)
  && Number.isInteger(status?.statusCode)
);

const KnownUrns = {
  dhl_accountNumber: 'urn:restorecommerce:fulfillment:attribute:dhl:accountNumber',
  dhl_billingNumber: 'urn:restorecommerce:fulfillment:attribute:dhl:billingNumber',
  dhl_costCenter: 'urn:restorecommerce:fulfillment:attribute:dhl:costCenter',

  dhl_courier_profile: 'urn:restorecommerce:fulfillment:courier:attribute:dhl:profile',
  dhl_courier_language: 'urn:restorecommerce:fulfillment:courier:attribute:dhl:language',
  dhl_courier_label_combined: 'urn:restorecommerce:fulfillment:product:attribute:dhl:label:combined', // flag
  dhl_courier_label_encoding_required: 'urn:restorecommerce:fulfillment:product:attribute:dhl:label:encoding:required', // flag
  dhl_courier_label_print_format: 'urn:restorecommerce:fulfillment:product:attribute:dhl:label:print:format', // e.g. A4
  dhl_courier_label_source_format: 'urn:restorecommerce:fulfillment:product:attribute:dhl:label:source:format', // e.g. URL / b64
  dhl_courier_label_file_format: 'urn:restorecommerce:fulfillment:product:attribute:dhl:label:file:format', // e.g. PDF /
  dhl_courier_label_retoure_print_format: 'urn:restorecommerce:fulfillment:product:attribute:dhl:label:retoure:print:format', // e.g. A4

  dhl_product_service: 'urn:restorecommerce:fulfillment:product:attribute:dhl:service',
  dhl_product_productName: 'urn:restorecommerce:fulfillment:product:attribute:dhl:productName',
  dhl_product_roundWeightUp: 'urn:restorecommerce:fulfillment:product:attribute:dhl:roundWeightUp',
  dhl_product_stepPrice: 'urn:restorecommerce:fulfillment:product:attribute:dhl:stepPrice',
  dhl_product_stepWeight: 'urn:restorecommerce:fulfillment:product:attribute:dhl:stepWeightInKg',
};
type KnownDHLUrns = typeof KnownUrns;

const parseFlag = (str: string) => str?.toString() !== 'false';
const VASParser = {
  additionalInsurance: {
    value: Number.parseFloat,
  },
  bulkyGoods: parseFlag,
  cashOnDelivery: {
    amount: {
      value: Number.parseFloat,
    },
  },
  closestDropPoint: parseFlag,
  namedPersonOnly: parseFlag,
  noNeighbourDelivery: parseFlag,
  postalDeliveryDutyPaid: parseFlag,
  premium: parseFlag,
  signedForByRecipient: parseFlag,
};

const DHLAttributeParser = {
  dhl_courier_label_combined: parseFlag,
  dhl_product_roundWeightUp: Number.parseFloat,
  dhl_product_stepPrice: Number.parseFloat,
  dhl_product_stepWeight: Number.parseFloat,
};
type DHLAttributeParser = typeof DHLAttributeParser;
type ParsedDHLAttributes = ParsedAttributes<KnownDHLUrns, DHLAttributeParser>;

const join = (...args: string[]) => args.join(':');

function nullify(value: string) {
  return value?.length ? value : undefined;
}

export class DHLRest extends Stub {
  protected readonly client: Client<paths>;
  protected readonly urns = KnownUrns;
  protected readonly attributes: ParsedDHLAttributes;
  protected access_token: AccessToken;
  
  protected readonly config: Config = {
    ordering: {
      grant_type: 'password',
      profile: 'STANDARD_GRUPPENPROFIL',
      includeDocs: 'URL',
    },
  };

  protected readonly status_codes = {
    OK: {
      id: '',
      code: 200,
      message: 'OK',
    },
    NOT_FOUND: {
      id: '',
      code: 404,
      message: '{entity} {id} not found! {details}',
    },
    WEAK_ERROR: {
      id: '',
      code: 207,
      message: '{entity} {id} weak validation error! {details}',
    },
    INVALID_ADDRESS: {
      id: '',
      code: 400,
      message: '{entity} {id} address invalid! {details}',
    },
    INVALID_PRICE: {
      id: '',
      code: 500,
      message: '{entity} {id} price calculation failed! {details}',
    },
    UNKNOWN_ERROR: {
      id: '',
      code: 500,
      message: '{entity} {id} caused unknown error! {details}',
    },
  };

  protected readonly operation_status_codes = {
    SUCCESS: {
      code: 200,
      message: 'SUCCESS',
    },
    PARTIAL: {
      code: 400,
      message: 'Patrial executed with errors!',
    },
    LIMIT_EXHAUSTED: {
      code: 500,
      message: 'Query limit 1000 exhausted!',
    },
    TIMEOUT: {
      code: 500,
      message: 'Request timeout, DHL not responding!',
    },
    UNAUTHORIZED: {
      code: 401,
      message: [
        'DHLSoap: Connection to Courier {entity} is unauthorized.',
        'Credentials or accountNumber are missing.',
        'Credentials have to be set either in FulfillmentProduct, Courier, Credential or ServiceConfig.'
      ].join(' ')
    },
    UNKNOWN_RESPONSE: {
      code: 500,
      message: 'DHLSoap: Unexpected response from SOAP-Client! {details}',
    }
  };

  get type(): string {
    return 'DHLRest';
  }

  constructor(courier?: Courier, cfg?: ServiceConfig, logger?: Logger, credential?: Credential) {
    super(courier, cfg, logger);
    const courier_defaults = Object.values(cfg?.get<Courier[]>('defaults:Couriers'))?.find(
      c => c.id === courier.id
    ) ?? Object.values(cfg?.get<Courier[]>('defaults:Couriers'))?.find(
      c => c.api === courier?.api
        || c.api === this.type
    ) as any;

    this.config = {
      ordering: {
        ...this.config?.ordering,
        ...courier_defaults?.configuration?.value?.ordering,
        ...unmarshallProtobufAny(courier?.configuration)?.ordering,
      },
      tracking: {
        ...this.config?.tracking,
        ...courier_defaults?.configuration?.value?.tracking,
        ...unmarshallProtobufAny(courier?.configuration)?.tracking,
      },
    };

    this.status_codes = {
      ...this.status_codes,
      ...this.cfg?.get('statusCodes'),
    };

    this.operation_status_codes = {
      ...this.operation_status_codes,
      ...this.cfg?.get('operationStatusCodes'),
    };

    this.urns = {
      ...this.urns,
      ...this.cfg?.get('urns'),
      ...this.cfg?.get('urns:authentication'),
    };

    this.attributes = parseAttributes(
      this.urns,
      DHLAttributeParser,
      this.courier.attributes ?? []
    );

    this.client = createClient(this.config.ordering);
  }

  protected async getAccessToken(credential?: Credential): Promise<AccessToken> {
    if (this.access_token?.expires_in > Date.now()) {
      return this.access_token;
    }
    else {
      const config = {
        ...this.config.ordering,
        username: credential?.user ?? this.config.ordering?.username,
        password: credential?.pass ?? this.config.ordering?.password,
        ...unmarshallProtobufAny(credential?.credentials)
      };
      const formData = new URLSearchParams();
      formData.append('grant_type', config.grant_type ?? 'password');
      formData.append('username', config.username);
      formData.append('password', config.password);
      formData.append('client_id', config.client_id);
      formData.append('client_secret', config.client_secret);

      this.access_token = await fetch(
        config.tokenUrl,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: formData.toString(),
        }
      ).then(async response => {
        if (!response.ok) {
          const text = await response.text();
          throw new OperationStatusError(
            response?.status ?? 500,
            `DHL Rest Authorization Error: ${response.status} ${text}`,
          );
        }
        return await response.json();
      });
      this.access_token.expires_in = Date.now() + this.access_token.expires_in * 1000;
    }
    return this.access_token;
  }

  public async calcGross(
    product: Variant,
    pack: Package,
    precision = 2,
  ): Promise<BigNumber> {
    const attributes = {
      ...this.attributes,
      ...parseAttributes(
        this.urns,
        DHLAttributeParser,
        product.attributes ?? []
      )
    };
    try{
      const roundWeightUp = attributes.dhl_product_roundWeightUp;
      const step_weight = attributes.dhl_product_stepWeight || 1;
      const step_price = attributes.dhl_product_stepPrice || 1;
      const weight = Number.isNaN(roundWeightUp)
        ? new BigNumber(pack.weight_in_kg)
        : new BigNumber(pack.weight_in_kg).decimalPlaces(roundWeightUp, BigNumber.ROUND_UP) 
      const price = weight.dividedBy(
        step_weight
      ).multipliedBy(
        step_price
      ).plus(
        product.price.sale ? product.price.sale_price : product.price.regular_price
      ).decimalPlaces(
        precision, BigNumber.ROUND_UP
      );
      if (price.isNaN()) {
        throw new Error('NaN detected!');
      }
      return price;
    }
    catch (e: any) {
      this.throwStatusCode(
        'FulfillmentProduct',
        product?.id,
        this.status_codes.INVALID_PRICE,
        e?.message ?? e.details ?? JSON.stringify(e)
      );
    }
  }

  protected getServices(attributes: Attribute[]): VAS {
    attributes = attributes?.filter(
      (att) => att.id?.startsWith(this.urns.dhl_product_service)
    )
    if (!attributes?.length) {
      return undefined;
    }

    const sc = new ServiceConfig();
    const recuSet = (atts: Attribute[], ...keys: string[]) => {
      atts.forEach(att => {
        const key = join(...keys, att.id);
        sc.set(key, att.value);
        recuSet(att.attributes, ...keys, att.id)}
      );
    };
    recuSet(attributes);
    const vas = sc.get(this.urns.dhl_product_service);
    const recuConvert = (value: any, converter: any) => {
      Object.keys(value).forEach(
        (key) => {
          const convert = converter[key];
          if (typeof convert === 'function') {
            value[key] = convert(value[key]);
          }
          else if (convert) {
            recuConvert(value[key], convert);
          }
        }
      )
    };
    recuConvert(vas, VASParser);
    return vas;
  }

  protected getBillingNumber(
    credential: Credential,
    attributes: ParsedAttributes<KnownDHLUrns, DHLAttributeParser>,
  ): string {
    const payload = unmarshallProtobufAny(credential?.credentials);
    const config = this.config.ordering;

    return (
      payload?.billingNumber
      ?? payload?.accountNumber
      ?? attributes.dhl_billingNumber
      ?? attributes.dhl_accountNumber
      ?? config.billingNumber
      ?? config.accountNumber
    );
  }

  protected fulfillment2ShipmentOrder(
    fulfillments: FlatAggregatedFulfillment[],
    aggregation: AggregatedFulfillmentListResponse,
  ): ShipmentOrderRequest {
    const config = this.config?.ordering;
    return {
      profile: config?.profile ?? 'STANDARD_GRUPPENPROFIL',
      shipments: fulfillments.map(
        f => {
          const sender = f.payload.packaging.sender;
          const recipient = f.payload.packaging.recipient;
          const customs = f.payload.packaging.customs_declaration;
          const credential = (
            this.courier.credential_id
            ? aggregation.credentials.get(
              this.courier.credential_id,
            )
            : undefined
          );
          const sender_country = aggregation.countries.get(
            f.payload.packaging.sender.address.country_id
          );
          const recipient_country = aggregation.countries.get(
            f.payload.packaging.recipient.address.country_id
          );
          const attributes = {
            ...this.attributes,
            ...parseAttributes(
              this.urns,
              DHLAttributeParser,
              f.product.attributes ?? [],
            )
          };
          
          return {
            billingNumber: this.getBillingNumber(credential, attributes),
            costCenter: attributes?.dhl_costCenter ?? config?.costCenter,
            refNo: f.payload.id,
            shipper: {
              name1: [
                sender.address.residential_address?.title,
                sender.address.residential_address?.given_name,
                sender.address.residential_address?.mid_name,
                sender.address.residential_address?.family_name,
                sender.address.business_address?.name,
              ].filter(s => s).join(' '),
              name2: nullify(sender.address.address_addition?.field1),
              name3: nullify(sender.address.address_addition?.field2),
              addressStreet: [
                sender.address.street,
                sender.address.building_number,
              ].join(' '),
              postalCode: sender.address.postcode,
              city: sender.address.region,
              country: (sender_country.country_code_alpha_3 ?? sender_country.country_code) as CountryCode,
              email: sender.contact.email,
            },
            consignee: {
              name1: [
                recipient.address.residential_address?.title,
                recipient.address.residential_address?.given_name,
                recipient.address.residential_address?.mid_name,
                recipient.address.residential_address?.family_name,
                recipient.address.pack_station?.station_number,
                recipient.address.pack_station?.post_number,
                recipient.address.business_address?.name,
              ].filter(s => s).join(' '),
              name2: nullify(recipient.address.address_addition?.field1),
              name3: nullify(recipient.address.address_addition?.field2),
              addressStreet: [
                recipient.address.street,
                recipient.address.building_number,
              ].join(' '),
              postalCode: recipient.address.postcode,
              city: recipient.address.region,
              country: (recipient_country.country_code_alpha_3 ?? recipient_country.country_code) as CountryCode,
              email: recipient.contact.email,
            },
            product: attributes.dhl_product_productName ?? config?.productName,
            shipDate: new Date().toISOString(),
            details: {
              weight: {
                uom: 'kg',
                value: f.parcel.package.weight_in_kg
              }
            },
            services: this.getServices([
              f.product.attributes ?? [],
              this.courier.attributes ?? []
            ].flat()),
            customs: (customs ? {
              exportType: (customs.export_type ?? 'COMMERCIAL_GOODS') as ExportType,
              exportDescription: customs.export_description,
              items: f.parcel.items.map(item => {
                const country = aggregation.countries.get(item.origin_country_id);
                return {
                  itemDescription: `${item.name}: ${item.description}`,
                  itemValue: {
                    currency: aggregation.currencies.get(
                      item.value.currency_id
                    )?.symbol,
                    value: item.value?.gross ?? item.value?.net,
                  },
                  itemWeight: {
                    uom: 'kg',
                    value: item.package.weight_in_kg
                  },
                  packagedQuantity: item.quantity,
                  countryOfOrigin: (country?.country_code_alpha_3 ?? country?.country_code) as CountryCode,
                  hsCode: item.hs_code,
                };
              }),
              postalCharges: {
                value: customs.charges?.reduce((a, b) => (b.charge?.net ?? 0) + a, 0) ?? 0
              },
              consigneeCustomsRef: customs.consignee_ref ?? f.payload.customer_id,
              shipperCustomsRef: customs.shipper_ref ?? f.payload.shop_id,
              hasElectronicExportNotification: customs.notify,
              MRN: customs.MRN,
              officeOfOrigin: (sender_country.country_code_alpha_3 ?? sender_country.country_code) as CountryCode,
              permitNo: customs.permit_number,
              attestationNo: customs.attestation,
              invoiceNo: customs.invoice_number,
              shippingConditions: customs.shipping_condition as ShippingConditions,
            } : undefined) as CustomsDeclaration,
          };
        }
      )
    };
  }

  protected async shipmentOrder2fulfillment(
    fulfillments: FlatAggregatedFulfillment[],
    response: ShipmentOrderFetchResponse,
  ): Promise<FlatAggregatedFulfillment[]> {
    const status = response.error?.status ?? response.response?.status;
    if (isShipmentOrderStatus(status)) {
      const vms = (response.error as ShipmentOrderResponse)?.items?.flatMap(
        item => item.validationMessages?.map(vm => vm.validationMessage)
      ) ?? [];
      throw new OperationStatusError(
        status.statusCode,
        [
          status.title,
          status.instance,
          status.detail,
          ...vms,
        ].filter(s => s).join('\n'),
      ); 
    }
    else if (Number.isInteger(status) && status >= 300) {
      throw new OperationStatusError(
        status,
        response.response?.statusText ?? 'Unknown Error!',
      );
    }
    else if (response.data) {
      const response_map = new Map(
        response.data.items?.map(
          (item, i) => [
            item.shipmentRefNo ?? i,
            item,
          ]
        )
      );
      fulfillments.forEach((fulfillment, i) => {
        const item = response_map.get(fulfillment.payload.id) ?? response_map.get(i);
        const vms = item.validationMessages?.map(vm => vm.validationMessage) ?? [];
        const status: Status = {
          id: fulfillment.payload.id,
          code: item.sstatus?.statusCode,
          message: [
            item.sstatus?.title,
            item.sstatus?.instance,
            item.sstatus?.detail,
            vms,
          ].filter(s => s).join('\n'),
        };
        if (status.code < 300) {
          fulfillment.labels ??= [];
          const label = fulfillment.labels.find(
            label => label.shipment_number === item.shipmentNo
          );
          if (label) {
            label.state = FulfillmentState.SUBMITTED;
            label.file = {
              url: item.label?.url,
              blob: item.label?.b64 ? Buffer.from(item.label.b64) : undefined,
              content_type: 'application/pdf',
            };
          }
          else {
            fulfillment.labels.push(
              {
                parcel_id: fulfillment.parcel.id,
                shipment_number: item.shipmentNo,
                state: FulfillmentState.SUBMITTED,
                file: {
                  url: item.label?.url,
                  blob: item.label?.b64 ? Buffer.from(item.label.b64) : undefined,
                  content_type: 'application/pdf',
                },
                status,
              } as Label
            );
          }
          fulfillment.fulfillment_state = FulfillmentState.SUBMITTED;
        }
        if (fulfillment.status?.code < status.code) {
          fulfillment.status = status;
        }
      });
    }
    else {
      throw new OperationStatusError(
        500,
        'Unknown Error!',
      );
    }
    return fulfillments;
  }

  protected async getHeaders(
    aggregation: AggregatedFulfillmentListResponse,
  ) {
    const credential = (
      this.courier.credential_id
      ? aggregation.credentials.get(
        this.courier.credential_id,
      )
      : undefined
    );
    const { access_token, token_type } = await this.getAccessToken(
      credential
    );
    const config = this.config?.ordering;
    return {
      Authorization: `${token_type} ${access_token}`,
      'Accept-Language': this.attributes.dhl_courier_language ?? config?.language ?? 'DE',
    };
  }

  protected async getQuery(
    kwargs?: any
  ): Promise<ShipmentOrderQuery> {
    const config = this.config?.ordering;
    return {
      combine: this.attributes?.dhl_courier_label_combined ?? config?.combine ?? false,
      docFormat: this.attributes?.dhl_courier_label_file_format ?? config?.docFormat ?? 'PDF',
      includeDocs: this.attributes?.dhl_courier_label_source_format ?? config?.includeDocs ?? 'URL',
      mustEncode: this.attributes?.dhl_courier_label_encoding_required ?? config?.mustEncode ?? false,
      printFormat: this.attributes?.dhl_courier_label_print_format ?? config?.printFormat ?? 'A4',
      retourePrintFormat: this.attributes?.dhl_courier_label_retoure_print_format ?? config?.retourePrintFormat ?? "A4",
      ...kwargs,
    };
  }

  protected override async evaluateImpl(
    fulfillments: FlatAggregatedFulfillment[],
    aggregation: AggregatedFulfillmentListResponse,
  ): Promise<FlatAggregatedFulfillment[]> {
    const headers = await this.getHeaders(aggregation);
    const query = await this.getQuery({ validate: true });
    const body = this.fulfillment2ShipmentOrder(
      fulfillments,
      aggregation,
    );
    const response = await this.client.POST(
      '/orders', 
      {
        headers,
        body,
        params: {
          query
        }
      }
    );
    return await this.shipmentOrder2fulfillment(fulfillments, response);
  }

  protected override async submitImpl(
    fulfillments: FlatAggregatedFulfillment[],
    aggregation: AggregatedFulfillmentListResponse,
  ): Promise<FlatAggregatedFulfillment[]> {
    const headers = await this.getHeaders(aggregation);
    const query = await this.getQuery({ validate: false });
    const body = this.fulfillment2ShipmentOrder(
      fulfillments,
      aggregation,
    );
    const response = await this.client.POST(
      '/orders', 
      {
        headers,
        body,
        params: {
          query,
        }
      }
    );
    return await this.shipmentOrder2fulfillment(fulfillments, response);
  }

  protected override async trackImpl (
    fulfillments: FlatAggregatedFulfillment[],
    aggregation: AggregatedFulfillmentListResponse,
  ): Promise<FlatAggregatedFulfillment[]> {
    const promises = fulfillments.map(async item => {
      try {
        const credential = (
          this.courier.credential_id
          ? aggregation.credentials.get(
            this.courier.credential_id,
          )
          : undefined
        );
        const options = unmarshallProtobufAny(item?.options);
        const config = {
          ...this.config.tracking,
          ...credential
            ? {
                username: credential?.user,
                password: credential?.pass,
              } 
            : undefined,
          ...unmarshallProtobufAny(credential?.credentials)?.tracking,
        };

        const auth = 'Basic ' + Buffer.from(`${config.username}:${config.password}`).toString('base64');
        const attributes = {
          appname: config.appname,
          password: config.secret,
          'piece-code': item.labels[0].shipment_number,
          'language-code': options?.['language-code'] ?? 'de',
          request: options?.request ?? 'd-get-piece-detail'
        };
        const xml = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>${
          js2xml({ data: { _attributes: attributes } }, { compact: true })
        }`;
        const params = new URLSearchParams();
        params.append('xml', xml);
        const payload = {
          method: 'get',
          headers: {
            Host: 'cig.dhl.de',
            Authorization: auth,
            Connection: 'Keep-Alive',
          },
          // body: params,
        };

        return await fetch(`${config.endpoint}?${params}`, payload).then(
          response => DHLTracking2FulfillmentTracking(item, response),
          err => {
            this.logger?.error(`${this.type}: ${err}`);
            return DHLTracking2FulfillmentTracking(item, null, err);
          }
        );
      } catch (err) {
        this.logger?.error(`${this.type}: ${err}`);
        item.status = {
          id: item.payload.id,
          code: 500,
          message: JSON.stringify(err)
        };
        return item;
      }
    });

    return await Promise.all(promises);
  };

  protected override async cancelImpl(
    fulfillments: FlatAggregatedFulfillment[],
    aggregation: AggregatedFulfillmentListResponse,
  ): Promise<FlatAggregatedFulfillment[]> {

    const headers = await this.getHeaders(aggregation);
    const labels = fulfillments.flatMap(f => f.labels);
    await Promise.all(labels.map(async label => {
      const response = await this.client.DELETE('/orders', {
        params: {
          headers,
          query: {
            profile: this.attributes?.dhl_courier_profile,
            shipment: label.shipment_number
          },
        },
        headers,
      });
      const status = response.error?.status ?? response.response?.status;
      if (isShipmentOrderStatus(status)) {
        const vms = (response.error as ShipmentOrderResponse)?.items?.flatMap(
          item => item.validationMessages?.map(vm => vm.validationMessage)
        ) ?? [];
        throw new OperationStatusError(
          status.statusCode,
          [
            status.title,
            status.instance,
            status.detail,
            ...vms,
          ].filter(s => s).join('\n'),
        ); 
      }
      else if (Number.isInteger(status) && status >= 300) {
        throw new OperationStatusError(
          status,
          response.response?.statusText ?? 'Unknown Error!',
        );
      }
      else if (response.data) {
        const item = response.data.items.find(
          item => item.shipmentNo === label.shipment_number
        );
        if (Number.isInteger(item?.sstatus?.statusCode)) {
          label.status = {
            id: label.shipment_number,
            code: item.sstatus.statusCode,
            message: [
              item.sstatus.title,
              item.sstatus.instance,
              item.sstatus.detail,
            ].filter(s => s).join(', ')
          };
          if (label.status.code === 200) {
            label.state = FulfillmentState.CANCELLED;
          }
        }
        else {
          const status = response.data?.status;
          label.status = {
            id: label.shipment_number,
            code: status?.statusCode ?? 500,
            message: status ? [
              status.title,
              status.instance,
              status.detail,
            ].filter(s => s).join(', ') : 'Unknwon Error!'
          }
        }
      }
      else {
        throw new OperationStatusError(
          500,
          'Unknown Error!',
        );
      }
    }));
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
import { BigNumber } from "bignumber.js";
import createClient, { FetchResponse, type Client } from "openapi-fetch";
import { type Logger } from "@restorecommerce/logger";
import { Provider } from 'nconf';
import { ServiceConfig } from "@restorecommerce/service-config";
import {
  FulfillmentProduct,
  FulfillmentSolutionQuery,
  Variant
} from "@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/fulfillment_product.js";
import { Package } from "@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/product.js";
import { paths, components, operations } from "./rest/schema.js"
import { Credential } from "@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/credential.js";
import { Attribute } from "@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/attribute.js";
import { Courier, FlatAggregatedFulfillment, OperationStatusError, unmarshallProtobufAny } from "../../utils.js";
import { Stub } from "../../stub.js";
import { FulfillmentState, Label } from "@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/fulfillment.js";

type ShipmentOrderRequest = components['schemas']['ShipmentOrderRequest'];
type ShipmentOrderResponse = components['schemas']['LabelDataResponse'];
type ShipmentOrderFetchResponse = FetchResponse<operations['createOrders'], ShipmentOrderResponse, 'application/problem+json'>;
type ShipmentOrderStatus = components['schemas']['LabelDataResponse']['status']
type ShippingConditions = components['schemas']['Shipment']['customs']['shippingConditions'];
type CountryCode = components['schemas']['Country'];
type ExportType = components['schemas']['Shipment']['customs']['exportType'];
type VAS = components['schemas']['VAS'];

const isShipmentOrderStatus = (
  status: ShipmentOrderStatus | any
): status is ShipmentOrderStatus => (
  !Number.isInteger(status)
  && Number.isInteger(status?.statusCode)
);

const parseFlag = (att: Attribute) => att.id && att?.value?.toString() !== 'false';
const VASParser: any = {
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

const VASdummy: VAS = {
  additionalInsurance: {
    currency: 'EUR',
    value: 0.0,
  },
  bulkyGoods: false,
  cashOnDelivery: {
    accountReference: '',
    amount: {
      currency: 'EUR',
      value: 0.0,
    },
    bankAccount: {
      accountHolder: '',
      iban: '',
      bankName: '',
      bic: '',
    },
    transferNote1: '',
    transferNote2: '',
  },
  closestDropPoint: false,
  dhlRetoure: {
    billingNumber: '',
    refNo: '',
    returnAddress: {
      addressStreet: '',
      city: '',
      country: 'DEU',
      additionalAddressInformation1: '',
      additionalAddressInformation2: '',
      addressHouse: '',
      contactName: '',
      dispatchingInformation: '',
      email: '',
      name1: '',
      name2: '',
      name3: '',
      phone: '',
      postalCode: '',
      state: '',
    }
  },
  endorsement: 'RETURN',
  identCheck: {
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    minimumAge: 'A16',
  },
  individualSenderRequirement: '',
  namedPersonOnly: false,
  noNeighbourDelivery: false,
  parcelOutletRouting: '',
  postalDeliveryDutyPaid: false,
  preferredDay: '',
  preferredLocation: '',
  preferredNeighbour: '',
  premium: false,
  signedForByRecipient: false,
  visualCheckOfAge: 'A16',
};

const join = (...args: string[]) => args.join(':');

export class DHLRest extends Stub {
  protected readonly courier_defaults: Courier;
  protected readonly client: Client<paths>;

  protected readonly urns = {
    dhl_accountNumber: 'urn:restorecommerce:fulfillment:attribute:dhl:accountNumber',
    dhl_billingNumber: 'urn:restorecommerce:fulfillment:attribute:dhl:billingNumber',
    dhl_costCenter: 'urn:restorecommerce:fulfillment:attribute:dhl:costCenter',
  
    dhl_courier_profile: 'urn:restorecommerce:fulfillment:courier:attribute:dhl:profile',
    dhl_courier_accountNumber: 'urn:restorecommerce:fulfillment:courier:attribute:dhl:accountNumber',
    dhl_courier_billingNumber: 'urn:restorecommerce:fulfillment:courier:attribute:dhl:billingNumber',
    dhl_courier_costCenter: 'urn:restorecommerce:fulfillment:courier:attribute:dhl:costCenter',
  
    dhl_product_accountNumber: 'urn:restorecommerce:fulfillment:product:attribute:dhl:accountNumber',
    dhl_product_billingNumber: 'urn:restorecommerce:fulfillment:product:attribute:dhl:billingNumber',
    dhl_product_costCenter: 'urn:restorecommerce:fulfillment:product:attribute:dhl:costCenter',
    dhl_product_service: 'urn:restorecommerce:fulfillment:product:attribute:dhl:service',
    dhl_product_productName: 'urn:restorecommerce:fulfillment:product:attribute:dhl:productName',
    dhl_product_roundWeightUp: 'urn:restorecommerce:fulfillment:product:attribute:dhl:roundWeightUp',
    dhl_product_stepPrice: 'urn:restorecommerce:fulfillment:product:attribute:dhl:stepPrice',
    dhl_product_stepWeight: 'urn:restorecommerce:fulfillment:product:attribute:dhl:stepWeightInKg',
    dhl_product_premium: 'urn:restorecommerce:fulfillment:product:attribute:dhl:service',
  };
  
  protected readonly config = {
    baseUrl: 'https://api-sandbox.dhl.com/parcel/de/shipping/v2',
    profile: 'STANDARD_GRUPPENPROFIL',
    costCenter: undefined as string,
    billingNumber: undefined as string,
    accountNumber: undefined as string,
    productName: undefined as string,
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

  constructor(courier?: Courier, cfg?: ServiceConfig, logger?: Logger) {
    super(courier, cfg, logger);
    this.courier_defaults = Object.values(this.cfg?.get('defaults:Couriers') as Courier[])?.find(
      c => c.id === courier.id
    ) ?? Object.values(this.cfg?.get('defaults:Couriers') as Courier[])?.find(
      c => c.api === courier?.api
        || c.stub_type === courier?.stub_type
        || c.api === this.type
        || c.stub_type === this.type
    );

    this.config = {
      ...this.config,
      ...this.courier_defaults?.configuration?.value
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

    this.client = createClient({ baseUrl: this.config.baseUrl });
  }

  public async calcGross(
    product: Variant,
    pack: Package
  ): Promise<BigNumber> {
    try{
      const step_weight = Number.parseFloat(
        product.attributes.find(attr => attr.id === this.urns.dhl_product_stepWeight)?.value ?? '1'
      );
      const step_price = Number.parseFloat(
        product.attributes.find(attr => attr.id === this.urns.dhl_product_stepPrice)?.value ?? '1'
      );
      const precision = Number.parseInt(
        product.attributes.find(attr => attr.id === this.urns.dhl_product_stepPrice)?.value ?? '3'
      );
      const price = new BigNumber(
        pack.weight_in_kg / step_weight * step_price
      ).plus(
        product.price.sale ? product.price.sale_price : product.price.regular_price
      ).decimalPlaces(
        precision, BigNumber.ROUND_UP
      );
      if (price.isNaN()) {
        throw 'NaN detected!'
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
      (att: Attribute) => att.id?.startsWith(this.urns.dhl_product_service)
    )
    if (!attributes?.length) {
      return undefined;
    }

    const sc = new ServiceConfig() as Provider & ServiceConfig;
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
    product: FulfillmentProduct,
    credential: Credential,
  ): string {
    const payload = unmarshallProtobufAny(credential?.credentials);

    return (
      payload?.billingNumber
      ?? payload?.accountNumber
      ?? product.attributes?.find(
        a => [
          this.urns.dhl_product_costCenter,
          this.urns.dhl_costCenter
        ].includes(a.id)
      )?.value
      ?? this.config.billingNumber
      ?? this.config.accountNumber
    );
  } 

  protected getCostCenter(product: FulfillmentProduct): string {
    return product.attributes?.find(
      a => [
        this.urns.dhl_product_costCenter,
        this.urns.dhl_costCenter
      ].includes(a.id)
    )?.value ?? this.config.costCenter;
  }

  protected getProductName(product: FulfillmentProduct): string {
    return product.attributes?.find(
      a => a.id === this.urns.dhl_product_productName
    )?.value ?? this.config.productName;
  } 

  protected fulfillment2ShipmentOrder(fulfillments: FlatAggregatedFulfillment[]): ShipmentOrderRequest {
    return {
      profile: this.config.profile ?? 'STANDARD_GRUPPENPROFIL',
      shipments: fulfillments.map(
        f => {
          const options = unmarshallProtobufAny(f.options);
          const sender = f.payload.packaging.sender;
          const recipient = f.payload.packaging.recipient;
          
          return {
            billingNumber: this.getBillingNumber(f.credential, f.product),
            costCenter: this.getCostCenter(f.product),
            refNo: f.payload.id,
            shipper: {
              name1: [
                sender.address.residential_address?.title,
                sender.address.residential_address?.given_name,
                sender.address.residential_address?.mid_name,
                sender.address.residential_address?.family_name,
                sender.address.business_address?.name,
              ].filter(s => s).join(' '),
              name2: sender.address.address_addition.field1,
              name3: sender.address.address_addition.field2,
              addressStreet: [
                sender.address.street,
                sender.address.building_number,
              ].join(' '),
              postalCode: sender.address.postcode,
              city: sender.address.region,
              country: f.sender_country.country_code as CountryCode,
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
              name2: recipient.address.address_addition.field1,
              name3: recipient.address.address_addition.field2,
              addressStreet: [
                recipient.address.street,
                recipient.address.building_number,
              ].join(' '),
              postalCode: recipient.address.postcode,
              city: recipient.address.region,
              country: f.recipient_country.country_code as CountryCode,
              email: recipient.contact.email,
            },
            product: this.getProductName(f.product),
            shipDate: new Date().toISOString(),
            details: {
              weight: {
                uom: 'kg',
                value: f.parcel.package.weight_in_kg
              }
            },
            services: this.getServices(f.product.attributes),
            customs: options.customs ? {
              exportType: (f.payload.packaging.export_type ?? 'COMMERCIAL_GOODS') as ExportType,
              exportDescription: options.customs?.exportDescription ?? f.payload.packaging.export_description,
              items: f.parcel.items.map(item => ({
                itemDescription: item.product_id,
                itemValue: {
                  currency: 'EUR',
                  value: 0.0,
                },
                itemWeight: {
                  uom: 'kg',
                  value: item.package.weight_in_kg
                },
                packagedQuantity: item.quantity,
                countryOfOrigin: f.sender_country.country_code as CountryCode,
                hsCode: '',
              })),
              postalCharges: options.customs.postalCharges,
              consigneeCustomsRef: options.customs.consigneeCustomsRef ?? f.payload.customer_id,
              shipperCustomsRef: options.customs.shipperCustomsRef ?? f.payload.shop_id,
              hasElectronicExportNotification: options.customs.hasElectronicExportNotification,
              MRN: options.customs.MRN,
              officeOfOrigin: f.sender_country.country_code as CountryCode,
              permitNo: options.customs.permitNo,
              attestationNo: options.customs?.attestationNo,
              invoiceNo: options.customs.invoiceNo,
              shippingConditions: options.customs.shippingConditions as ShippingConditions,
            } : undefined,
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
      throw new OperationStatusError(
        status.statusCode,
        [
          status.title,
          status.instance,
          status.detail,
        ].filter(s => s).join(),
      ); 
    }
    else if (Number.isInteger(status) && status >= 300) {
      const text = await response.response.text();
      throw new OperationStatusError(
        status,
        text ?? 'Unknown Error!',
      );
    }
    else if (response.data) {
      const response_map = new Map(
        response.data.items?.map(
          item => [
            item.shipmentRefNo,
            item,
          ]
        )
      );
      for (const fulfillment of fulfillments) {
        const item = response_map.get(fulfillment.payload.id);
        const status = {
          id: fulfillment.payload.id,
          code: item.sstatus?.statusCode,
          mesage: [
            item.sstatus?.title,
            item.sstatus?.instance,
            item.sstatus?.detail,
          ].join(),
        };
        fulfillment.labels ??= [];
        fulfillment.labels.push(
          {
            parcel_id: fulfillment.parcel.id,
            shipment_number: item.shipmentNo,
            state: FulfillmentState.SUBMITTED,
            url: item.label?.url,
            status,
          } as Label
        );
        if (fulfillment.status?.code < status.code) {
          fulfillment.status = status;
        }
      }
    }
    else {
      // Ops, how did we get here???
      throw new OperationStatusError(
        500,
        'Unknown Error!',
      );
    }
    return fulfillments;
  }

  protected override async evaluateImpl(
    fulfillments: FlatAggregatedFulfillment[]
  ): Promise<FlatAggregatedFulfillment[]> {
    const body = this.fulfillment2ShipmentOrder(fulfillments);
    const response = await this.client.POST(
      '/orders', 
      {
        body,
        query: {
          combine: false,
          docFormat: "PDF",
          includeDocs: "URL",
          mustEncode: true,
          printFormat: "A4",
          retourePrintFormat: "A4",
          validate: true,
        }
      }
    );
    return await this.shipmentOrder2fulfillment(fulfillments, response);
  }

  protected override async submitImpl(
    fulfillments: FlatAggregatedFulfillment[]
  ): Promise<FlatAggregatedFulfillment[]> {
    const body = this.fulfillment2ShipmentOrder(fulfillments);
    const response = await this.client.POST(
      '/orders',
      {
        body,
        query: {
          combine: false,
          docFormat: "PDF",
          includeDocs: "URL",
          mustEncode: false,
          printFormat: "A4",
          retourePrintFormat: "A4",
          validate: false,
        }
      }
    );
    return await this.shipmentOrder2fulfillment(fulfillments, response);
  }

  protected override async trackImpl(
    fulfillments: FlatAggregatedFulfillment[]
  ): Promise<FlatAggregatedFulfillment[]> {
    return fulfillments;
  }

  protected override async cancelImpl(
    fulfillments: FlatAggregatedFulfillment[]
  ): Promise<FlatAggregatedFulfillment[]> {
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
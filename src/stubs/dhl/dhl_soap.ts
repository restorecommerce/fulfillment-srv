import * as soap from 'soap';
import { xml2js, js2xml } from 'xml-js';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
import { type Logger } from '@restorecommerce/logger';
import { type ServiceConfig } from '@restorecommerce/service-config';
import {
  Event,
  Label,
  FulfillmentState,
  Tracking,
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/fulfillment.js';
import {
  FulfillmentCourier as Courier
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/fulfillment_courier.js';
import {
  Credential
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/credential.js';
import {
  AggregatedFulfillmentListResponse,
  FlatAggregatedFulfillment,
  throwOperationStatusCode,
  unique,
  unmarshallProtobufAny,
} from '../../utils.js';
import { Stub } from '../../stub.js';
import {
  FulfillmentProduct,
  FulfillmentSolutionQuery,
  Variant
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/fulfillment_product.js';
import { BigNumber } from 'bignumber.js';
import { Package } from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/product.js';
import { Attribute } from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/attribute.js';

dayjs.extend(customParseFormat);

interface Origin
{
  'cis:country': string;
  'cis:countryISOCode': string;
}

interface Communication
{
  'cis:phone'?: string;
  'cis:email'?: string;
  'cis:contactPerson'?: string;
}

interface Shipper
{
  Name: {
    'cis:name1': string;
    'cis:name2'?: string;
    'cis:name3'?: string;
  };
  Address: {
    'cis:streetName': string;
    'cis:streetNumber': string;
    'cis:zip': string;
    'cis:city': string;
    'cis:Origin': Origin;
  };
  Communication: Communication;
}

interface Receiver
{
  name1: string;
  Address: {
    name2?: string;
    name3?: string;
    'cis:streetName': string;
    'cis:streetNumber': string;
    'cis:zip': string;
    'cis:city': string;
    'cis:Origin': Origin;
  };
  Communication: Communication;
}

interface ShipmentItem
{
  weightInKG: number;
  lengthInCM: number;
  widthInCM: number;
  heightInCM: number;
}

interface ShipmentDetails
{
  shipmentDate: string;
  product: string;
  accountNumber: string;
  ShipmentItem: ShipmentItem;
  customerReference?: string;
  costCenter?: string;
  Service?: any;
  Notification?: {
    recipientEmailAddress?: string;
  };
}

interface Shipment
{
  ShipmentDetails: ShipmentDetails;
  Shipper: Shipper;
  Receiver: Receiver;
  PrintOnlyIfCodeable?: {
    attributes: {
      active: 1;
    };
  };
}

interface ShipmentOrder
{
  sequenceNumber?: number;
  Shipment: Shipment;
}

interface ShipmentOrderRequest
{
  Version: {
    majorRelease: number;
    minorRelease: number;
  };
  ShipmentOrder: ShipmentOrder[];
}

interface ShipmentCancelRequest
{
  Version: {
    majorRelease: number;
    minorRelease: number;
  };
  shipmentNumber: string[];
}

interface Config
{
  ordering?: {
    wsdl?: string,
    version?: number[],
    endpoint?: string,
    username?: string,
    password?: string,
    access_token?: string,
    account_number?: string,
    wsdl_header?: {
      Authentification?: {
        user?: string,
        signature?: string,
      },
    },
  },
  tracking?: {
    version?: number[],
    appname?: string,
    endpoint?: string,
    username?: string,
    password?: string,
    secret?: string,
  },
}

const DHLEvent2FulfillmentEvent = (attributes: any): Event => ({
  timestamp: dayjs(attributes['event-timestamp'], 'DD.MM.YYYY HH:mm').toDate(),
  location: attributes['event-location'],
  details: {
    type_url: null,
    value: Buffer.from(JSON.stringify(attributes)),
  },
  status: {
    id: attributes['event-short-status'],
    // TODO: parse DHL event codes
    // code: attributes['standard-event-code'],
    code: 200,
    message: attributes['event-text']
  }
});

export const DHLTracking2FulfillmentTracking = async (
  fulfillment: FlatAggregatedFulfillment,
  response: Response,
  error?: any
): Promise<FlatAggregatedFulfillment> => {
  if (error) {
    fulfillment.trackings = [{
      shipment_number: fulfillment.labels[0].shipment_number,
      events: null,
      details: null,
      status: {
        id: fulfillment.payload.id,
        code: error?.code ?? 500,
        message: error?.message ?? error.details ?? error?.msg ?? JSON.stringify(error, null, 2)
      }
    }];
  }
  else if (response?.status !== 200) {
    fulfillment.trackings = [{
      shipment_number: fulfillment.labels[0].shipment_number,
      events: null,
      details: null,
      status: {
        id: fulfillment.payload.id,
        code: response?.status ?? 500,
        message: await response.text().catch(() => response?.statusText) ?? 'Unknown Error!',
      }
    }];
  }
  else {
    fulfillment.trackings = [await response.text().then(
      (text: string): Tracking => {
        const response = xml2js(text);
        if (response?.elements?.[0]?.attributes?.code === '0') {
          const status = {
            id: fulfillment.payload.id,
            code: 200,
            message: response.elements[0].attributes.error ?? response.elements[0].elements[0].attributes.status
          };
          fulfillment.labels[0].state = response.elements[0].elements[0].attributes['delivery-event-flag'] ? FulfillmentState.COMPLETE : FulfillmentState.IN_TRANSIT;
          fulfillment.labels[0].status = status;
          fulfillment.payload.fulfillment_state = fulfillment.labels[0].state;
          return {
            shipment_number: fulfillment.labels[0].shipment_number,
            events: response.elements[0].elements[0].elements[0].elements.map((element: any) => DHLEvent2FulfillmentEvent(element.attributes)),
            details: {
              type_url: null,
              value: Buffer.from(JSON.stringify(response.elements[0].elements[0].attributes))
            },
            status
          };
        }
        else {
          return {
            shipment_number: fulfillment.labels[0].shipment_number,
            events: null,
            details: null,
            status: {
              id: fulfillment.payload.id,
              code: response?.elements?.[0]?.attributes?.code ?? 500,
              message: response?.elements?.[0]?.attributes?.error ?? 'Error Unknown!'
            }
          };
        }
      },
      (err: any): Tracking => {
        return {
          shipment_number: fulfillment.labels[0].shipment_number,
          events: null,
          details: null,
          status: {
            id: fulfillment.payload.id,
            code: err?.code ?? 500,
            message: err?.message ?? err?.msg ?? err?.details ?? JSON.stringify(err, null, 2)
          }
        };
      }
    )];
  }

  fulfillment.status = fulfillment.trackings[0].status;
  return fulfillment;
};

const DHLShipmentCancelResponse2AggregatedFulfillment = (
  fulfillment_map: {[k: string]: FlatAggregatedFulfillment},
  response: any,
  err?: any
): FlatAggregatedFulfillment[] => {
  if (err) {
    return Object.values(fulfillment_map).map(fulfillment => {
      const status = {
        id: fulfillment.payload.id,
        code: err.code ?? err.statusCode ?? 500,
        message: err.message ?? err.statusText ?? JSON.stringify(err)
      };
      fulfillment.labels[0].status = status;
      fulfillment.status = status;
      return fulfillment;
    });
  }

  return response.DeletionFulfillmentState.map((state: any) => {
    const fulfillment = fulfillment_map[state.shipmentNumber];
    fulfillment.labels[0].state = state.Status.statusCode == 0 ? FulfillmentState.CANCELLED : fulfillment.labels[0].state;
    const status = {
      id: fulfillment.payload.id,
      code: state.Status.statusCode,
      message: state.Status.statusText
    };
    fulfillment.labels[0].status = status;
    fulfillment.status = status;
    return fulfillment;
  });
};

export class DHLSoap extends Stub {
  public readonly version: number[];
  protected readonly courier_defaults: Courier;
  protected readonly configuration_defaults: any;
  private _stub_config: Config;
  private _soap_client: soap.Client;

  protected readonly urns = {
    dhl_product_service: 'urn:restorecommerce:fulfillment:product:attribute:dhl:service',
    dhl_product_productName: 'urn:restorecommerce:fulfillment:product:attribute:dhl:productName',
    dhl_product_accountNumber: 'urn:restorecommerce:fulfillment:product:attribute:dhl:accountNumber',
    dhl_product_roundWeightUp: 'urn:restorecommerce:fulfillment:product:attribute:dhl:roundWeightUp',
    dhl_product_stepPrice: 'urn:restorecommerce:fulfillment:product:attribute:dhl:stepPrice',
    dhl_product_stepWeight: 'urn:restorecommerce:fulfillment:product:attribute:dhl:stepWeightInKg',
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
    return 'DHLSoap';
  }

  get stub_config(): Config {
    return this._stub_config;
  }

  constructor(courier?: Courier, cfg?: ServiceConfig, logger?: Logger) {
    super(courier, cfg, logger);
    this.courier_defaults = Object.values(cfg?.get('defaults:Couriers') as Courier[])?.find(
      c => c.id === courier.id
    ) ?? Object.values(this.cfg?.get('defaults:Couriers') as Courier[])?.find(
      c => c.api === courier?.api
        || c.api === this.type
    );
    this.configuration_defaults = this.courier_defaults?.configuration?.value;
    this.version = this.configuration_defaults?.ordering?.version ?? [3, 4, 0];

    this.status_codes = {
      ...this.status_codes,
      ...cfg?.get('statusCodes'),
    };

    this.operation_status_codes = {
      ...this.operation_status_codes,
      ...cfg?.get('operationStatusCodes'),
    };

    this.urns = {
      ...this.urns,
      ...cfg?.get('urns'),
      ...cfg?.get('urns:authentication'),
    };
  }

  public async calcGross(
    product: Variant,
    pack: Package,
    precision = 2,
  ): Promise<BigNumber> {
    try{
      const step_weight = Number.parseFloat(
        product.attributes.find(attr => attr.id === this.urns.dhl_product_stepWeight)?.value ?? '1'
      );
      const step_price = Number.parseFloat(
        product.attributes.find(attr => attr.id === this.urns.dhl_product_stepPrice)?.value ?? '1'
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

  protected parseService (attributes: Attribute[]) {
    return attributes?.filter((att: Attribute) =>
      att.id?.startsWith(this.urns.dhl_product_service)
    ).map(att=> ({
      [att.value]: {
        attributes: Object.assign(
          {
            active: '1',
          },
          ...(att.attributes?.map(
            att=> ({[att.id]: att.value})
          ) ?? [])
        )
      }
    }));
  }

  protected DHLCode2StatusCode(
    code: number,
    id: string,
    details?: string
  ) {
    switch (code) {
      case 0: return this.createStatusCode(
        'Fulfillment',
        id,
        this.status_codes.OK,
        details,
      );
      case 1101: return this.createStatusCode(
        'Fulfillment',
        id,
        this.status_codes.INVALID_ADDRESS,
        details,
      );
      case 207: return this.createStatusCode(
        'Fulfillment',
        id,
        this.status_codes.WEAK_ERROR,
        details,
      );
      default: return this.createStatusCode(
        'Fulfillment',
        id,
        this.status_codes.UNKNOWN_ERROR,
        details,
      );
    }
  }

  protected DHLResponse2FulfillmentResponses (
    fulfillments: FlatAggregatedFulfillment[],
    response: any,
    error: any,
  ): FlatAggregatedFulfillment[] {
    if (error) {
      if (response?.html) {
        this.logger?.error(`${this.type}: ${response.html.head?.title}`, response);
        if (response.html.head?.title?.startsWith('401')) {
          throwOperationStatusCode(
            this.operation_status_codes.UNAUTHORIZED,
            this.courier?.id,
          );
        }
        else {
          throwOperationStatusCode(
            {
              code: 500,
              message: response.html.head?.title
            },
            this.courier?.id,
          );
        }
      }
      else {
        const message = error?.root?.Envelope?.Body?.Fault?.faultstring
          ?? error?.response?.statusText
          ?? error?.toString()
          ?? 'Server Error!';
        this.logger?.error(`${this.type}: ${message}`);
        throwOperationStatusCode(
          {
            code: error?.response?.status ?? 500,
            message
          },
          'Fulfillment',
        );
      }
    }
    else if (response?.html) {
      this.logger?.error(`${this.type}: ${response.html}`);
      throwOperationStatusCode(
        {
          code: response?.statusCode,
          message: response?.html
        },
        'Fulfillment',
      );
    }
    else if (!response) {
      throwOperationStatusCode(
        {
          code: 500,
          message: 'Unexpected Error: No Response!',
        },
        'Fulfillment',
      );
    }

    if (response?.CreationState) {
      return fulfillments.map((fulfillment, i) => {
        const dhl_state = response.CreationState.find((state: any) => state.sequenceNumber === (i + 1).toString());
        const weak = dhl_state?.Status?.statusText?.startsWith('Weak');
        const code = weak ? 207 : dhl_state?.LabelData?.Status?.statusCode;
        const state = code === 0 ? FulfillmentState.SUBMITTED : FulfillmentState.INVALID;
        const status = this.DHLCode2StatusCode(
          code,
          fulfillment.payload?.id,
          dhl_state?.LabelData?.Status?.statusMessage ?? dhl_state?.Status?.statusText,
        );

        if (state === FulfillmentState.INVALID) {
          fulfillment.payload.fulfillment_state = state;
          fulfillment.status = status;
          return fulfillment;
        }

        const label: Label = {
          parcel_id: fulfillment.parcel.id,
          shipment_number: dhl_state?.shipmentNumber,
          file: {
            url: dhl_state?.LabelData.labelUrl,
            content_type: 'application/pdf',
          },
          state,
          status,
        };

        fulfillment.payload.fulfillment_state = state;
        fulfillment.labels = [label];
        fulfillment.status = status;
        return fulfillment;
      });
    }
    else if (response?.ValidationState) {
      return fulfillments.map((fulfillment, i) => {
        const dhl_state = response.ValidationState.find((state: any) => state.sequenceNumber === (i + 1).toString());
        const weak = dhl_state?.Status?.statusText?.startsWith('Weak');
        const code = weak ? 207 : dhl_state?.Status?.statusCode;
        const status = this.DHLCode2StatusCode(
          code,
          fulfillment.payload?.id,
          dhl_state?.Status?.statusMessage ?? dhl_state?.Status?.statusText,
        );

        if (code !== 0 ) {
          fulfillment.payload.fulfillment_state = FulfillmentState.INVALID;
        }

        this.logger?.debug('DHLSoap Evaluation:', status);
        fulfillment.status = status;
        return fulfillment;
      });
    }
    if (response?.Status) {
      if (response?.Status?.statusCode !== 0) {
        const message = response?.Status?.statusMessage ?? response?.Status?.statusText ?? JSON.stringify(response);
        this.logger?.error(`${this.type}: ${message}`);
        throwOperationStatusCode(
          {
            code: response.Status?.statusCode,
            message
          },
          'Fulfillment',
        );
      }
    }
    else {
      throwOperationStatusCode(
        this.operation_status_codes.UNKNOWN_RESPONSE,
        this.type,
        JSON.stringify(response)
      );
    }
  }

  protected AggregatedFulfillmentRequests2DHLShipmentOrderRequest(
    requests: FlatAggregatedFulfillment[],
    aggregation: AggregatedFulfillmentListResponse,
  ): ShipmentOrderRequest {
    const shipment_order_request = {
      Version: {
        majorRelease: this.version[0],
        minorRelease: this.version[1],
      },
      ShipmentOrder: requests.map((request, i): ShipmentOrder => {
        const sender_country = aggregation.countries.get(request.payload.packaging.sender.address.country_id);
        const recipient_country = aggregation.countries.get(request.payload.packaging.recipient.address.country_id);
        const packaging = request.payload.packaging;
        const variant = {
          ...(request.product.variants?.find(
            v => request.parcel.variant_id.includes(v.id)
          ) ?? {})
        }
        variant.attributes = unique([
          ...(request.product.attributes ?? []),
          ...(variant.attributes ?? []),
        ]);
        return {
          sequenceNumber: i + 1,
          Shipment: {
            Shipper: {
              Name: {
                'cis:name1': [
                  packaging.sender.address.residential_address?.title,
                  packaging.sender.address.residential_address?.given_name,
                  packaging.sender.address.residential_address?.mid_name,
                  packaging.sender.address.residential_address?.family_name,
                  packaging.sender.address.business_address?.name
                ].filter(s => s).join(' '),
                'cis:name2': packaging.sender.address.address_addition?.field1,
                'cis:name3': packaging.sender.address.address_addition?.field2,
              },
              Address: {
                'cis:streetName': packaging.sender.address?.street,
                'cis:streetNumber': packaging.sender.address?.building_number,
                'cis:zip': packaging.sender.address?.postcode,
                'cis:city': packaging.sender.address?.region,
                'cis:Origin': {
                  'cis:country': sender_country?.name,
                  'cis:countryISOCode': sender_country?.country_code
                }
              },
              Communication: {
                'cis:contactPerson': packaging.sender?.contact?.name,
                'cis:email': packaging.sender?.contact.email,
                'cis:phone': packaging.sender?.contact.phone,
              }
            },
            Receiver: {
              name1: [
                packaging.recipient.address.residential_address?.title,
                packaging.recipient.address.residential_address?.given_name,
                packaging.recipient.address.residential_address?.mid_name,
                packaging.recipient.address.residential_address?.family_name,
                packaging.recipient.address.business_address?.name
              ].filter(s => s).join(' '),
              Address: {
                name2: packaging.recipient.address.address_addition?.field1,
                name3: packaging.recipient.address.address_addition?.field2,
                'cis:streetName': packaging.recipient.address?.street,
                'cis:streetNumber': packaging.recipient.address?.building_number,
                'cis:zip': packaging.recipient.address?.postcode,
                'cis:city': packaging.recipient.address?.region,
                'cis:Origin': {
                  'cis:country': recipient_country?.name,
                  'cis:countryISOCode': recipient_country?.country_code
                },
              },
              Communication: {
                'cis:contactPerson': packaging.recipient.contact?.name,
                'cis:email': packaging.recipient.contact?.email,
                'cis:phone': packaging.recipient.contact?.phone,
              }
            },
            ShipmentDetails: {
              shipmentDate: new Date().toISOString().slice(0,10),
              costCenter: '',
              customerReference: request.payload.id,
              product: variant.attributes.find(
                att => att.id === this.urns.dhl_product_productName
              )?.value,
              accountNumber: variant.attributes.find(
                att => att.id === this.urns.dhl_product_accountNumber
              )?.value ?? this.stub_config?.ordering?.account_number,
              Service: this.parseService(variant.attributes),
              ShipmentItem: {
                heightInCM: request.parcel.package.size_in_cm.height,
                lengthInCM: request.parcel.package.size_in_cm.length,
                widthInCM: request.parcel.package.size_in_cm.width,
                weightInKG: request.parcel.package.weight_in_kg,
              },
            }
          }
        };
      })
    };
    this.logger?.debug('ShipmentOrderRequest', shipment_order_request);
    return shipment_order_request;
  }

  protected AggregatedFulfillment2DHLShipmentCancelRequest(
    requests: FlatAggregatedFulfillment[]
  ): ShipmentCancelRequest{
    return {
      Version: {
        majorRelease: this.version[0],
        minorRelease: this.version[1]
      },
      shipmentNumber: requests.map(request => request.labels[0].shipment_number)
    };
  }

  async getSoapClient(credential?: Credential): Promise<soap.Client> {
    if (this._soap_client) {
      return this._soap_client;
    }

    try{
      const config = this._stub_config = {
        ordering: {
          ...this.configuration_defaults?.ordering,
          ...unmarshallProtobufAny(this.courier?.configuration)?.ordering,
          ...credential
              ? {
                  username: credential?.user,
                  password: credential?.pass,
                } 
              : {},
          ...unmarshallProtobufAny(credential?.credentials)?.ordering,
        }
      };
      
      this.logger?.debug('Create SOAP Client with:', config);
      this._soap_client = await soap.createClientAsync(config.ordering.wsdl).then(
        client => {
          client.setEndpoint(config.ordering.endpoint);
          client.addSoapHeader(
            typeof(config.ordering.wsdl_header) === 'string'
              ? JSON.parse(config.ordering.wsdl_header)
              : config.ordering.wsdl_header
          );

          if (config.ordering?.username && config.ordering?.password) {
            client.setSecurity(new soap.BasicAuthSecurity(
              config.ordering.username,
              config.ordering.password,
            ));
          }

          if (config.ordering?.access_token) {
            client.addHttpHeader('Authorization', `Bearer ${config.ordering.access_token}`);
          }
          return client;
        }
      );
    }
    catch (err) {
      this.logger?.error(`${this.type}:\t Failed to create Client!`);
      this.logger?.error(`${this.type}:\t`, err);
      throw err;
    }
    return this._soap_client;
  };

  protected async soapCall(
    funcName: string,
    fulfillments: FlatAggregatedFulfillment[],
    aggregation: AggregatedFulfillmentListResponse,
  ): Promise<FlatAggregatedFulfillment[]> {
    if (fulfillments.length === 0) {
      return []
    };
    const credential = aggregation.credentials.get(this.courier.credential_id);
    return await this.getSoapClient(credential).then(
      client => new Promise<FlatAggregatedFulfillment[]>(
        (resolve, reject): void => {
          const timer = setTimeout(reject, 30000, this.operation_status_codes.TIMEOUT);
          client.GVAPI_2_0_de.GKVAPISOAP11port0[funcName](
            this.AggregatedFulfillmentRequests2DHLShipmentOrderRequest(
              fulfillments,
              aggregation,
            ),
            (error: any, result: any): any => {
              try {
                clearTimeout(timer);
                resolve(this.DHLResponse2FulfillmentResponses(fulfillments, result, error));
              }
              catch (e: any) {
                reject(e);
              }
            }
          )
        }
      )
    );
  }

  protected override async evaluateImpl (
    fulfillments: FlatAggregatedFulfillment[],
    aggregation: AggregatedFulfillmentListResponse,
  ): Promise<FlatAggregatedFulfillment[]> {
    return await this.soapCall('validateShipment', fulfillments, aggregation);
  }

  protected override async submitImpl (
    fulfillments: FlatAggregatedFulfillment[],
    aggregation: AggregatedFulfillmentListResponse,
  ): Promise<FlatAggregatedFulfillment[]> {
    return await this.soapCall('createShipmentOrder', fulfillments, aggregation);
  }

  protected override async cancelImpl (
    fulfillments: FlatAggregatedFulfillment[],
    aggregation: AggregatedFulfillmentListResponse,
  ): Promise<FlatAggregatedFulfillment[]> {
    return await this.soapCall('deleteShipmentOrder', fulfillments, aggregation);
  };

  protected override async trackImpl (
    fulfillments: FlatAggregatedFulfillment[],
    aggregation: AggregatedFulfillmentListResponse,
  ): Promise<FlatAggregatedFulfillment[]> {
    const credential = aggregation.credentials.get(this.courier.credential_id);
    const promises = fulfillments.map(async item => {
      try {
        const courier = this.courier;
        const options = unmarshallProtobufAny(item?.options);
        const config: Config = {
          tracking: {
            ...this.configuration_defaults?.tracking,
            ...unmarshallProtobufAny(courier?.configuration)?.tracking,
            ...credential
              ? {
                  username: credential?.user,
                  password: credential?.pass,
                } 
              : {},
            ...unmarshallProtobufAny(credential?.credentials)?.tracking,
          }
        };

        const auth = 'Basic ' + Buffer.from(`${config.tracking.username}:${config.tracking.password}`).toString('base64');
        const attributes = {
          appname: config.tracking.appname,
          password: config.tracking.secret,
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

        return await fetch(`${config.tracking.endpoint}?${params}`, payload).then(
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

  async matchesZone(
    product: FulfillmentProduct,
    query: FulfillmentSolutionQuery,
    helper: any,
  ): Promise<boolean> {
    return false;
  }
};
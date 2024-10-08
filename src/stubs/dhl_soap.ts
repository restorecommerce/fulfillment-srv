import * as soap from 'soap';
import { xml2js, js2xml } from 'xml-js';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
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
import { OperationStatus, Status } from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/status.js';
import {
  FlatAggregatedFulfillment,
  throwOperationStatusCode,
} from '../utils.js';
import { Stub } from '../stub.js';

dayjs.extend(customParseFormat);

type ClientMap = { [id: string]: soap.Client };
type RequestMap = {
  [id: string]: {
    courier: Courier,
    credential: Credential,
    fulfillments: FlatAggregatedFulfillment[],
  }
}

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

const parseService = (attributes: any[]) => attributes.filter((att: any) =>
  att.id.startsWith('urn:restorecommerce:fufs:names:service:attr:dhl')
).map((att: any) => ({
  [att.value]: {
    attributes: Object.assign({}, ...att.attribute.map((att: any) => ({
      [att.id]: att.value
    })))}
}));

const DHLEvent2FulfillmentEvent = (attributes: any): Event => ({
  timestamp: dayjs(attributes['event-timestamp'], 'DD.MM.YYYY HH:mm').toDate(),
  location: attributes['event-location'],
  details: {
    type_url: null,
    value: Buffer.from(JSON.stringify(attributes)),
  },
  status: {
    id: attributes['event-short-status'],
    code: attributes['standard-event-code'],
    message: attributes['event-text']
  }
});

const DHLTracking2FulfillmentTracking = async (
  fulfillment: FlatAggregatedFulfillment,
  response: Response,
  error?: any
): Promise<FlatAggregatedFulfillment> => {
  if (error) {
    fulfillment.tracking = {
      shipment_number: fulfillment.label.shipment_number,
      events: null,
      details: null,
      status: {
        id: fulfillment.payload.id,
        code: error?.code ?? 500,
        message: error?.message ?? error.details ?? error?.msg ?? JSON.stringify(error, null, 2)
      }
    };
  }
  else if (response?.status !== 200) {
    fulfillment.tracking = {
      shipment_number: fulfillment.label.shipment_number,
      events: null,
      details: null,
      status: {
        id: fulfillment.payload.id,
        code: response?.status ?? 500,
        message: await response.text().catch(() => response?.statusText) ?? 'Unknown Error!',
      }
    };
  }
  else {
    fulfillment.tracking = await response.text().then(
      (text: string): Tracking => {
        const response = xml2js(text);
        if (response?.elements?.[0]?.attributes?.code === '0') {
          const status = {
            id: fulfillment.payload.id,
            code: 200,
            message: response.elements[0].attributes.error ?? response.elements[0].elements[0].attributes.status
          };
          fulfillment.label.state = response.elements[0].elements[0].attributes['delivery-event-flag'] ? FulfillmentState.COMPLETED : FulfillmentState.IN_TRANSIT;
          fulfillment.label.status = status;
          fulfillment.payload.fulfillment_state = fulfillment.label.state;
          return {
            shipment_number: fulfillment.label.shipment_number,
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
            shipment_number: fulfillment.label.shipment_number,
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
          shipment_number: fulfillment.label.shipment_number,
          events: null,
          details: null,
          status: {
            id: fulfillment.payload.id,
            code: err?.code ?? 500,
            message: err?.message ?? err?.msg ?? err?.details ?? JSON.stringify(err, null, 2)
          }
        };
      }
    );
  }

  fulfillment.status = fulfillment.tracking.status;
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
      fulfillment.label.status = status;
      fulfillment.status = status;
      return fulfillment;
    });
  }

  return response.DeletionFulfillmentState.map((state: any) => {
    const fulfillment = fulfillment_map[state.shipmentNumber];
    fulfillment.label.state = state.Status.statusCode == 0 ? FulfillmentState.CANCELLED : fulfillment.label.state;
    const status = {
      id: fulfillment.payload.id,
      code: state.Status.statusCode,
      message: state.Status.statusText
    };
    fulfillment.label.status = status;
    fulfillment.status = status;
    return fulfillment;
  });
};

export class DHLSoap extends Stub {
  protected static _clients: ClientMap = {};
  protected readonly stub_defaults: any;
  public readonly version: number[];

  protected readonly status_codes: { [key: string]: Status } = {
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
    INVALID_ADDRESS: {
      id: '',
      code: 400,
      message: '{entity} {id} address invalid! {details}',
    },
    UNKNOWN_ERROR: {
      id: '',
      code: 500,
      message: '{entity} {id} caused unknown error! {details}',
    },
  };

  protected readonly operation_status_codes: { [key: string]: OperationStatus } = {
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
  };

  get clients(): ClientMap {
    return DHLSoap._clients;
  }

  constructor(courier?: Courier, kwargs?: { [key: string]: any }) {
    super(courier, kwargs?.cfg, kwargs?.logger);
    this.stub_defaults = this.cfg?.get(`stubs:${this.type}:${courier?.id}`) ?? this.cfg?.get(`stubs:${this.type}:defaults`);
    this.version = this.stub_defaults?.ordering?.version ?? [3, 4, 0];

    this.status_codes = {
      ...this.status_codes,
      ...this.cfg?.get('statusCodes'),
    };

    this.operation_status_codes = {
      ...this.operation_status_codes,
      ...this.cfg?.get('operationStatusCodes'),
    };
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
      default: return this.createStatusCode(
        'Fulfillment',
        id,
        this.status_codes.UNKOWN_ERROR,
        details,
      );
    }
  }

  protected DHLShipmentLabels2FulfillmentResponses (
    fulfillments: FlatAggregatedFulfillment[],
    response: any,
    error: any,
  ): FlatAggregatedFulfillment[] {
    if (error) {
      if (response?.html) {
        this.logger?.error(`${this.constructor.name}: ${response.html.head.title}`);
        throwOperationStatusCode(
          'Fulfillment',
          {
            code: response.statusCode,
            message: response.html.head.title
          }
        );
      }
      else {
        const message = error?.root?.Envelope?.Body?.Fault?.faultstring
          ?? error?.response?.statusText
          ?? error?.toString()
          ?? 'Server Error!';
        this.logger?.error(`${this.constructor.name}: ${message}`);
        throwOperationStatusCode(
          'Fulfillment',
          {
            code: error?.response?.status ?? 500,
            message
          },
        );
      }
    }
    else if (response?.html) {
      this.logger?.error(`${this.constructor.name}: ${response.html}`);
      throwOperationStatusCode(
        'Fulfillment',
        {
          code: response?.statusCode,
          message: response?.html
        },
      );
    }
    else if (response) {
      if (response?.Status?.statusCode !== 0) {
        const message = JSON.stringify(response, null, 2);
        this.logger?.error(`${this.constructor.name}: ${message}`);
        throwOperationStatusCode(
          'Fulfillment',
          {
            code: response.Status?.statusCode,
            message
          },
        );
      }
    }
    else {
      throwOperationStatusCode(
        'Fulfillment',
        {
          code: 500,
          message: 'Unexpected Error: No Response!',
        }
      );
    }

    return fulfillments.map((fulfillment, i) => {
      const dhl_state = response?.CreationState?.find((state: any) => state.sequenceNumber === (i + 1).toString());
      const code = dhl_state?.LabelData?.Status?.statusCode;
      const state = code === 0 ? FulfillmentState.SUBMITTED : FulfillmentState.INVALID;
      const status = this.DHLCode2StatusCode(
        code,
        fulfillment.payload?.id,
        dhl_state?.LabelData?.Status?.statusMessage,
      );

      if (state === FulfillmentState.INVALID) {
        fulfillment.payload.fulfillment_state = state;
        fulfillment.status = status;
        return fulfillment;
      }

      const label: Label = {
        parcel_id: fulfillment.parcel.id,
        shipment_number: dhl_state?.shipmentNumber,
        url: dhl_state?.LabelData.labelUrl,
        state,
        status,
      };

      fulfillment.payload.fulfillment_state = state;
      fulfillment.label = label;
      fulfillment.status = status;
      return fulfillment;
    });
  }

  protected AggregatedFulfillmentRequests2DHLShipmentOrderRequest(
    requests: FlatAggregatedFulfillment[]
  ): ShipmentOrderRequest {
    return {
      Version: {
        majorRelease: this.version[0],
        minorRelease: this.version[1]
      },
      ShipmentOrder: requests.map((request, i): ShipmentOrder => {
        const packaging = request.payload.packaging;
        return {
          sequenceNumber: i + 1,
          Shipment: {
            Shipper: {
              Name: {
                'cis:name1': packaging.sender.address.residential_address?.family_name ?? packaging.sender.address.business_address?.name,
                'cis:name2': packaging.sender.address.residential_address?.given_name,
                'cis:name3': packaging.sender.address.residential_address?.mid_name,
              },
              Address: {
                'cis:streetName': packaging.sender.address?.street,
                'cis:streetNumber': packaging.sender.address?.building_number,
                'cis:zip': packaging.sender.address?.postcode,
                'cis:city': packaging.sender.address?.region,
                'cis:Origin': {
                  'cis:country': request.sender_country?.name,
                  'cis:countryISOCode': request.sender_country?.country_code
                }
              },
              Communication: {
                'cis:contactPerson': packaging.sender?.contact?.name,
                'cis:email': packaging.sender?.contact.email,
                'cis:phone': packaging.sender?.contact.phone,
              }
            },
            Receiver: {
              name1: packaging.recipient.address.residential_address?.family_name ?? packaging.recipient.address.business_address?.name,
              Address: {
                name2: packaging.recipient.address.residential_address?.given_name,
                name3: packaging.recipient.address.residential_address?.mid_name,
                'cis:streetName': packaging.recipient.address?.street,
                'cis:streetNumber': packaging.recipient.address?.building_number,
                'cis:zip': packaging.recipient.address?.postcode,
                'cis:city': packaging.recipient.address?.region,
                'cis:Origin': {
                  'cis:country': request.recipient_country?.name,
                  'cis:countryISOCode': request.recipient_country?.country_code
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
              product: request.product.attributes.find(att => att.id === this.cfg.get('urns:productName')).value,
              accountNumber: request.product.attributes.find(att => att.id === this.cfg.get('urns:accountNumber')).value,
              // Service: parseService(request.parcel.attributes),
              ShipmentItem: {
                heightInCM: request.parcel.package.size_in_cm.height,
                lengthInCM: request.parcel.package.size_in_cm.length,
                widthInCM: request.parcel.package.size_in_cm.width,
                weightInKG: request.parcel.package.weight_in_kg,
              },
              /* No longer supported!!!
              Notification: {
                recipientEmailAddress: packaging.notify
              }
              */
            }
          }
        };
      })
    };
  }

  protected AggregatedFulfillment2DHLShipmentCancelRequest(
    requests: FlatAggregatedFulfillment[]
  ): ShipmentCancelRequest{
    return {
      Version: {
        majorRelease: this.version[0],
        minorRelease: this.version[1]
      },
      shipmentNumber: requests.map(request => request.label.shipment_number)
    };
  }

  async getSoapClient(courier: Courier, credential: Credential): Promise<soap.Client> {
    this.courier = courier = courier ?? this.courier;
    if (this.clients[courier.id]) {
      return this.clients[courier.id];
    }

    try{
      const config: Config = {
        ordering: {
          ...this.stub_defaults?.ordering,
          ...JSON.parse(courier?.configuration?.value?.toString() ?? null)?.ordering,
          ...credential
              ? {
                  username: credential?.user,
                  password: credential?.pass,
                } 
              : {},
          ...JSON.parse(credential?.credentials?.value?.toString() ?? null)?.ordering,
        }
      };
      
      this.clients[courier.id] = await soap.createClientAsync(config.ordering.wsdl).then(
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
      this.logger?.error(`${this.type}:\n Failed to create Client!`);
      this.logger?.error(`${this.type}: ${JSON.stringify(err, null, 2)}`);
      throw err;
    }
    return this.clients[courier.id];
  };

  protected async soapCall(
    funcName: string,
    fulfillments: FlatAggregatedFulfillment[]
  ): Promise<FlatAggregatedFulfillment[]> {
    if (fulfillments.length === 0) return [];
    const request_map = fulfillments.reduce(
      (a, b) => {
        const c = a[b.courier?.id];
        if (c) {
          c.fulfillments.push(b);
        }
        else if (b.courier?.id) {
          a[b.courier.id] = {
            courier: b.courier,
            credential: b.credential,
            fulfillments: [b],
          };
        }
        return a;
      },
      {} as RequestMap
    );
    return await Promise.all(
      Object.values(request_map).map(
        ({courier, credential, fulfillments}) => this.getSoapClient(courier, credential).then(
          client => new Promise<FlatAggregatedFulfillment[]>(
            (resolve, reject): void => {
              const timer = setTimeout(reject, 30000, this.operation_status_codes.TIMEOUT);
              client.GVAPI_2_0_de.GKVAPISOAP11port0[funcName](
                this.AggregatedFulfillmentRequests2DHLShipmentOrderRequest(fulfillments),
                (error: any, result: any): any => {
                  try {
                    clearTimeout(timer);
                    resolve(this.DHLShipmentLabels2FulfillmentResponses(fulfillments, result, error));
                  }
                  catch (e: any) {
                    reject(e);
                  }
                }
              )
            }
          )
        )
      )
    ).then(
      p => p.flatMap(p => p)
    );
  }

  protected override async evaluateImpl (fulfillments: FlatAggregatedFulfillment[]): Promise<FlatAggregatedFulfillment[]> {
    return await this.soapCall('evaluateShipmentOrder', fulfillments);
  }

  protected override async submitImpl (fulfillments: FlatAggregatedFulfillment[]): Promise<FlatAggregatedFulfillment[]> {
    return await this.soapCall('createShipmentOrder', fulfillments);
  }

  protected override async cancelImpl (fulfillments: FlatAggregatedFulfillment[]): Promise<FlatAggregatedFulfillment[]> {
    return await this.soapCall('deleteShipmentOrder', fulfillments);
  };

  protected override async trackImpl (fulfillments: FlatAggregatedFulfillment[]): Promise<FlatAggregatedFulfillment[]> {
    const promises = fulfillments.map(async item => {
      try {
        const courier = item.courier;
        const credential = item.credential;
        const options = JSON.parse(item?.options?.value?.toString() ?? null);
        const config: Config = {
          tracking: {
            ...this.stub_defaults?.tracking,
            ...JSON.parse(courier?.configuration?.value?.toString() ?? null)?.tracking,
            ...credential
              ? {
                  username: credential?.user,
                  password: credential?.pass,
                } 
              : {},
            ...JSON.parse(credential?.credentials?.value?.toString() ?? null)?.tracking,
          }
        };

        const auth = 'Basic ' + Buffer.from(`${config.tracking.username}:${config.tracking.password}`).toString('base64');
        const attributes = {
          appname: config.tracking.appname,
          password: config.tracking.secret,
          'piece-code': item.label.shipment_number,
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
        return {
          ...item,
          status: {
            id: item.payload.id,
            code: 500,
            message: JSON.stringify(err)
          }
        };
      }
    });

    return await Promise.all(promises);
  };

  async getTariffCode(fulfillment: FlatAggregatedFulfillment): Promise<string> {
    return fulfillment.recipient_country.country_code;
  }
};

Stub.register('DHLSoap', DHLSoap);
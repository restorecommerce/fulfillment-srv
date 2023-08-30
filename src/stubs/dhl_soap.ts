import * as soap from 'soap';
import { xml2js, js2xml } from 'xml-js';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import {
  Event,
  Label,
  State,
  Tracking,
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/fulfillment';
import {
  FulfillmentCourier as Courier
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/fulfillment_courier';
import { OperationStatus, Status } from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/status';
import {
  Stub,
  FlatAggregatedFulfillment,
  throwOperationStatusCode,
} from '..';

dayjs.extend(customParseFormat);

export namespace DHL_Soap
{
  export type ClientMap = { [id: string]: soap.Client };

  interface Origin
  {
    country: string;
    countryISOCode: string;
  }

  interface Communication
  {
    phone?: string;
    email?: string;
    contactPerson?: string;
  }

  interface Shipper
  {
    Name: {
      name1: string;
      name2?: string;
      name3?: string;
    };
    Address: {
      streetName: string;
      streetNumber: string;
      zip: string;
      city: string;
      Origin: Origin;
    };
    Communication: Communication;
  }

  interface Receiver
  {
    name1: string;
    Address: {
      name2?: string;
      name3?: string;
      streetName: string;
      streetNumber: string;
      zip: string;
      city: string;
      Origin: Origin;
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
            fulfillment.label.state = response.elements[0].elements[0].attributes['delivery-event-flag'] ? State.FULFILLED : State.IN_TRANSIT;
            fulfillment.label.status = status;
            fulfillment.payload.state = fulfillment.label.state;
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

    return response.DeletionState.map(state => {
      const fulfillment = fulfillment_map[state.shipmentNumber];
      fulfillment.label.state = state.Status.statusCode == 0 ? State.CANCELLED : fulfillment.label.state;
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

  class DHLSoapStub extends Stub {
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
    };

    get type(): string {
      return this.constructor.name; //'DHLSoapStub';
    }

    get clients(): ClientMap {
      return DHLSoapStub._clients;
    }

    constructor(courier?: Courier, kwargs?: { [key: string]: any }) {
      super(courier, kwargs?.cfg, kwargs?.logger);
      this.stub_defaults = this.cfg?.get(`stubs:DHLSoapStub:${courier?.id}`) ?? this.cfg?.get('stubs:DHLSoapStub:defaults');
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
        const dhl_state = response?.CreationState?.find((state: any) => state.sequenceNumber === i.toString());
        const code = dhl_state?.LabelData.Status.statusCode;
        const state = code === 0 ? State.SUBMITTED : State.INVALID;
        const status = this.DHLCode2StatusCode(
          code,
          fulfillment.payload?.id,
          dhl_state?.LabelData?.Status?.statusMessage,
        );
        
        if (state === State.INVALID) {
          fulfillment.payload.state = state;
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
        
        fulfillment.payload.state = state;
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
            sequenceNumber: i,
            Shipment: {
              Shipper: {
                Name: {
                  name1: packaging.sender.address.residential_address?.family_name ?? packaging.sender.address.business_address?.name,
                  name2: packaging.sender.address.residential_address?.given_name,
                  name3: packaging.sender.address.residential_address?.mid_name,
                },
                Address: {
                  streetName: packaging.sender.address?.street,
                  streetNumber: packaging.sender.address?.building_number,
                  zip: packaging.sender.address?.postcode,
                  city: packaging.sender.address?.region,
                  Origin: {
                    country: request.sender_country?.name,
                    countryISOCode: request.sender_country?.country_code
                  }
                },
                Communication: {
                  contactPerson: packaging.sender?.contact?.name,
                  email: packaging.sender?.contact.email,
                  phone: packaging.sender?.contact.phone,
                }
              },
              Receiver: {
                name1: packaging.recipient.address.residential_address?.family_name ?? packaging.recipient.address.business_address?.name,
                Address: {
                  name2: packaging.recipient.address.residential_address?.given_name,
                  name3: packaging.recipient.address.residential_address?.mid_name,
                  streetName: packaging.recipient.address?.street,
                  streetNumber: packaging.recipient.address?.building_number,
                  zip: packaging.recipient.address?.postcode,
                  city: packaging.recipient.address?.region,
                  Origin: {
                    country: request.recipient_country?.name,
                    countryISOCode: request.recipient_country?.country_code
                  },
                },
                Communication: {
                  contactPerson: packaging.recipient.contact?.name,
                  email: packaging.recipient.contact?.email,
                  phone: packaging.recipient.contact?.phone,
                }
              },
              ShipmentDetails: {
                shipmentDate: new Date().toISOString().slice(0,10),
                costCenter: '',
                customerReference: request.payload.reference.instance_id ?? request.payload.id,
                product: request.product.attributes.find(att => att.id === this.cfg.get('urns:productName')).value,
                accountNumber: request.product.attributes.find(att => att.id === this.cfg.get('urns:accountNumber')).value,
                // Service: parseService(request.parcel.attributes),
                ShipmentItem: {
                  heightInCM: request.parcel.package.size_in_cm.height,
                  lengthInCM: request.parcel.package.size_in_cm.length,
                  widthInCM: request.parcel.package.size_in_cm.width,
                  weightInKG: request.parcel.package.weight_in_kg,
                },
                Notification: {
                  recipientEmailAddress: packaging.notify
                }
              }
            }
          }
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

    async registerSoapClient(courier?: Courier): Promise<soap.Client> {
      this.courier = courier = courier ?? this.courier;
      if (this.clients[courier.id]) {
        return this.clients[courier.id];
      }

      try{
        const configs = JSON.parse(courier?.configuration?.value?.toString() ?? null)?.ordering ?? this.stub_defaults?.ordering;
        const wsdl = configs?.wsdl ?? this.stub_defaults?.ordering?.wsdl;
        const username = configs?.username ?? this.stub_defaults?.ordering?.username;
        const password = configs?.password ?? this.stub_defaults?.ordering?.password;
        const endpoint = configs?.endpoint ?? this.stub_defaults?.ordering?.endpoint;
        const wsdlHeader = configs?.wsdl_header ?? this.stub_defaults?.ordering?.wsdl_header;
        this.clients[courier.id] = await soap.createClientAsync(wsdl).then(client => {
          client.setEndpoint(endpoint);
          client.addSoapHeader(typeof(wsdlHeader) === 'string' ? JSON.parse(wsdlHeader) : wsdlHeader);
          client.setSecurity(new soap.BasicAuthSecurity(username, password));
          return client;
        });
      }
      catch (err) {
        this.logger?.error(`${this.constructor.name}:\n Failed to create Client!`);
        this.logger?.error(`${this.constructor.name}: ${JSON.stringify(err, null, 2)}`);
        throw err;
      }
      return this.clients[courier.id];
    };

    protected override async evaluateImpl (fulfillments: FlatAggregatedFulfillment[]): Promise<FlatAggregatedFulfillment[]> {
      if (fulfillments.length === 0) return [];
      const dhl_order_request = this.AggregatedFulfillmentRequests2DHLShipmentOrderRequest(fulfillments);
      const client = await this.registerSoapClient();
      return new Promise<FlatAggregatedFulfillment[]>((resolve): void => {
        client.GVAPI_2_0_de.GKVAPISOAP11port0.evaluateShipmentOrder(
          dhl_order_request,
          (error: any, result: any): any => {
            resolve(this.DHLShipmentLabels2FulfillmentResponses(fulfillments, result, error));
          }
        );
      });
    }

    protected override async submitImpl (fulfillments: FlatAggregatedFulfillment[]): Promise<FlatAggregatedFulfillment[]> {
      if (fulfillments.length === 0) return [];
      const dhl_order_request = this.AggregatedFulfillmentRequests2DHLShipmentOrderRequest(fulfillments);
      const client = await this.registerSoapClient();
      return new Promise<FlatAggregatedFulfillment[]>((resolve): void => {
        client.GVAPI_2_0_de.GKVAPISOAP11port0.createShipmentOrder(
          dhl_order_request,
          (error: any, result: any): any => {
            resolve(this.DHLShipmentLabels2FulfillmentResponses(fulfillments, result, error));
          }
        );
      });
    }

    protected override async trackImpl (fulfillments: FlatAggregatedFulfillment[]): Promise<FlatAggregatedFulfillment[]> {
      const promises = fulfillments.map(async item => {
        try {
          const options = JSON.parse(item?.options?.value?.toString() ?? null);
          const config = JSON.parse(this.courier?.configuration?.value?.toString() ?? null)?.tracking ?? this.stub_defaults?.tracking;
          const client = {
            appname: config?.appname ?? this.stub_defaults?.tracking?.appname,
            username: config?.username ?? this.stub_defaults?.tracking?.username,
            password: config?.password ?? this.stub_defaults?.tracking?.password,
            endpoint: config?.endpoint ?? this.stub_defaults?.tracking?.endpoint,
            secret: config?.secret ?? this.stub_defaults?.tracking?.secret,
          };
          const auth = 'Basic ' + Buffer.from(`${client.username}:${client.password}`).toString('base64'); 
          const attributes = {
            appname: client.appname,
            password: client.secret,
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
            method: 'post',
            headers: {
              Host: 'cig.dhl.de',
              Authorization: auth,
              Connection: 'Keep-Alive',
            },
            body: params,
          };
          
          return await fetch(client.endpoint, payload).then(
            response => DHLTracking2FulfillmentTracking(item, response),
            err => {
              this.logger?.error(`${this.constructor.name}: ${err}`);
              return DHLTracking2FulfillmentTracking(item, null, err);
            }
          );
        } catch (err) {
          this.logger?.error(`${this.constructor.name}: ${err}`);
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

    protected override async cancelImpl (fulfillments: FlatAggregatedFulfillment[]): Promise<FlatAggregatedFulfillment[]> {
      if (fulfillments.length === 0) return [];
      const fulfillment_map: { [k: string]: FlatAggregatedFulfillment } = {};
      fulfillments.forEach(a => fulfillment_map[a.label.shipment_number] = a);
      const dhl_cancel_request = this.AggregatedFulfillment2DHLShipmentCancelRequest(fulfillments);
      const client = await this.registerSoapClient();
      return await new Promise<FlatAggregatedFulfillment[]>((resolve, reject: (v: FlatAggregatedFulfillment[]) => void): void => {
        client.GVAPI_2_0_de.GKVAPISOAP11port0.deleteShipmentOrder(dhl_cancel_request,
          (err: any, result: any): any => {
            if (err) {
              if (result?.html) {
                this.logger?.error(`${this.constructor.name}: ${result.html.head.title}`);
                reject(DHLShipmentCancelResponse2AggregatedFulfillment(fulfillment_map, null, result.html.head.title));
              }
              else {
                this.logger?.error(`${this.constructor.name}: ${err}`);
                reject(DHLShipmentCancelResponse2AggregatedFulfillment(fulfillment_map, null, err));
              }
            }
            else {
              resolve(DHLShipmentCancelResponse2AggregatedFulfillment(fulfillment_map, result));
            }
          });
      });
    };

    async getTariffCode(fulfillment: FlatAggregatedFulfillment): Promise<string> {
      return fulfillment.recipient_country.country_code;
    }
  };

  Stub.register('DHLSoapStub', DHLSoapStub);
}
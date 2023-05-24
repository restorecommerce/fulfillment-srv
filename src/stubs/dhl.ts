import * as soap from 'soap';
import { xml2js, js2xml } from 'xml-js';
import {
  Event,
  State,
  Tracking,
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/fulfillment';
import { FulfillmentCourier as Courier } from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/fulfillment_courier';
import { Status } from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/status';
import {
  FlatAggregatedFulfillment,
  Stub
} from '..';

export namespace DHL
{
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

  function DHLShipmentLabels2FulfillmentResponses (
    requests: FlatAggregatedFulfillment[],
    response: any,
    status?: any,
  ): FlatAggregatedFulfillment[] {
    return requests.map((request, i) => {
      const dhl_state = response?.CreationState?.find((state: any) => state.sequenceNumber == i);
      if (status) {
        status.id = request.payload.id;
      }
      else {
        status = request.status
      }

      const state = dhl_state?.LabelData.Status.statusCode == 0 ? State.Submitted : State.Invalid;
      
      const label = {
        parcel_id: request.parcel.id,
        shipment_number: dhl_state?.shipmentNumber,
        url: dhl_state?.LabelData.labelUrl,
        png: undefined,
        pdf: undefined,
        state,
        status
      };

      request.payload.state = state;

      const fulfillment = {
        ...request,
        label,
        status,
      };

      return fulfillment;
    });
  }

  const DHLEvent2FulfillmentEvent = (attributes: any): Event => ({
    timestamp: attributes['event-timestamp'],
    location: attributes['event-location'],
    details: {
      type_url: null,
      value: Buffer.from(JSON.stringify(attributes)) // because Any
    },
    status: {
      id: attributes['event-short-status'],
      code: attributes['standard-event-code'],
      message: attributes['event-text']
    }
  });

  const DHLTracking2FulfillmentTracking = async (
    fulfillment: FlatAggregatedFulfillment,
    response: any,
    err?: any
  ): Promise<FlatAggregatedFulfillment> => {
    if (err || response?.status != 200) {
      fulfillment.label.state = State.Invalid;
      fulfillment.payload.tracking = [{
        shipment_number: fulfillment.label.shipment_number,
        events: null,
        details: null,
        status: {
          id: fulfillment.label.shipment_number,
          code: response?.status || err?.code || 500,
          message: response?.statusText || err?.message || err?.msg || JSON.stringify(err, null, 2)
        }
      }];
    }
    else {
      fulfillment.payload.tracking = [await response.text().then(
        (response_text): Tracking => {
          const response = xml2js(response_text);
          if (response?.elements?.[0]?.attributes?.code == 0) {
            const status = {
              id: fulfillment.label.shipment_number,
              code: response.elements[0].attributes.code,
              message: response.elements[0].attributes.error || response.elements[0].elements[0].attributes.status
            };
            fulfillment.label.state = response.elements[0].elements[0].attributes['delivery-event-flag'] ? State.Fulfilled : State.InTransit;
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
            fulfillment.label.state = State.Invalid;
            return {
              shipment_number: fulfillment.label.shipment_number,
              events: null,
              details: null,
              status: {
                id: fulfillment.label.shipment_number,
                code: response?.elements?.[0]?.attributes?.code || 500,
                message: response?.elements?.[0]?.attributes?.error || 'Error Unknown!'
              }
            };
          }
        },
        (err: any): Tracking => {
          fulfillment.label.state = State.Invalid;
          return {
            shipment_number: fulfillment.label.shipment_number,
            events: null,
            details: null,
            status: {
              id: fulfillment.label.shipment_number,
              code: err?.code || 500,
              message: err?.message || err?.msg || JSON.stringify(err, null, 2)
            }
          };
        }
      )];
    }

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
          code: err.code || err.statusCode || 500,
          message: err.message || err.statusText || JSON.stringify(err)
        };
        fulfillment.label.status = status;
        fulfillment.status = status;
        return fulfillment;
      });
    }

    return response.DeletionState.map(state => {
      const fulfillment = fulfillment_map[state.shipmentNumber];
      fulfillment.label.state = state.Status.statusCode == 0 ? State.Cancelled : fulfillment.label.state;
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

  class DHLStub extends Stub {
    protected static _clients: { [id: string]: soap.Client } = {};
    readonly version: number[];

    get type(): string {
      return 'DHL';
    }

    get clients(): {} {
      return DHLStub._clients;
    }

    constructor(courier?: Courier, kwargs?: { [key: string]: any }) {
      super(courier, kwargs?.cfg, kwargs?.logger);
      this.version = this.cfg?.get('stubs:DHL:ordering:version') || [3, 4, 0];
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
                  name1: packaging.sender.address.residential_address?.family_name || packaging.sender.address.business_address?.name,
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
                name1: packaging.receiver.address.residential_address?.family_name || packaging.receiver.address.business_address?.name,
                Address: {
                  name2: packaging.receiver.address.residential_address?.given_name,
                  name3: packaging.receiver.address.residential_address?.mid_name,
                  streetName: packaging.receiver.address?.street,
                  streetNumber: packaging.receiver.address?.building_number,
                  zip: packaging.receiver.address?.postcode,
                  city: packaging.receiver.address?.region,
                  Origin: {
                    country: request.receiver_country?.name,
                    countryISOCode: request.receiver_country?.country_code
                  },
                },
                Communication: {
                  contactPerson: packaging.receiver.contact?.name,
                  email: packaging.receiver.contact?.email,
                  phone: packaging.receiver.contact?.phone,
                }
              },
              ShipmentDetails: {
                shipmentDate: new Date().toISOString().slice(0,10),
                costCenter: '',
                customerReference: packaging.reference_id,
                product: request.product.attributes.find(att => att.id === this.cfg.get('urns').productName).value,
                accountNumber: request.product.attributes.find(att => att.id === this.cfg.get('urns').accountNumber).value,
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
      this.courier = courier = courier || this.courier;
      if (this.clients[courier.id]) {
        return this.clients[courier.id];
      }

      const configs = JSON.parse(courier?.configuration?.value?.toString() || null)?.ordering;
      const wsdl = configs?.wsdl || this.cfg?.get('stubs:DHL:ordering:wsdl');
      const username = configs?.username || this.cfg?.get('stubs:DHL:ordering:username');
      const password = configs?.password || this.cfg?.get('stubs:DHL:ordering:password');
      const endpoint = configs?.endpoint || this.cfg?.get('stubs:DHL:ordering:endpoint');
      const wsdlHeader = configs?.wsdl_header || this.cfg?.get('stubs:DHL:ordering:wsdl_header');
      try{
        this.clients[courier.id] = await soap.createClientAsync(wsdl).then(client => {
          client.setEndpoint(endpoint);
          client.addSoapHeader(typeof(wsdlHeader) === 'string' ? JSON.parse(wsdlHeader) : wsdlHeader);
          client.setSecurity(new soap.BasicAuthSecurity(username, password));
          return client;
        });
      }
      catch (err) {
        this.logger?.error(`${this.constructor.name}:\n Failed to create Client for '${endpoint}' \n as '${username}' \n using '${wsdl}'`);
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
        try {
          client.GVAPI_2_0_de.GKVAPISOAP11port0.evaluateShipmentOrder(dhl_order_request, (err: any, result: any): any => {
            if (err) {
              if (result?.html) {
                this.logger?.error(`${this.constructor.name}: ${result.html.head.title}`);
                const status: Status = {
                  id: null,
                  code: result.statusCode,
                  message: result.html.head.title
                };
                resolve(DHLShipmentLabels2FulfillmentResponses(fulfillments, null, status));
              }
              else {
                const message = err?.root?.Envelope?.Body?.Fault?.faultstring || err?.response?.statusText || err?.toString() || 'Server Error!'
                this.logger?.error(`${this.constructor.name}: ${message}`);
                const status: Status = {
                  id: null,
                  code: err?.response?.status || 500,
                  message
                };
                resolve(DHLShipmentLabels2FulfillmentResponses(fulfillments, null, status));
              }
            }
            else if (result?.html) {
              this.logger?.error(`${this.constructor.name}: ${result.html}`);
              const status: Status = {
                id: null,
                code: result.statusCode,
                message: result.html
              };
              resolve(DHLShipmentLabels2FulfillmentResponses(fulfillments, null, status));
            }
            else if (result) {
              if (result.Status.statusCode != 0) {
                const message = JSON.stringify(result, null, 2);
                this.logger?.error(`${this.constructor.name}: ${message}`);
                const status: Status = {
                  id: null,
                  code: result.Status.statusCode,
                  message
                };
                resolve(DHLShipmentLabels2FulfillmentResponses(fulfillments, null, status));
              }
              else {
                resolve(DHLShipmentLabels2FulfillmentResponses(fulfillments, result));
              }
            }
            else {
              // Shouldn't get to here!?
              const status: Status = {
                id: null,
                code: 500,
                message: 'Unexpected Error: No Response!'
              };
              resolve(DHLShipmentLabels2FulfillmentResponses(fulfillments, null, status));
            }
          });
        }
        catch (err) {
          const status: Status = {
            id: null,
            code: 500,
            message: `Internal Error: ${JSON.stringify(err, null, 2)}`
          };
          resolve(DHLShipmentLabels2FulfillmentResponses(fulfillments, null, status));
        }
      });
    }

    protected override async submitImpl (fulfillments: FlatAggregatedFulfillment[]): Promise<FlatAggregatedFulfillment[]> {
      if (fulfillments.length === 0) return [];
      const dhl_order_request = this.AggregatedFulfillmentRequests2DHLShipmentOrderRequest(fulfillments);
      const client = await this.registerSoapClient();
      return new Promise<FlatAggregatedFulfillment[]>((resolve): void => {
        try {
          client.GVAPI_2_0_de.GKVAPISOAP11port0.createShipmentOrder(dhl_order_request, (err: any, result: any): any => {
            if (err) {
              if (result?.html) {
                this.logger?.error(`${this.constructor.name}: ${result.html.head.title}`);
                const status: Status = {
                  id: null,
                  code: result.statusCode,
                  message: result.html.head.title
                };
                resolve(DHLShipmentLabels2FulfillmentResponses(fulfillments, null, status));
              }
              else {
                const message = err?.root?.Envelope?.Body?.Fault?.faultstring || err?.response?.statusText || err?.toString() || 'Server Error!'
                this.logger?.error(`${this.constructor.name}: ${message}`);
                const status: Status = {
                  id: null,
                  code: err?.response?.status || 500,
                  message
                };
                resolve(DHLShipmentLabels2FulfillmentResponses(fulfillments, null, status));
              }
            }
            else if (result?.html) {
              this.logger?.error(`${this.constructor.name}: ${result.html}`);
              const status: Status = {
                id: null,
                code: result.statusCode,
                message: result.html
              };
              resolve(DHLShipmentLabels2FulfillmentResponses(fulfillments, null, status));
            }
            else if (result) {
              if (result.Status.statusCode != 0) {
                const message = JSON.stringify(result, null, 2);
                this.logger?.error(`${this.constructor.name}: ${message}`);
                const status: Status = {
                  id: null,
                  code: result.Status.statusCode,
                  message
                };
                resolve(DHLShipmentLabels2FulfillmentResponses(fulfillments, null, status));
              }
              else {
                resolve(DHLShipmentLabels2FulfillmentResponses(fulfillments, result));
              }
            }
            else {
              // Shouldn't get to here!?
              const status: Status = {
                id: null,
                code: 500,
                message: 'Unexpected Error: No Response!'
              };
              resolve(DHLShipmentLabels2FulfillmentResponses(fulfillments, null, status));
            }
          });
        }
        catch (err) {
          const status: Status = {
            id: null,
            code: 500,
            message: `Internal Error: ${JSON.stringify(err, null, 2)}`
          };
          resolve(DHLShipmentLabels2FulfillmentResponses(fulfillments, null, status));
        }
      });
    }

    protected override async trackImpl (fulfillments: FlatAggregatedFulfillment[]): Promise<FlatAggregatedFulfillment[]> {
      if (fulfillments.length === 0) return [];
      const promises = fulfillments.map(async item => {
        try {
          const options = JSON.parse(item?.options?.value?.toString() ?? null);
          const config = JSON.parse(this.courier?.configuration?.value?.toString() ?? null)?.tracking;
          const client = {
            appname: config?.appname ?? this.cfg.get('stubs:DHL:tracking:appname'),
            username: config?.username ?? this.cfg.get('stubs:DHL:tracking:username'),
            password: config?.password ??  this.cfg.get('stubs:DHL:tracking:password'),
            token: config?.token ?? this.cfg.get('stubs:DHL:tracking:token'),
            endpoint: config?.endpoint ?? this.cfg.get('stubs:DHL:tracking:endpoint')
          };
          const auth = 'Basic ' + Buffer.from(`${client.username}:${client.token}`).toString('base64');
          const headers = {
            method: 'get',
            headers: {
              Host: 'cig.dhl.de',
              Authorization: auth,
              Connection: 'Keep-Alive'
            }
          };
          const attributes = {
            appname: client.appname,
            password: client.password,
            'piece-code': item.payload.labels[0].shipment_number,
            'language-code': options?.['language-code'] ?? 'de',
            request: options?.request ?? 'd-get-piece-detail'
          };
          const xml = '<?xml version="1.0" encoding="UTF-8" standalone="no"?>' + js2xml({ data: { _attributes: attributes } }, {compact: true});
          return await fetch(client.endpoint + '?xml=' +xml, headers).then(
            response => DHLTracking2FulfillmentTracking(item, response),
            err => {
              this.logger?.error(`${this.constructor.name}: ${err}`);
              return DHLTracking2FulfillmentTracking(item, null, err);
            }
          );
        } catch (err) {
          this.logger?.error(`${this.constructor.name}: ${err}`);
          item.label.state = State.Invalid;
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
      return fulfillment.receiver_country.country_code;
    }
  };

  Stub.register('DHL', DHLStub);
}
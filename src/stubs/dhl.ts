import * as soap from 'soap';
import { xml2js, js2xml } from 'xml-js';

import {
  Event,
  FulfillmentAddress,
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

  /*
  function parseAddress (address: Address) {
    switch (address.type) {

    }
  }
  */

  function DHLShipmentLabels2FulfillmentResponses (requests: FlatAggregatedFulfillment[], response: any, status?: Status): FlatAggregatedFulfillment[] {
    return requests.map((request, i) => {
      const dhl_state = response?.CreationState?.find((state: any) => state.sequenceNumber == i);
      if (status) {
        status.id = request.id;
      }
      else {
        status = {
          id: request.id,
          code: 200,
          message: 'OK'
        };
      }

      const label = {
        parcel_id: request.order.parcels[0].id,
        shipment_number: dhl_state?.shipmentNumber,
        url: dhl_state?.LabelData.labelUrl,
        png: undefined,
        pdf: undefined,
        state: dhl_state?.LabelData.Status.statusCode == 0 ? State.Submitted : State.Invalid,
        status
      };

      const fulfillment = {
        ...request,
        label,
        labels: [label],
        state: label.state
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

  const DHLTracking2FulfillmentTracking = async (fulfillment: FlatAggregatedFulfillment, response: any, err?: any): Promise<FlatAggregatedFulfillment> => {
    if (err || response?.status != 200) {
      fulfillment.labels[0].state = State.Invalid;
      fulfillment.tracking = [{
        shipment_number: fulfillment.labels[0].shipment_number,
        events: null,
        details: null,
        status: {
          id: fulfillment.labels[0].shipment_number,
          code: response?.status || err?.code || 500,
          message: response?.statusText || err?.message || err?.msg || JSON.stringify(err, null, 2)
        }
      }];
    }
    else {
      fulfillment.tracking = [await response.text().then(
        (response_text): Tracking => {
          const response = xml2js(response_text);
          if (response?.elements?.[0]?.attributes?.code == 0) {
            const status = {
              id: fulfillment.labels[0].shipment_number,
              code: response.elements[0].attributes.code,
              message: response.elements[0].attributes.error || response.elements[0].elements[0].attributes.status
            };
            fulfillment.labels[0].state = response.elements[0].elements[0].attributes['delivery-event-flag'] ? State.Fulfilled : State.Shipping;
            fulfillment.labels[0].status = status;
            fulfillment.state = fulfillment.labels[0].state;
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
            fulfillment.labels[0].state = State.Invalid;
            return {
              shipment_number: fulfillment.labels[0].shipment_number,
              events: null,
              details: null,
              status: {
                id: fulfillment.labels[0].shipment_number,
                code: response?.elements?.[0]?.attributes?.code || 500,
                message: response?.elements?.[0]?.attributes?.error || 'Error Unknown!'
              }
            };
          }
        },
        (err: any): Tracking => {
          fulfillment.labels[0].state = State.Invalid;
          return {
            shipment_number: fulfillment.labels[0].shipment_number,
            events: null,
            details: null,
            status: {
              id: fulfillment.labels[0].shipment_number,
              code: err?.code || 500,
              message: err?.message || err?.msg || JSON.stringify(err, null, 2)
            }
          };
        }
      )];
    }

    return fulfillment;
  };

  const DHLShipmentCancelResponse2AggregatedFulfillment = (fulfillment_map: {[k: string]: FlatAggregatedFulfillment}, response: any, err?: any): FlatAggregatedFulfillment[] => {
    if (err) {
      return Object.values(fulfillment_map).map(fulfillment => {
        fulfillment.labels[0].status = {
          id: fulfillment.labels[0].shipment_number,
          code: err.code || err.statusCode || 500,
          message: err.message || err.statusText || JSON.stringify(err)
        };
        return fulfillment;
      });
    }

    return response.DeletionState.map(state => {
      const fulfillment = fulfillment_map[state.shipmentNumber];
      fulfillment.labels[0].state = state.Status.statusCode == 0 ? State.Cancelled : fulfillment.labels[0].state;
      fulfillment.labels[0].status = {
        id: state.shipmentNumber,
        code: state.Status.statusCode,
        message: state.Status.statusText
      };
      return fulfillment;
    });
  };

  class DHLStub extends Stub {
    protected static _clients: { [id: string]: soap.Client } = {};
    readonly version: number[];

    public static register()
    {
      Stub.STUB_TYPES['DHL'] = (courier: Courier, kwargs?: { [key: string]: any }) => new DHLStub(courier, kwargs);
    }

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

    protected AggregatedFulfillmentRequests2DHLShipmentOrderRequest(requests: FlatAggregatedFulfillment[]): ShipmentOrderRequest {
      return {
        Version: {
          majorRelease: this.version[0],
          minorRelease: this.version[1]
        },
        ShipmentOrder: requests.map((request, i): ShipmentOrder => ({
          sequenceNumber: i,
          Shipment: {
            Shipper: {
              Name: {
                name1: request.order.sender.address.residential_address?.family_name || request.order.sender.address.business_address?.name,
                name2: request.order.sender.address.residential_address?.given_name,
                name3: request.order.sender.address.residential_address?.mid_name,
              },
              Address: {
                streetName: request.order.sender.address?.street,
                streetNumber: request.order.sender.address?.building_number,
                zip: request.order.sender.address?.postcode,
                city: request.order.sender.address?.region,
                Origin: {
                  country: request.order.sender.country?.name,
                  countryISOCode: request.order.sender.country?.country_code
                }
              },
              Communication: {
                contactPerson: request.order.sender?.contact_person?.name,
                email: request.order.sender?.contact_person.email,
                phone: request.order.sender?.contact_person.phone,
              }
            },
            Receiver: {
              name1: request.order.receiver.address.residential_address?.family_name || request.order.receiver.address.business_address?.name,
              Address: {
                name2: request.order.receiver.address.residential_address?.given_name,
                name3: request.order.receiver.address.residential_address?.mid_name,
                streetName: request.order.receiver.address?.street,
                streetNumber: request.order.receiver.address?.building_number,
                zip: request.order.receiver.address?.postcode,
                city: request.order.receiver.address?.region,
                Origin: {
                  country: request.order.receiver.country.name,
                  countryISOCode: request.order.receiver.country.country_code
                },
              },
              Communication: {
                contactPerson: request.order.receiver.contact_person?.name,
                email: request.order.receiver.contact_person?.email,
                phone: request.order.receiver.contact_person?.phone,
              }
            },
            ShipmentDetails: {
              shipmentDate: new Date().toISOString().slice(0,10),
              costCenter: '',
              customerReference: request.order.reference_id,
              product: request.product.attributes.find(att => att.id == 'urn:restorecommerce:fufs:names:product:attr:dhl:productName').value,
              accountNumber: request.product.attributes.find(att => att.id == 'urn:restorecommerce:fufs:names:product:attr:dhl:accountNumber').value,
              // Service: parseService(request.order.parcels[0].attributes),
              ShipmentItem: {
                heightInCM: request.order.parcels[0].height_in_cm,
                lengthInCM: request.order.parcels[0].length_in_cm,
                weightInKG: request.order.parcels[0].weight_in_kg,
                widthInCM: request.order.parcels[0].width_in_cm
              },
              Notification: {
                recipientEmailAddress: request.order.notify
              }
            }
          }
        }))
      };
    }

    protected AggregatedFulfillment2DHLShipmentCancelRequest(requests: FlatAggregatedFulfillment[]): ShipmentCancelRequest{
      return {
        Version: {
          majorRelease: this.version[0],
          minorRelease: this.version[1]
        },
        shipmentNumber: requests.map(request => request.labels[0].shipment_number)
      };
    }

    async registerSoapClient (courier?: Courier): Promise<soap.Client> {
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

    async submit (requests: FlatAggregatedFulfillment[]): Promise<FlatAggregatedFulfillment[]> {
      requests = requests.filter(request => request?.courier?.id === this.courier.id);
      if (requests.length === 0) return [];
      const dhl_order_request = this.AggregatedFulfillmentRequests2DHLShipmentOrderRequest(requests);
      const client = await this.registerSoapClient();
      return new Promise<FlatAggregatedFulfillment[]>((resolve, reject: (v: FlatAggregatedFulfillment[]) => void): void => {
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
                resolve(DHLShipmentLabels2FulfillmentResponses(requests, null, status));
              }
              else {
                const message = err?.root?.Envelope?.Body?.Fault?.faultstring || err?.response?.statusText || err?.toString() || 'Server Error!'
                this.logger?.error(`${this.constructor.name}: ${message}`);
                const status: Status = {
                  id: null,
                  code: err?.response?.status || 500,
                  message
                };
                resolve(DHLShipmentLabels2FulfillmentResponses(requests, null, status));
              }
            }
            else if (result?.html) {
              this.logger?.error(`${this.constructor.name}: ${result.html}`);
              const status: Status = {
                id: null,
                code: result.statusCode,
                message: result.html
              };
              resolve(DHLShipmentLabels2FulfillmentResponses(requests, null, status));
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
                resolve(DHLShipmentLabels2FulfillmentResponses(requests, null, status));
              }
              else {
                resolve(DHLShipmentLabels2FulfillmentResponses(requests, result));
              }
            }
            else {
              // Shouldn't get to here!?
              const status: Status = {
                id: null,
                code: 500,
                message: 'Unexpected Error: No Response!'
              };
              resolve(DHLShipmentLabels2FulfillmentResponses(requests, null, status));
            }
          });
        }
        catch (err) {
          const status: Status = {
            id: null,
            code: 500,
            message: `Internal Error: ${JSON.stringify(err, null, 2)}`
          };
          resolve(DHLShipmentLabels2FulfillmentResponses(requests, null, status));
        }
      });
    }

    async track (requests: FlatAggregatedFulfillment[]): Promise<FlatAggregatedFulfillment[]> {
      requests = requests.filter(request => request.courier?.id == this.courier.id);
      const promises = requests.map(async item => {
        try {
          const options = JSON.parse(item?.options?.value?.toString() || null);
          const config = JSON.parse(item?.courier?.configuration?.value?.toString() || null)?.tracking;
          const client = {
            appname: config?.appname || this.cfg.get('stubs:DHL:tracking:appname'),
            username: config?.username || this.cfg.get('stubs:DHL:tracking:username'),
            password: config?.password ||  this.cfg.get('stubs:DHL:tracking:password'),
            token: config?.token || this.cfg.get('stubs:DHL:tracking:token'),
            endpoint: config?.endpoint || this.cfg.get('stubs:DHL:tracking:endpoint')
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
            'piece-code': item.labels[0].shipment_number,
            'language-code': options?.['language-code'] || 'de',
            request: options?.request || 'd-get-piece-detail'
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
          item.labels[0].state = State.Invalid;
          return {
            ...item,
            status: {
              id: item.id,
              code: 500,
              message: JSON.stringify(err)
            }
          };
        }
      });

      return await Promise.all(promises);
    };

    async cancel (request: FlatAggregatedFulfillment[]): Promise<FlatAggregatedFulfillment[]> {
      request = request.filter(request => request?.courier?.id == this.courier.id);
      if (request.length == 0) return [];
      const fulfillment_map: { [k: string]: FlatAggregatedFulfillment } = {};
      request.forEach(a => fulfillment_map[a.labels[0].shipment_number] = a);
      const dhl_cancel_request = this.AggregatedFulfillment2DHLShipmentCancelRequest(request);
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

    async getZoneFor(address: FulfillmentAddress): Promise<string> {
      return address?.country?.country_code;
    }
  };

  export const register = () => {
    DHLStub.register();
  };
}

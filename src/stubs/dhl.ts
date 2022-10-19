import * as soap from 'soap';
import { xml2js, js2xml } from 'xml-js';

import {
  Event,
  State,
  Tracking,
  TrackingResult
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/fulfillment';
import { FulfillmentCourier as Courier } from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/fulfillment_courier';
import { Status } from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/status';
import {
  AggregatedAddress,
  FlatAggregatedFulfillment,
  FlatAggregatedTrackingRequest,
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
      Communication: Communication;
    };
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
      Communication: Communication;
    };
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
      majorRelease: 3;
      minorRelease: 1;
    };
    ShipmentOrder: ShipmentOrder[];
  }

  interface ShipmentCancelRequest
  {
    Version: {
      majorRelease: 3;
      minorRelease: 1;
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

  const AggregatedFulfillmentRequests2DHLShipmentOrderRequest = (requests: FlatAggregatedFulfillment[]): ShipmentOrderRequest => ({
    Version: {
      majorRelease: 3,
      minorRelease: 1
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
              country: request.order.sender.address.country.name,
              countryISOCode: request.order.sender.address.country.country_code
            },
            Communication: {
              contactPerson: request.order.sender.contact_person?.name,
              email: request.order.sender.contact_person.email,
              phone: request.order.sender.contact_person.phone,
            }
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
              country: request.order.receiver.address.country.name,
              countryISOCode: request.order.receiver.address.country.country_code
            },
            Communication: {
              contactPerson: request.order.receiver.contact_person?.name,
              email: request.order.receiver.contact_person?.email,
              phone: request.order.receiver.contact_person?.phone,
            }
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
            heightInCM: request.parcel.height_in_cm,
            lengthInCM: request.parcel.length_in_cm,
            weightInKG: request.parcel.weight_in_kg,
            widthInCM: request.parcel.width_in_cm
          },
          Notification: {
            recipientEmailAddress: request.order.notify
          }
        }
      }
    }))
  });

  function DHLShipmentLabels2FulfillmentResponses (requests: FlatAggregatedFulfillment[], response: any, status?: Status): FlatAggregatedFulfillment[] {
    return requests.map((request, i) => {
      const dhl_state = response?.CreationState.find((state: any) => state.sequenceNumber == i);
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
        shipment_number: dhl_state?.shipmentNumber,
        fulfillment_id: request.id,
        reference_id: request.order.reference_id,
        type: 'url',
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

  const DHLTracking2FulfillmentTracking = async (request: FlatAggregatedTrackingRequest, response: any, err?: any): Promise<Tracking> => {
    if (err || response?.status != 200) {
      request.fulfillment.label.state = State.Invalid;
      return {
        shipment_number: request.fulfillment.label.shipment_number,
        events: null,
        details: null,
        status: {
          id: request.fulfillment.label.shipment_number,
          code: response?.status || err?.code || 500,
          message: response?.statusText || err?.message || err?.msg || JSON.stringify(err, null, 2)
        }
      };
    }

    return response.text().then(
      (response_text): Tracking => {
        const response = xml2js(response_text);
        if (response?.elements?.[0]?.attributes?.code == 0) {
          const status = {
            id: request.fulfillment.label.shipment_number,
            code: response.elements[0].attributes.code,
            message: response.elements[0].attributes.error || response.elements[0].elements[0].attributes.status
          };
          request.fulfillment.label.state = response.elements[0].elements[0].attributes['delivery-event-flag'] ? State.Done : State.Shipping;
          request.fulfillment.label.status = status;
          request.fulfillment.fulfilled = request.fulfillment.label.state == State.Done;
          return {
            shipment_number: request.fulfillment.label.shipment_number,
            events: response.elements[0].elements[0].elements[0].elements.map((element: any) => DHLEvent2FulfillmentEvent(element.attributes)),
            details: {
              type_url: null,
              value: Buffer.from(JSON.stringify(response.elements[0].elements[0].attributes))
            },
            status
          };
        }
        else {
          request.fulfillment.label.state = State.Invalid;
          return {
            shipment_number: request.fulfillment.label.shipment_number,
            events: null,
            details: null,
            status: {
              id: request.fulfillment.label.shipment_number,
              code: response?.elements?.[0]?.attributes?.code || 500,
              message: response?.elements?.[0]?.attributes?.error || 'Error Unknown!'
            }
          };
        }
      },
      (err: any): Tracking => {
        request.fulfillment.label.state = State.Invalid;
        return {
          shipment_number: request.fulfillment.label.shipment_number,
          events: null,
          details: null,
          status: {
            id: request.fulfillment.label.shipment_number,
            code: err?.code || 500,
            message: err?.message || err?.msg || JSON.stringify(err, null, 2)
          }
        };
      }
    );
  };

  const AggregatedFulfillment2DHLShipmentCancelRequest = (requests: FlatAggregatedFulfillment[]): ShipmentCancelRequest => ({
    Version: {
      majorRelease: 3,
      minorRelease: 1
    },
    shipmentNumber: requests.map(request => request.label.shipment_number)
  });

  const DHLShipmentCancelResponse2AggregatedFulfillment = (fulfillment_map: {[k: string]: FlatAggregatedFulfillment}, response: any, err?: any): FlatAggregatedFulfillment[] => {
    if (err) {
      return Object.values(fulfillment_map).map(fulfillment => {
        fulfillment.label.status = {
          id: fulfillment.label.shipment_number,
          code: err.code || err.statusCode || 500,
          message: err.message || err.statusText || JSON.stringify(err)
        };
        return fulfillment;
      });
    }

    return response.DeletionState.map(state => {
      const fulfillment = fulfillment_map[state.shipmentNumber];
      fulfillment.label.state = state.Status.statusCode == 0 ? State.Cancelled : fulfillment.label.state;
      fulfillment.label.status = {
        id: state.shipmentNumber,
        code: state.Status.statusCode,
        message: state.Status.statusText
      };
      return fulfillment;
    });
  };

  class DHLStub extends Stub {
    protected static _clients: { [id: string]: soap.Client } = {};

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
    }

    async registerSoapClient (courier?: Courier): Promise<soap.Client> {
      this.courier = courier = courier || this.courier;
      if (this.clients[courier.id]) {
        return this.clients[courier.id];
      }

      const configs = JSON.parse(courier?.configuration?.value?.toString() || null)?.ordering;
      const wsdl = configs?.wsdl || process?.env?.DHL_ORDERING_WSDL || this.cfg?.get('stubs:DHL:ordering:wsdl');
      const username = configs?.username || process?.env?.DHL_ORDERING_USR || this.cfg?.get('stubs:DHL:ordering:username');
      const password = configs?.password || process?.env?.DHL_ORDERING_PWD || this.cfg?.get('stubs:DHL:ordering:password');
      const endPoint = configs?.endpoint || process?.env?.DHL_ORDERING_ENDPOINT || this.cfg?.get('stubs:DHL:ordering:endpoint');
      const wsdlHeaders = configs?.wsdl_header || (process?.env?.DHL_ORDERING_HEADER && JSON.parse(process?.env?.DHL_ORDERING_HEADER)) || this.cfg?.get('stubs:DHL:ordering:wsdl_header');
      try{
        this.clients[courier.id] = await soap.createClientAsync(wsdl).then(client => {
          client.setEndpoint(endPoint);
          client.setSecurity(new soap.BasicAuthSecurity(username, password));
          client.addSoapHeader(wsdlHeaders);
          return client;
        });
      }
      catch (err) {
        this.logger?.error(`${this.constructor.name}:\n Failed to create Client for '${endPoint}' \n as '${username}' \n using '${wsdl}'`);
        this.logger?.error(`${this.constructor.name}: ${JSON.stringify(err, null, 2)}`);
        throw err;
      }
      return this.clients[courier.id];
    };

    async order (requests: FlatAggregatedFulfillment[]): Promise<FlatAggregatedFulfillment[]> {
      requests = requests.filter(request => request?.courier?.id == this.courier.id);
      if (requests.length == 0) return [];
      const dhl_order_request = AggregatedFulfillmentRequests2DHLShipmentOrderRequest(requests);
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
                reject(DHLShipmentLabels2FulfillmentResponses(requests, null, status));
              }
              else {
                this.logger?.error(`${this.constructor.name}: ${JSON.stringify(err, null, 2)}`);
                const status: Status = {
                  id: null,
                  code: 500,
                  message: JSON.stringify(err, null, 2)
                };
                reject(DHLShipmentLabels2FulfillmentResponses(requests, null, status));
              }
            }
            else if (result?.html) {
              this.logger?.error(`${this.constructor.name}: ${JSON.stringify(result, null, 2)}`);
              const status: Status = {
                id: null,
                code: result.statusCode,
                message: JSON.stringify(result, null, 2)
              };
              reject(DHLShipmentLabels2FulfillmentResponses(requests, null, status));
            }
            else if (result) {
              if (result.Status.statusCode) {
                this.logger?.error(`${this.constructor.name}: ${JSON.stringify(result, null, 2)}`);
                const status: Status = {
                  id: null,
                  code: result.Status.statusCode,
                  message: JSON.stringify(result, null, 2)
                };
                reject(DHLShipmentLabels2FulfillmentResponses(requests, null, status));
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
              reject(DHLShipmentLabels2FulfillmentResponses(requests, null, status));
            }
          });
        }
        catch (err) {
          const status: Status = {
            id: null,
            code: 500,
            message: `Internal Error: ${JSON.stringify(err, null, 2)}`
          };
          reject(DHLShipmentLabels2FulfillmentResponses(requests, null, status));
        }
      });
    }

    async track (request: FlatAggregatedTrackingRequest[]): Promise<TrackingResult[]> {
      request = request.filter(request => request.fulfillment?.courier?.id == this.courier.id);
      const promises = request.map(async item => {
        try {
          const options = JSON.parse(item?.options?.value?.toString() || null);
          const tracks = item.shipment_numbers.map(shipment_number => {
            const config = JSON.parse(item?.fulfillment?.courier?.configuration?.value?.toString() || null)?.tracking;
            const client = {
              appname: config?.appname || process.env.DHL_TRACKING_APPNAME || this.cfg.get('stub:DHL:Tracking:appname') || 'zt12345',
              username: config?.username || process.env.DHL_TRACKING_USR || this.cfg.get('stub:DHL:Tracking:username'),
              password: config?.password || process.env.DHL_TRACKING_PWD || this.cfg.get('stub:DHL:Tracking:password'),
              token: config?.token || process.env.DHL_TRACKING_TOKEN || this.cfg.get('stub:DHL:Tracking:token'),
              endpoint: config?.endpoint || process.env.DHL_TRACKING_URL|| this.cfg.get('stub:DHL:Tracking:endpoint')
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
              'piece-code': shipment_number,
              'language-code': options?.['language-code'] || 'de',
              request: options?.request || 'd-get-piece-detail'
            };
            const xml = '<?xml version="1.0" encoding="UTF-8" standalone="no"?>' + js2xml({ data: { _attributes: attributes } }, {compact: true});
            return fetch(client.endpoint + '?xml=' +xml, headers).then(
              response => DHLTracking2FulfillmentTracking(item, response),
              err => {
                this.logger?.error(`${this.constructor.name}: ${err}`);
                return DHLTracking2FulfillmentTracking(item, null, err);
              }
            );
          });

          return {
            fulfillment: item.fulfillment,
            tracks: await Promise.all(await Promise.all(tracks)),
            status: {
              id: item.fulfillment_id,
              code: 200,
              message: 'OK'
            }
          };

        } catch (err) {
          this.logger?.error(`${this.constructor.name}: ${err}`);
          item.fulfillment.label.state = State.Invalid;
          return {
            fulfillment: item.fulfillment,
            tracks: null,
            status: {
              id: item.fulfillment_id,
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
      request.forEach(a => fulfillment_map[a.label.shipment_number] = a);
      const dhl_cancel_request = AggregatedFulfillment2DHLShipmentCancelRequest(request);
      const client = await this.registerSoapClient();
      return await new Promise<FlatAggregatedFulfillment[]>((resolve, reject: (v: FlatAggregatedFulfillment[]) => void): void => {
        client.GVAPI_2_0_de.GKVAPISOAP11port0.deleteShipmentOrder(dhl_cancel_request,
          (err: any, result: any, rawResponse: any, rawRequest: any): any => {
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

    async getZoneFor(address: AggregatedAddress): Promise<string> {
      return address?.country?.country_code;
    }
  };

  export const register = () => {
    DHLStub.register();
  };
}

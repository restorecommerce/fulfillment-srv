import { ResourcesAPIBase, ServiceBase, toStruct } from '@restorecommerce/resource-base-interface';
import { DatabaseProvider } from '@restorecommerce/chassis-srv';
import { Topic } from '@restorecommerce/kafka-client';
import { createShipmentDHL, trackShipmentDHL, validateShipmentDHL, getLabelsDHL } from './DHLSoapClient';
import { createServiceConfig } from '@restorecommerce/service-config';
import { dataMapping } from './utils';
import * as moment from 'moment';
import * as html2json from 'html2json';
import { parseStringPromise } from 'xml2js';

const cfg = createServiceConfig(process.cwd());
const COLLECTION_NAME = 'fulfillment';
const FULFILLED = 'Fulfilled';
const FULFILLMENT_NOT_CREATED = 'Not Created';
const FULFILLMENT_CREATED = 'Created';
const FULFILLMENT_IN_PROGRESS = 'In Progress';
const FULFILLMENT_NO_DATA_FOUND = 'No Data Found';


export class FulfillmentResourceService extends ServiceBase {
  fulfillmentResourceEvents: Topic;
  constructor(fulfillmentResourceEvents: Topic, db: any,
    cfg: any, logger: any) {
    super('fulfillment', fulfillmentResourceEvents, logger,
      new ResourcesAPIBase(db, COLLECTION_NAME, cfg.get('fieldHandlers')), true);
  }

  /**
   * Recursively adds the required 'cis:' prefix to input object keys
   *
   * @param inputObject the input
   */
  private static cisify(inputObject: any): void {
    for (let key of Object.keys(inputObject)) {
      // leave plain strings untouched
      if (typeof inputObject[key] === 'object') {
        this.cisify(inputObject[key]);
      }
      Object.assign(inputObject, { [`cis:${key}`]: inputObject[key] });
      delete inputObject[key];
    }
  }

  /**
   * Creates an Order
   *
   * @param call  list of Orders
   * @returns status of each order created
   */

  async createFulfillment(call: any): Promise<any> {
    let item: any;
    let meta: any;
    let fulfillmentResults = [];
    try {
      if (!call.request.ShipmentOrder.meta) {
        throw { code: [''], message: ['Meta information is missing']};
      }
      meta = call.request.ShipmentOrder.meta;
      if (!call.request.ShipmentOrder.fulfillmentList) {
        throw { code: [''], message: ['Fulfillment list is missing']};
      }
      if (call.request.ShipmentOrder.fulfillmentList) {
        const Item = call.request.ShipmentOrder.fulfillmentList;
        if (Item.length == 0) {
          throw { code: [''], message: ['Cannot create fulfillment with 0 orders']};
        }
      }
    } catch (error) {
      const responseDetails = {
        Status: { OrderId: '', OrderStatus: FULFILLMENT_NOT_CREATED },
        error
      };
      fulfillmentResults.push(responseDetails);
      return { fulfillmentResults };
    }
    const fulfillmentList = call.request.ShipmentOrder.fulfillmentList;
    if (fulfillmentList) {
      for (item of fulfillmentList) {
        try {
          if (!item.OrderId) {
            throw { code: [''], message: ['Order ID is missing']};
          }

          let fulfillmentsThisOrder = await super.read({
            request: {
              filter: toStruct({
                order_id: {
                  $eq: item.OrderId
                }
              })
            }
          });
          // an order may only be associated with a single fulfillment entry
          if (fulfillmentsThisOrder.total_count > 0) {
            throw { code: [''], message: ['Order already present in fulfillment database'] };
          }

          // TODO: check if order actually exists

          if (!item.fulFillmentService) {
            throw { code: [''], message: ['Courier service is missing'] };
          }

          if (!item.Shipment.ShipmentDetails) {
            throw { code: [''], message: ['Shipment data is missing'] };
          }
          if (item.Shipment.ShipmentDetails.length === 0) {
            throw { code: [''], message: ['Shipment data is empty'] };
          }
          for (let items of item.Shipment.ShipmentDetails) {
            if ((!items.ShipmentItem) || (!items.ShipmentItem.weightInKG)) {
              throw { code: [''], message: ['Shipment data is invalid'] };
            }
          }

          const receiver = item.Shipment.Receiver;
          if (!receiver) {
            throw { code: [''], message: ['Receiver data is missing'] };
          }
          if (!receiver.name1) {
            throw { code: [''], message: ['Receiver name is missing'] };
          }
          if (!receiver.Address
            || !receiver.Address.streetName
            || !receiver.Address.streetNumber
            || !receiver.Address.zip
            || !receiver.Address.city
            || !receiver.Address.Origin) {
            throw { code: [''], message: ['Receiver address data is missing (partially or entirely)'] };
          }
          if (!receiver.Address.Origin.countryISOCode) {
            throw { code: [''], message: ['Receiver country is missing'] };
          }
          if (!receiver.Communication
            || !receiver.Communication.email) {
            throw { code: [''], message: ['Receiver communication data is missing (partially or entirely)'] };
          }

          const shipper = item.Shipment.Shipper;
          if (!shipper) {
            throw { code: [''], message: ['Shipper data is missing'] };
          }
          if ((!shipper.Name) || (!shipper.Name.name1)) {
            throw { code: [''], message: ['Shipper name is missing'] };
          }
          if (!shipper.Address
            || !shipper.Address.streetName
            || !shipper.Address.streetNumber
            || !shipper.Address.zip
            || !shipper.Address.city
            || !shipper.Address.Origin) {
            throw { code: [''], message: ['Shipper address data is missing (partially or entirely)'] };
          }
          if (!shipper.Communication
            || !shipper.Communication.email) {
            throw { code: [''], message: ['Shipper communication data is missing (partially or entirely)'] };
          }

          const notification = item.Shipment.Notification;
          if (!notification) {
            throw { code: [''], message: ['Notification data is missing'] };
          }
          if (!notification.recipientEmailAddress) {
            throw { code: [''], message: ['Notification recipient e-mail address is missing'] };
          }

          let error = { code: [], message: [] };
          const de_receiver = cfg.get().receiver_country;

          let product: any;
          let accountNumber: any;

          const rcvCountry = receiver.Address.Origin.countryISOCode;

          // receiver does not have the "Name" object, just name1 string
          FulfillmentResourceService.cisify(receiver.Address);
          FulfillmentResourceService.cisify(receiver.Communication);

          FulfillmentResourceService.cisify(shipper.Name);
          FulfillmentResourceService.cisify(shipper.Address);
          FulfillmentResourceService.cisify(shipper.Communication);

          const EU_ISO_CODES_DHL: any = cfg.get().EU_ISO_CODES_DHL.codes;
          if (EU_ISO_CODES_DHL.includes(rcvCountry)) {
            if (rcvCountry === de_receiver) {
              product = cfg.get().ProdV01.Product;
              accountNumber = cfg.get().ProdV01.accountNumber;
            }
            else {
              product = cfg.get().ProdV55.Product;
              accountNumber = cfg.get().ProdV55.accountNumber;
            }
          }
          else {
            product = cfg.get().ProdV53.Product;
            accountNumber = cfg.get().ProdV53.accountNumber;
          }

          let array = item.Shipment.ShipmentDetails;
          const orderId = item.OrderId;

          let shipmentInput: any;
          let shipmentList = [];
          let shipmentNumbers = [];
          let today = moment().format('YYYY-MM-DD');

          for (let i = 0; i < array.length; i++) {
            shipmentInput = {
              sequenceNumber: cfg.get().sequenceNumber,
              Shipment: {
                ShipmentDetails: {
                  product,
                  accountNumber,
                  customerReference: orderId,
                  shipmentDate: today,
                  returnShipmentAccountNumber: '',
                  returnShipmentReference: '',
                  ShipmentItem: array[i].ShipmentItem,
                  Notification: notification,
                },
                Shipper: shipper,
                Receiver: receiver,
                ExportDocument: array[i].ShipmentItem.ExportDocument,
              },
              labelResponseType: 'URL'
            };
            shipmentList.push(shipmentInput);
          }

          const soapInput = {
            CreateShipmentOrderRequest: cfg.get().head.CreateShipmentOrderRequest,
            ShipmentOrder: shipmentList
          };

          const courierService = item.fulFillmentService;

          if (courierService === 'DHL') {
            await validateShipmentDHL(soapInput).then(
              async soapSuccess => {
                const soapResults: any = soapSuccess;
                let validationSuccess = true;

                for (let i = 0; i < soapResults.length; i++) {
                  if (soapResults[i].Status.statusCode === 0) {
                    error.code.push('');
                    error.message.push('');
                  } else {
                    validationSuccess = false;
                    error.code.push(soapResults[i].Status.statusCode);
                    error.message.push(soapResults[i].Status.statusMessage);
                  }
                }

                if (!validationSuccess) {
                  throw error;
                }
              },
              async soapError => {
                const errorMessage = await parseStringPromise(soapError.body)
                  .then(parseResult => parseResult['SOAP-ENV:Envelope']['SOAP-ENV:Body'][0]['SOAP-ENV:Fault'][0]['faultstring'][0]);
                throw { code: [''], message: ['Invalid SOAP validation request: ' + errorMessage] };
              }
            );

            await createShipmentDHL(soapInput).then(
              soapSuccess => {
                const soapResults: any = soapSuccess;
                let creationSuccess = true;

                for (let key = 0; key < soapResults.length; key++) {
                  if (soapResults[key].LabelData.Status.statusCode === 0) {
                    shipmentNumbers.push(soapResults[key].LabelData.shipmentNumber);
                    error.code.push('');
                    error.message.push('');
                  }
                  else {
                    creationSuccess = false;
                    error.code.push(soapResults[key].LabelData.Status.statusCode);
                    error.message.push(soapResults[key].LabelData.Status.statusMessage);
                  }
                };

                if (!creationSuccess) {
                  throw error;
                }
              },
              async soapError => {
                const errorMessage = await parseStringPromise(soapError.body)
                  .then(parseResult => parseResult['SOAP-ENV:Envelope']['SOAP-ENV:Body'][0]['SOAP-ENV:Fault'][0]['faultstring'][0]);
                throw { code: [''], message: ['Invalid SOAP creation request: ' + errorMessage] };
              });
          } else {
            throw { code: [''], message: ['Invalid courier: ' + courierService] };
          }

          let items = [{
            order_id: orderId, shipment_number: shipmentNumbers,
            fulfillment_status: FULFILLMENT_CREATED,
            meta,
            serviceType: courierService
          }];

          await super.create({ request: { items } });
          const fulfillmentResult = {
            Status: { OrderId: orderId, OrderStatus: FULFILLMENT_CREATED },
            error
          };
          fulfillmentResults.push(fulfillmentResult);

        } catch (error) {
          const fulfillmentResult = {
            Status: {
              OrderId: item.orderId ? item.orderId : '',
              OrderStatus: FULFILLMENT_NOT_CREATED
            },
            error
          };
          fulfillmentResults.push(fulfillmentResult);
        }
      }
    }

    return { fulfillmentResults };
  }

  /**
   * Update fulfillment status
   * @param call  job to track fulfillments status
   * @returns  order status i.e fulfilled,InProgress.
   * in case of fulfilled it emit fulfilled event.
   */
  async trackFulfillment(call: any): Promise<any> {
    let result: any;
    let shipment_numbers: any;
    let meta: any;
    let id: any;
    let Authorize: any;
    let ShipmentData: any;
    let shipmentStatus: any = [];
    let RequestType: string;
    let Status: string;
    const orderId = call.request.orderId;

    if (call.request && call.request.type === 'job') {
      ShipmentData = await super.read({
        request: {
          filter: toStruct({
            fulfillment_status: {
              $ne: FULFILLED
            }
          })
        }
      });
    } else {
      RequestType = 'gRPC';
      ShipmentData = await super.read({
        request: {
          filter: toStruct({
            order_id: {
              $eq: orderId
            }
          })
        }
      });
    }

    if (RequestType === 'gRPC') {
      if (ShipmentData.total_count === 0) {
        return {
          Status: FULFILLMENT_NO_DATA_FOUND,
          shipmentStatus: [],
          OrderId: orderId
        };
      } else if (ShipmentData.total_count > 1) {
        return {
          Status: 'Invalid fulfillment database state: multiple entries for same order',
          shipmentStatus: [],
          OrderId: orderId
        };
      }
    }

    for (let item of ShipmentData.items) {
      shipment_numbers = item.shipment_number;
      meta = item.meta;
      id = item.id;

      if (item.serviceType === 'DHL') {
        const encode_shipment_numbers = encodeURIComponent(shipment_numbers.join(';'));
        result = await trackShipmentDHL(encode_shipment_numbers).catch(err => {
        });

        if (result.includes('<html>')) {
          const testresult = html2json(result);
          if (testresult.child[0].child[1].child[1].child[0].text === 'Unauthorized') {
            Authorize = JSON.stringify(testresult.child[0].child[1].child[3].child[0].text);
            return { Status: Authorize };
          }
        }

        const jsonStatus: any = await parseStringPromise(result).then(data => data.data.data);

        shipmentStatus = await dataMapping(jsonStatus);
        let deliveryStatus = false;
        for (let eachShipment of shipmentStatus) {
          // un comment this for production fulfillments only
          // if (eachShipment.ShipmentData.Customer_Reference === OrderId) {
          if (eachShipment.ShipmentData.ShortStatus === 'Delivery successful') {
            deliveryStatus = true;
          } else {
            deliveryStatus = false;
            Status = eachShipment.ShipmentData.Status; // incase no data is found
            break;
          }
        }

        if (deliveryStatus == true) {
          let items = [{ id, fulfillment_status: FULFILLED, meta }];
          const status = { request: { items } };
          await super.update(status);
          this.fulfillmentResourceEvents.emit('fulfilled', shipmentStatus);
          if (RequestType == 'gRPC') {
            return { Status: FULFILLED, OrderId: orderId, shipmentStatus };
          }
        }
        else {
          let items = [{ id, fulfillment_status: FULFILLMENT_IN_PROGRESS, meta }];
          const status = { request: { items } };
          await super.update(status);
          if (RequestType == 'gRPC') {
            if (Status == FULFILLMENT_NO_DATA_FOUND) {
              return {
                Status, OrderId: orderId, shipmentStatus
              };
            }
            else {
              return {
                Status: FULFILLMENT_IN_PROGRESS, OrderId: orderId, shipmentStatus
              };
            }

          }
        }
      } else {
        if (RequestType == 'gRPC') {
          return {
            Status: 'Invalid courier for fulfillment ID '
            + item.id + ': '
            + item.serviceType,
            OrderId: orderId,
            shipmentStatus: []
          };
        }
      }
    }
  }

  /**
   * getLabels for fulfillments
   *
   * @param call  orderNo
   * @returns  labelUrl,ExportDocUrl,shipmentNumbers
   *
   */

  async getLabels(call: any): Promise<any> {
    let shipmentNumbers: any;
    let labels: any;
    let exportLabelUrl: any;
    let labelUrl: any;
    let shipmentNumber: any;
    const orderId = call.request.orderId;
    const shipmentData = await super.read({
      request: {
        filter: toStruct({
          order_id: {
            $eq: orderId
          }
        })
      }
    });

    if (shipmentData.total_count === 1) {
      shipmentNumbers = shipmentData.items[0].shipment_number;
    } else if (shipmentData.total_count > 1) {
      return {
        Labels: [],
        error: {
          code: '',
          message: 'Invalid fulfillment database state: multiple entries for same order'
        }
      };
    } else {
      return {
        Labels: [],
        error: {
          code: '',
          message: 'No shipments found for order ID ' + orderId
        }
      };
    }

    const courierService = shipmentData.items[0].serviceType;

    if (courierService === 'DHL') {
      let output = [];
      for (let item of shipmentNumbers) {
        let labelArg = {
          shipmentNumber: item
        };
        labels = await getLabelsDHL(labelArg);

        if (labels) {
          labels.LabelData[0].exportLabelUrl ? exportLabelUrl =
            labels.LabelData[0].exportLabelUrl : exportLabelUrl =
            'Export doc not found';
          labels.LabelData[0].labelUrl ? labelUrl =
            labels.LabelData[0].labelUrl : labelUrl =
            labels.LabelData[0].Status.statusText;
          shipmentNumber = labels.LabelData[0].shipmentNumber;
        }
        let data = { labelUrl, shipmentNumber, exportLabelUrl };
        output.push(data);
      }
      return { labels: output, error: { code: '', message: '' } };
    } else {
      return {
        Labels: [],
        error: {
          code: '',
          message: 'Invalid courier for fulfillment ID '
            + shipmentData.items[0].id + ': '
            + courierService
        }
      };
    }
  }

  /**
 * get all fulfillments
 *
 * @param call  fulfillmentStatus
 * @returns  list of fulfillments
 *
 */
  async getAllFulfillments(call: any): Promise<any> {
    const orderStatus = call.request.OrderStatus;
    const ShipmentData = await super.read({
      request: {
        filter: toStruct({
          fulfillment_status: {
            $eq: orderStatus
          }
        })
      }
    });
    for (let item of ShipmentData.items) {
      delete item.id;
      delete item.meta;
    }
    return ShipmentData.items;
  }
}


export class FulfillmentMethodResourceService extends ServiceBase {
  constructor(topic: Topic, db: DatabaseProvider, cfg: any, logger: any) {
    super('fulfillment_method', FulfillmentMethodResourceService, logger,
      new ResourcesAPIBase(db, 'fulfillment_method', cfg.get('fieldHandlers')), true);
  }
}

export class FulfillmentCourierResourceService extends ServiceBase {
  constructor(topic: Topic, db: DatabaseProvider, cfg: any, logger: any) {
    super('fulfillment_courier', topic, logger,
      new ResourcesAPIBase(db, 'fulfillment_courier'), false);
  }
}

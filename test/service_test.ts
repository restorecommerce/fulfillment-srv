import * as should from 'should';
import * as grpcClient from '@restorecommerce/grpc-client';
import * as kafkaClient from '@restorecommerce/kafka-client';
import { Worker } from '../src/worker';
import { createServiceConfig } from '@restorecommerce/service-config';
import { Topic } from '@restorecommerce/kafka-client/lib/events/provider/kafka';
import { FulfillmentResourceService } from '../src/service';
import { randomBytes } from 'crypto';

const Events = kafkaClient.Events;

/*
 * Note: To run this test, a running ArangoDB and Kafka instance is required.
 */
let cfg: any;
let worker: Worker;
let client;
let logger;
// For event listeners
let events;
let topic: Topic;
let fulfillmentService: FulfillmentResourceService;

let meta = {
  modified_by: 'SYSTEM',
  owner: [{
    id: 'urn:restorecommerce:acs:names:ownerIndicatoryEntity',
    value: 'urn:restorecommerce:acs:model:user.User'
  },
    {
      id: 'urn:restorecommerce:acs:names:ownerInstance',
      value: 'UserID'
    }]
};

async function start(): Promise<void> {
  cfg = createServiceConfig(process.cwd() + '/test');
  worker = new Worker(cfg);
  await worker.start();
}

async function connect(clientCfg: string, resourceName: string): Promise<any> { // returns a gRPC service
  logger = worker.logger;

  events = new Events(cfg.get('events:kafka'), logger);
  await (events.start());
  topic = events.topic(cfg.get(`events:kafka:topics:${resourceName}:topic`));

  client = new grpcClient.Client(cfg.get(clientCfg), logger);
  return client.connect();
}

describe('testing fulfillment-srv', () => {
  before(async function startServer(): Promise<void> {
    this.timeout(10000);

    await start();
    // disable authorization
    cfg.set('authorization:enabled', false);
    cfg.set('authorization:enforce', false);
  });


  after(async function stopServer(): Promise<void> {
    await worker.stop();
  });

  describe('testing Fulfillment service', () => {
    describe('with test client', () => {

      before(async () => {
        fulfillmentService = await connect('client:fulfillment-srv', 'jobs');
      });

      it('should create a job', async function () {
        this.timeout(5000);

        const orderId = randomBytes(16).toString('hex');

        const sampleAddress = {
          streetName: 'Example Street',
          streetNumber: '1',
          addressAddition: '',
          zip: '12345',
          city: 'Example City',
          Origin: {
            country: 'Example Country',
            countryISOCode: 'DE'
          }
        };

        const sampleCommunication = {
          phone: '1234567890',
          email: 'hello@example.com'
        };

        const result = await fulfillmentService.createFulfillment({
          ShipmentOrder: {
            fulfillmentList: [
              {
                Shipment: {
                  ShipmentDetails: [
                    {
                      ShipmentItem: {
                        weightInKG: 10.0,
                        lengthInCM: '10',
                        widthInCM: '10',
                        heightInCM: '10',
                        ExportDocument: {
                          invoiceNumber: '1234567890',
                          exportType: 'foo',
                          exportTypeDescription: 'bar',
                          termsOfTrade: 'N/A',
                          placeOfCommital: 'N/A',
                          additionalFee: 0.1,
                          ExportDocPosition: {
                            description: 'Export Doc Position Description',
                            countryCodeOrigin: 'DE',
                            customsTariffNumber: 'N/A',
                            amount: 100,
                            netWeightInKG: 10,
                            customsValue: 100
                          }
                        }
                      }
                    }
                  ],
                  Receiver: {
                    name1: 'Receiver Name',
                    Address: sampleAddress,
                    Communication: sampleCommunication
                  },
                  Shipper: {
                    Name: {
                      name1: 'Shipper Name'
                    },
                    Address: sampleAddress,
                    Communication: sampleCommunication
                  },
                  Notification: {
                    recipientEmailAddress: 'hello@example.com'
                  }
                },
                OrderId: orderId,
                fulFillmentService: 'DHL'
              }
            ],
            meta
          }
        });

        should.not.exist(result.error);
        should.exist(result);
        should.exist(result.data);
        should.exist(result.data.fulfillmentResults);
        result.data.fulfillmentResults.should.have.length(1);
        should.exist(result.data.fulfillmentResults[0].Status);
        should.exist(result.data.fulfillmentResults[0].Status.OrderId);
        should.equal(result.data.fulfillmentResults[0].Status.OrderId, orderId);
        should.exist(result.data.fulfillmentResults[0].Status.OrderStatus);
        should.equal(result.data.fulfillmentResults[0].Status.OrderStatus, 'Created');
      });
    });
  });
});

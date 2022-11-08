import {} from 'mocha';
import * as should from 'should';
import { database } from '@restorecommerce/chassis-srv';
import { GrpcClient } from '@restorecommerce/grpc-client';
import { Events, Topic } from '@restorecommerce/kafka-client';
import { Worker } from '../src/worker';
import {
  cfg,
  logger,
  samples,
  startWorker,
  connectEvents,
  connectTopics
} from './utils';
import { State } from '../src/generated/io/restorecommerce/fulfillment';

/*
 * Note: To run this test, a running ArangoDB and Kafka instance is required.
 */

describe("Testing Fulfillment Service:", () => {
  let worker: Worker;
  let events: Events;
  let topics: Topic;
  let db_client: database.DatabaseProvider;
  let courier_client: GrpcClient;
  let product_client: GrpcClient;
  let fulfillment_client: GrpcClient;

  before(async function() {
    this.timeout(15000);
    worker = await startWorker();
    events = await connectEvents();
    topics = await connectTopics(events, 'fulfillment.resource');
    db_client = await database.get(cfg.get('database:main'), logger);
    courier_client = new GrpcClient(cfg.get('client:fulfillment_courier'), logger).user;
    product_client = new GrpcClient(cfg.get('client:fulfillment_product'), logger).user;
    fulfillment_client = new GrpcClient(cfg.get('client:fulfillment'), logger).user;
    await db_client.upsert('fulfillment', samples.DHL.MockFulfillments.items);
  });

  after(async function() {
    this.timeout(15000);
    await courier_client?.delete({ collection: true });
    await product_client?.delete({ collection: true });
    await fulfillment_client?.delete({ collection: true });
    await worker?.stop();
  });

  describe("The Fulfillment Courier Service:", () => {
    it("should create a set of couriers", async () => {
      const sample = samples.DHL.CreateCouriers;
      sample.items.map((item:any) => {
        item.configuration = {
          value: Buffer.from(JSON.stringify(item.configuration)) //because Any
        }
        return item;
      });
      should.exist(sample, "samples.DHL.CreateCouriers should exist in samples.json");
      const response = await courier_client.create(sample);
      should.not.exist(response?.error, "response.error should be null");
      should.equal(response?.operation_status?.code, 200, "response.operation_status.code should be 200");
      should.exist(response?.items[0]?.payload?.id, "response.data.items[0].payload.id should exist");
    });
  });

  describe("The Fulfillment Product Service:", () => {
    it("should create a set of products", async () => {
      const sample = samples.DHL.CreateProducts;
      should.exist(sample, "samples.DHL.CreateProducts should exist in samples.json");
      const response = await product_client.create(sample);
      should.not.exist(response?.error, "response.error should be null, but: " + JSON.stringify(response));
      should.equal(response?.operation_status?.code, 200, "response.operation_status.code should be 200");
      should.exist(response?.items[0]?.payload?.id, "response.items[0].payload.id should exist");
    });

    it("should find a solution for a query of items", async () => {
      const sample = samples.DHL.ProductQuery;
      should.exist(sample, "samples.DHL.ProductQuery should exist in samples.json");
      const response = await product_client.find(sample);
      should.not.exist(response?.error, "response.error should be null, but: " + JSON.stringify(response));
      should.equal(response?.operation_status?.code, 200, "response.operation_status.code should be 200");
      should.exist(response?.items[0]?.solutions, "response.items[0].payload should exist");
    });
  });
  
  describe("The Fulfillment Service:", () => {
    let offset: any;

    const onLabelOrdered = (msg:any, context?:any): void => {
      should.equal(msg?.state, State.Ordered);
    };

    const onLabelDone = (msg:any, context?:any): void => {
      should.equal(msg?.state, State.Done);
    };

    const onFulfillmentCancelled = (msg:any, context?:any): void => {
      should.equal(msg?.labels[0].state, State.Cancelled);
    };

    before(async function() {
      this.timeout(15000);
      await topics.on('fulfillmentLabelOrdered', onLabelOrdered);
      await topics.on('fulfillmentLabelDone', onLabelDone);
      await topics.on('fulfillmentCancelled', onFulfillmentCancelled);
    });

    after(async function() {
      this.timeout(15000);
      await topics.removeListener('fulfillmentLabelOrdered', onLabelOrdered);
      await topics.removeListener('fulfillmentLabelDone', onLabelDone);
      await topics.removeListener('fulfillmentCancelled', onFulfillmentCancelled);
    });

    it("should create fulfillment orders for DHL", async function() {
      this.timeout(30000);
      const sample = samples.DHL.CreateFulfillments;
      should.exist(sample, "samples.DHL.CreateFulfillments should exist in samples.json");

      offset = await topics.$offset(-1);
      const response = await fulfillment_client.create(sample);
      should.not.exist(response?.error, "response.error should be null, but: " + JSON.stringify(response));
      should.equal(response?.operation_status?.code, 200, "response.operation_status.code should be 200");
      should.equal(response?.items[0]?.status?.code, 200, "response.items[0].status.code should be 200");
      should.ok(response?.items[0]?.payload?.labels.reduce((a:any,b:any) => a && (b?.status?.code == 200), true),
        "response.items[0].payload.labels.status.code should all be 200"
      );
    });

    it("should have received an event of 'fulfillmentLabelOrdered'", async function() {
      this.timeout(12000);
      await topics.$wait(offset);
    });

    it("should track fulfillment orders from DHL", async function() {
      this.timeout(30000);
      const sample = samples.DHL.TrackFulfillments;
      should.exist(sample, "samples.DHL.TrackFulfillments should exist in samples.json");

      offset = await topics.$offset(-1);
      const response = await fulfillment_client.track(sample);
      should.not.exist(response?.error, "response.error should be null, but: " + JSON.stringify(response));
      should.equal(response?.operation_status?.code, 200, "response.operation_status.code should be 200");
      should.equal(response?.items[0]?.status?.code, 200, "response.items[0].status.code should be 200");
      should.ok(response?.items[0]?.fulfillment?.labels.reduce((a:any,b:any) => a && (b?.status?.code == 0), true),
        "response.data.items[0].fulfillment.labels.status.code should all be 200"
      );
    });

    it("should have received an event of 'fulfillmentLabelDone'", async function() {
      this.timeout(12000);
      await topics.$wait(offset);
    });

    it("should cancel fulfillment orders of DHL", async function() {
      this.timeout(30000);
      const sample = samples.DHL.CancelFulfillments;
      should.exist(sample, "samples.DHL.CancelFulfillments should exist in samples.json");

      offset = await topics.$offset(-1);
      const response = await fulfillment_client.cancel(sample);
      should.not.exist(response?.error, "response.error should be null, but: " + JSON.stringify(response));
      should.equal(response?.operation_status?.code, 200, "response.operation_status.code should be 200");
      should.equal(response?.items[0]?.status?.code, 200, "response.items[0].status.code should be 200");
      should.equal(response?.items[0]?.payload?.labels[0]?.state?.toString(), 'Cancelled', "response.items[0]?.labels[0].state should be Cancelled");
    });

    it("should have received an event of 'fulfillmentCancelled'", async function() {
      this.timeout(12000);
      await topics.$wait(offset);
    });
  });
});
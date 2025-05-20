import {} from 'mocha';
import should from 'should';
import { Semaphore } from 'async-mutex';
import { 
  createClient,
  createChannel,
  GrpcClientConfig,
  Client
} from '@restorecommerce/grpc-client';
import { Events, Topic } from '@restorecommerce/kafka-client';
import { FulfillmentState } from '@restorecommerce/rc-grpc-clients/dist/generated/io/restorecommerce/fulfillment';
import { Fulfillment } from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/fulfillment';
import { FulfillmentServiceDefinition } from '@restorecommerce/rc-grpc-clients/dist/generated/io/restorecommerce/fulfillment';
import { FulfillmentCourierServiceDefinition } from '@restorecommerce/rc-grpc-clients/dist/generated/io/restorecommerce/fulfillment_courier';
import { FulfillmentProductServiceDefinition } from '@restorecommerce/rc-grpc-clients/dist/generated/io/restorecommerce/fulfillment_product';
import { GrpcMockServer } from '@alenon/grpc-mock-server';
import { Worker } from '../src/worker';
import {
  cfg,
  logger,
  samples,
  startWorker,
  connectEvents,
  connectTopics,
  mockServices
} from './utils';

/*
 * Note: To run this test, a running ArangoDB and Kafka instance is required.
 */
describe('Testing Fulfillment Service Cluster:', () => {
  let mocking: GrpcMockServer[];
  let worker: Worker;
  let events: Events;
  let topics: Topic;
  let courier_client: Client<FulfillmentCourierServiceDefinition>;
  let product_client: Client<FulfillmentProductServiceDefinition>;
  let fulfillment_client: Client<FulfillmentServiceDefinition>;

  before(async function() {
    this.timeout(30000);
    mocking = await mockServices(cfg.get('client'));
    worker = await startWorker();
    events = await connectEvents();
    topics = await connectTopics(events, 'fulfillment.resource');

    courier_client = createClient(
      {
        ...cfg.get('client:fulfillment_courier'),
        logger
      } as GrpcClientConfig,
      FulfillmentCourierServiceDefinition,
      createChannel(cfg.get('client:fulfillment_courier:address'))
    ) as Client<FulfillmentCourierServiceDefinition>;

    product_client = createClient(
      {
        ...cfg.get('client:fulfillment_product'),
        logger
      } as GrpcClientConfig,
      FulfillmentProductServiceDefinition,
      createChannel(cfg.get('client:fulfillment_product:address'))
    ) as Client<FulfillmentProductServiceDefinition>;
    
    fulfillment_client = createClient(
      {
        ...cfg.get('client:fulfillment'),
        logger
      } as GrpcClientConfig,
      FulfillmentServiceDefinition,
      createChannel(cfg.get('client:fulfillment:address'))
    ) as Client<FulfillmentServiceDefinition>;

    await Promise.allSettled([
      courier_client?.delete({
        collection: true,
        subject: {
          id: 'superadmin',
          token: 'superadmin',
        },
      }),
      product_client?.delete({
        collection: true,
        subject: {
          id: 'superadmin',
          token: 'superadmin',
        },
      }),
      fulfillment_client?.delete({
        collection: true,
        subject: {
          id: 'superadmin',
          token: 'superadmin',
        },
      }),
    ]);
  });

  after(async function() {
    this.timeout(30000);
    await Promise.allSettled([
      courier_client?.delete({
        collection: true,
        subject: {
          id: 'superadmin',
          token: 'superadmin',
        },
      }),
      product_client?.delete({
        collection: true,
        subject: {
          id: 'superadmin',
          token: 'superadmin',
        },
      }),
      fulfillment_client?.delete({
        collection: true,
        subject: {
          id: 'superadmin',
          token: 'superadmin',
        },
      }),
      events?.stop(),
    ]);
    await worker?.stop();
    mocking?.forEach(mock => mock?.stop());
  });

  describe('The Fulfillment Courier Service:', () => {
    for (let [sample_name, sample] of Object.entries(samples.couriers.valid)) {
      it(`should create couriers by valid samples: ${sample_name}`, async () => {
        const response = await courier_client.create(sample);
        should.equal(
          response?.operationStatus?.code, 200,
          'response.operationStatus.code expected to be 200'
        );
        should.ok(
          response?.items?.length ?? 0 > 0,
          'response.items.length expected to be greater 0',
        );
        should.ok(
          !response?.items?.some(
            item => item?.status?.code !== 200
          ),
          'response.items[*].status.code expected all to be 200'
        );
      });
    }
  });

  describe('The Fulfillment Product Service:', () => {
    for (let [sample_name, sample] of Object.entries(samples.fulfillmentProducts.valid)) {
      it(`should create fulfillmentProducts by valid samples: ${sample_name}`, async () => {
        const response = await product_client.create(sample);
        should.equal(
          response?.operationStatus?.code, 200, 
          'response.operationStatus.code expected to be 200'
        );
        should.ok(
          response?.items?.length ?? 0 > 0,
          'response.items.length expected to be greater 0',
        );
        should.ok(
          !response?.items?.some(
            item => item?.status?.code !== 200
          ),
          'response.items[*].status.code expected all to be 200'
        );
      });
    }

    for (let [sample_name, sample] of Object.entries(samples.FulfillmentSolutionQueries.valid)) {
      it(`should find PackingSolution by valid samples: ${sample_name}`, async () => {
        const response = await product_client.find(sample);
        should.equal(
          response?.operationStatus?.code, 200, 
          'response.operationStatus.code expected to be 200'
        );
        should.ok(
          response?.items?.length ?? 0 > 0,
          'response.items.length expected to be greater 0',
        );
        should.ok(
          !response?.items?.some(
            item => item?.status?.code !== 200
          ),
          'response.items[*].status.code expected all to be 200'
        );
      });
    }
  });
  
  describe('The Fulfillment Service:', () => {
    const fulfillmentCreatedSemaphore = new Semaphore(0);
    const fulfillmentSubmittedSemaphore = new Semaphore(0);
    const fulfillmentCompletedSemaphore = new Semaphore(0);
    const fulfillmentWithdrawnSemaphore = new Semaphore(0);
    const fulfillmentCancelledSemaphore = new Semaphore(0);

    const onFulfillmentCreated = (msg: Fulfillment, context?:any): void => {
      fulfillmentCreatedSemaphore.release(1);
    };

    const onFulfillmentSubmitted = (msg: Fulfillment, context?:any): void => {
      should.equal(msg?.fulfillment_state, FulfillmentState.SUBMITTED);
      fulfillmentSubmittedSemaphore.release(1);
    };

    const onFulfillmentCompleted = (msg: Fulfillment, context?:any): void => {
      should.equal(msg?.fulfillment_state, FulfillmentState.COMPLETE);
      fulfillmentCompletedSemaphore.release(1);
    };

    const onFulfillmentWithdrawn = (msg: Fulfillment, context?:any): void => {
      should.equal(msg?.fulfillment_state, FulfillmentState.WITHDRAWN);
      fulfillmentWithdrawnSemaphore.release(1);
    };

    const onFulfillmentCancelled = (msg: Fulfillment, context?:any): void => {
      should.equal(msg?.fulfillment_state, FulfillmentState.CANCELLED);
      fulfillmentCancelledSemaphore.release(1);
    };

    before(async function() {
      this.timeout(15000);
      await Promise.all([
        topics.on('fulfillmentCreated', onFulfillmentCreated),
        topics.on('fulfillmentSubmitted', onFulfillmentSubmitted),
        topics.on('fulfillmentCompleted', onFulfillmentCompleted),
        topics.on('fulfillmentWithdrawn', onFulfillmentWithdrawn),
        topics.on('fulfillmentCancelled', onFulfillmentCancelled),
      ]);
    });

    after(async function() {
      this.timeout(15000);
      await Promise.all([
        topics.removeListener('fulfillmentCreated', onFulfillmentCreated),
        topics.removeListener('fulfillmentSubmitted', onFulfillmentSubmitted),
        topics.removeListener('fulfillmentCompleted', onFulfillmentCompleted),
        topics.removeListener('fulfillmentWithdrawn', onFulfillmentWithdrawn),
        topics.removeListener('fulfillmentCancelled', onFulfillmentCancelled),
      ]);
    });

    for (let [sample_name, sample] of Object.entries(samples.fulfillments.valid)) {
      it(`should create fulfillments by valid samples: ${sample_name}`, async function() {
        const response = await fulfillment_client.create(sample);
        should.equal(
          response?.operationStatus?.code, 200,
          response.operationStatus?.message ?? 'response.operationStatus.code expected to be 200'
        );
        should.ok(
          response?.items?.length ?? 0 > 0,
          'response.items.length expected to be greater 0',
        );
        should.ok(
          !response?.items?.some(
            item => item.status?.code !== 200
          ),
          'response.items[*].status.code expected all to be 200'
        );
      });

      it(`should have received fulfillment create event for ${sample_name}`, async function() {
        this.timeout(5000);
        await fulfillmentCreatedSemaphore.acquire(1);
      });
    }

    for (let [sample_name, sample] of Object.entries(samples.fulfillments.valid)) {
      it(`should evaluate fulfillment by valid samples: ${sample_name}`, async function() {
        this.timeout(60000);
        const response = await fulfillment_client.evaluate(sample);
        should.equal(
          response?.operationStatus?.code, 200,
          [
            'response.operationStatus.code expected to be 200',
            JSON.stringify(response, null, 2)
          ].join('\n')
        );
        should.ok(
          response?.items?.length ?? 0 > 0,
          'response.items.length expected to be greater 0',
        );
        should.ok(
          !response?.items?.some(
            item => item.status?.code !== 200
          ),
          [
            'response.items[*].status.code expected all to be 200',
            JSON.stringify(response, null, 2)
          ].join('\n')
        );
      });
    }

    for (let [sample_name, sample] of Object.entries(samples.fulfillments.valid)) {
      it(`should submit fulfillment by valid samples: ${sample_name}`, async function() {
        this.timeout(60000);
        const response = await fulfillment_client.submit(sample);
        should.equal(
          response?.operationStatus?.code, 200,
          'response.operationStatus.code expected to be 200',
        );
        should.ok(
          response?.items?.length ?? 0 > 0,
          'response.items.length expected to be greater 0',
        );
        response.items!.should.matchEvery(
          item => item.status?.code === 200,
          [
            'response.items[*].status.code expected all to be 200',
            JSON.stringify(response, null, 2)
          ].join('\n')
        );
        response.items!.should.matchEvery(
          item => item.payload?.labels?.length > 0,
          'response.items[*].labels.length expected all to be greater 0',
        );
      });

      it(`should have received fulfillment submit event for ${sample_name}`, async function() {
        this.timeout(5000);
        await fulfillmentSubmittedSemaphore.acquire(1);
      });
    }

    for (let [sample_name, sample] of Object.entries(samples.trackingRequests.valid)) {
      it(`should track fulfillment by valid samples: ${sample_name}`, async function() {
        this.timeout(30000);
        const response = await fulfillment_client.track(sample);
        should.equal(
          response?.operationStatus?.code, 200,
          [
            'response.operationStatus.code expected to be 200',
            JSON.stringify(response, null, 2)
          ].join('\n')
        );
        should.ok(
          response?.items?.length ?? 0 > 0,
          'response.items.length expected to be greater 0',
        );
        should.ok(
          !response?.items?.some(
            item => item.status?.code !== 200
          ),
          [
            'response.items[*].status.code expected all to be 200',
            JSON.stringify(response, null, 2)
          ].join('\n')
        );
      });

      it(`should have received fulfillment tracking event for ${sample_name}`, async function() {
        this.timeout(5000);
        await fulfillmentCompletedSemaphore.acquire(1);
      });
    }

    for (let [sample_name, sample] of Object.entries(samples.fulfillments.valid)) {
      it(`should cancel fulfillment by valid samples: ${sample_name}`, async function() {
        this.timeout(30000);
        const response = await fulfillment_client.cancel(sample);
        should.equal(
          response?.operationStatus?.code, 200,
          [
            'response.operationStatus.code expected to be 200',
            JSON.stringify(response, null, 2)
          ].join('\n')
        );
        should.ok(
          response?.items?.length ?? 0 > 0,
          'response.items.length expected to be greater 0',
        );
        should.ok(
          !response?.items?.some(
            item => item.status?.code !== 200
          ),
          [
            'response.items[*].status.code expected all to be 200',
            JSON.stringify(response, null, 2)
          ].join('\n')
        );
      });

      it(`should have received fulfillment cancel event for ${sample_name}`, async function() {
        this.timeout(5000);
        await fulfillmentCancelledSemaphore.acquire(1);
      });
    }
  });
});

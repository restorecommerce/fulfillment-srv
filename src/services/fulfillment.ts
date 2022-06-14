import { ResourcesAPIBase, ServiceBase, FilterOperation, FilterValueType } from '@restorecommerce/resource-base-interface';
import {
  ServiceCall,
  ReadRequest
} from '@restorecommerce/resource-base-interface/lib/core/interfaces';
import { DatabaseProvider } from '@restorecommerce/chassis-srv';
import { Topic } from '@restorecommerce/kafka-client';
import { FulfillmentCourierResourceService, FulfillmentProductResourceService} from './';
import {
  FulfillmentCourier as Courier,
  FulfillmentCourierResponseList as CourierResponseList
} from '../generated/io/restorecommerce/fulfillment_courier';
import {
  FulfillmentProduct as Product,
  FulfillmentProductResponseList as ProductResponseList
} from '../generated/io/restorecommerce/fulfillment_product';
import {
  FulfillmentRequest,
  FulfillmentRequestList,
  FulfillmentResponseList,
  TrackingRequestList,
  TrackingResultList,
  TrackingRequest,
  TrackingResult,
  CancelRequestList,
  State
} from '../generated/io/restorecommerce/fulfillment';
import {
  Stub,
  AggregatedFulfillmentRequest,
  AggregatedTrackingRequest,
  mergeFulfillments,
  FlatAggregatedFulfillment,
  flattenAggregatedFulfillmentRequest,
  flattenAggregatedTrackingRequest,
  mergeTrackingResults,
  AggregatedFulfillment,
  flattenFulfillments
} from '..';

const COLLECTION_NAME = 'fulfillment';

export class FulfillmentResourceService extends ServiceBase {
  private _topic: Topic;
  private _cfg: any;
  private _fulfillment_couriers: FulfillmentCourierResourceService;
  private _fulfillment_products: FulfillmentProductResourceService;

  get topic(): Topic {
    return this._topic;
  }

  get cfg(): any {
    return this._cfg;
  }

  get fulfillment_couriers(): FulfillmentCourierResourceService {
    return this._fulfillment_couriers;
  }

  get fulfillment_products(): FulfillmentCourierResourceService {
    return this._fulfillment_products;
  }

  constructor(
    fulfillment_couriers: FulfillmentCourierResourceService,
    fulfillment_products: FulfillmentProductResourceService,
    topic: Topic,
    db: DatabaseProvider,
    cfg: any,
    logger: any
  ) {
    super(
      COLLECTION_NAME,
      topic,
      logger,
      new ResourcesAPIBase(db, COLLECTION_NAME),
      true
    );
    this._topic = topic;
    this._cfg = cfg;
    this._fulfillment_couriers = fulfillment_couriers;
    this._fulfillment_products = fulfillment_products;
  }

  private getProductsByIDs(ids: string[], context?: any): Promise<ProductResponseList> {
    const call: ServiceCall<ReadRequest> = {
      request: {
        filters: [{
          filter: [{
            field: 'id',
            operation: FilterOperation.in,
            value: JSON.stringify(ids),
            type: FilterValueType.ARRAY
          }]
        }]
      }
    };
    return this.fulfillment_products.read(call, context);
  }

  private getCouriersByIDs(ids: string[], context?: any): Promise<CourierResponseList> {
    const call: ServiceCall<ReadRequest> = {
      request: {
        filters: [{
          filter: [{
            field: 'id',
            operation: FilterOperation.in,
            value: JSON.stringify(ids),
            type: FilterValueType.ARRAY
          }]
        }]
      }
    };
    return this.fulfillment_couriers.read(call, context);
  }

  private getFulfillmentsByIDs(ids: string[], context?: any): Promise<FulfillmentResponseList> {
    const call: ServiceCall<ReadRequest> = {
      request: {
        filters: [{
          filter: [{
            field: 'id',
            operation: FilterOperation.in,
            value: JSON.stringify(ids),
            type: FilterValueType.ARRAY
          }]
        }]
      }
    };
    return this.read(call, context);
  }

  private getAllUnfulfilledFulfillments(context?: any): Promise<FulfillmentResponseList> {
    const call: ServiceCall<ReadRequest> = {
      request: {
        filters: [{
          filter: [{
            field: 'fulfilled',
            operation: FilterOperation.neq,
            value: 'true',
            type: FilterValueType.BOOLEAN
          }]
        }]
      }
    };
    return this.read(call, context);
  }

  private async aggregateFulfillmentRequest(orders: FulfillmentRequest[], context?: any): Promise<AggregatedFulfillmentRequest[]>
  {
    const product_map: {[id: string]: Product} = {};
    const productIds = [].concat(...orders.map(item => item.order.parcels.map(product => product.productId)));
    await this.getProductsByIDs(productIds, context).then(response =>
      Object.assign(product_map, ...response.items.map(item => ({ [item.payload.id]:item.payload })))
    );

    const courier_map: {[id: string]: Courier} = {};
    const courierIds = Object.values(product_map).map(product => product.courierId);

    await this.getCouriersByIDs(courierIds, context).then(response =>
      Object.assign(courier_map, ...response.items.map(item => ({ [item.payload.id]:item.payload })))
    );

    const aggregatedFulfillmentRequests = orders.map((item): AggregatedFulfillmentRequest => {
      const products = item.order.parcels.map(parcel => product_map[parcel.productId]);
      const couriers = products.map(product => courier_map[product.courierId]);
      return Object.assign({ products, couriers }, item);
    });

    this.registerStubsFor(aggregatedFulfillmentRequests);
    return aggregatedFulfillmentRequests;
  }

  private registerStubsFor(requests: AggregatedFulfillmentRequest[]): void
  {
    requests.forEach(request =>
      request.couriers.forEach(courier =>
        Stub.instantiate(courier, { cfg:this.cfg, logger:this.logger })
      )
    );
  }

  private async aggregateFulfillments(ids: string[], context?: any): Promise<{[id: string]: AggregatedFulfillment}> {
    const fulfillments = await this.getFulfillmentsByIDs(ids);
    const product_map: {[id: string]: Product} = {};
    const productIds = [].concat(...fulfillments.items.map(item => item.payload.order.parcels.map(product => product.productId)));
    await this.getProductsByIDs(productIds, context).then(response =>
      Object.assign(product_map, ...response.items.map(item => ({ [item.payload.id]:item.payload })))
    );

    const courier_map: {[id: string]: Courier} = {};
    const courierIds = Object.values(product_map).map(product => product.courierId);
    await this.getCouriersByIDs(courierIds, context).then(response =>
      Object.assign(courier_map, ...response.items.map(item => ({ [item.payload.id]:item.payload })))
    );

    const aggregatedFulfillments = Object.assign({}, ...fulfillments.items.map((item): any => {
      const products = item.payload.order.parcels.map(parcel => product_map[parcel.productId]);
      const couriers = products.map(product => courier_map[product.courierId]);
      return { [item.payload.id] : Object.assign(item.payload, { products, couriers }) };
    }));

    return aggregatedFulfillments;
  }

  private async aggregateTracking(tracking: TrackingRequest[], context?: any): Promise<AggregatedTrackingRequest[]> {
    const aggregatedFulfillments = tracking ?
      await this.aggregateFulfillments(tracking.map((item: TrackingRequest) => item.fulfillmentId), context) :
      await this.getAllUnfulfilledFulfillments(context);
    const aggregatedTrackingRequests = tracking.map(item =>
      Object.assign(item, {
        fulfillment: aggregatedFulfillments[item.fulfillmentId],
        shipmentNumbers: item.shipmentNumbers.concat(
          aggregatedFulfillments[item.fulfillmentId].labels.map((label: any) => label.shipmentNumber)
        )
      })
    );

    return aggregatedTrackingRequests;
  }

  async create(call: ServiceCall<FulfillmentRequestList>, context?: any): Promise<FulfillmentResponseList> {
    const requests = await this.aggregateFulfillmentRequest(call.request.items, context);
    const flatRequests = flattenAggregatedFulfillmentRequest(requests);
    const promises = Object.values(Stub.REGISTER).map(stub => stub.order(flatRequests));
    const responses: FlatAggregatedFulfillment[] = [].concat(...await Promise.all(promises));
    const items = mergeFulfillments(responses);

    await Promise.all(items.map(item =>
      Promise.all(item.labels.map(label =>
        this.topic.emit(`fulfillmentLabel${State[label.state]}`, label)
      ))
    ));

    return super.create({
      request: {
        items
      }
    }, context);
  }

  async track(call: ServiceCall<TrackingRequestList>, context?: any): Promise<TrackingResultList> {
    const requests = await this.aggregateTracking(call.request?.items, context);
    const flatRequests = flattenAggregatedTrackingRequest(requests);
    const promises = Object.values(Stub.REGISTER).map(stub => stub.track(flatRequests));
    const response: TrackingResult[] = [].concat(...await Promise.all(promises));
    const items = mergeTrackingResults(response);

    await Promise.all(items.map(async item => {
      await Promise.all(item.fulfillment.labels.map(label =>
        this.topic.emit(`fulfillmentLabel${State[label.state]}`, label)
      ));
      if (item.fulfillment.fulfilled) {
        await this.topic.emit(`fulfillmentFulfilled`, item.fulfillment);
      }
    }));

    const updateResults = await super.update({
      request: {
        items: items.map(item => item.fulfillment)
      }
    }, context);
    return {
      items,
      operationStatus: updateResults.operationStatus
    };
  }

  async cancel(call: ServiceCall<CancelRequestList>, context?: any): Promise<FulfillmentResponseList> {
    const fulfillments = await this.aggregateFulfillments(call.request.ids);
    const flatFulfillments = flattenFulfillments(Object.values(fulfillments));
    const promises = Object.values(Stub.REGISTER).map(stub => stub.cancel(flatFulfillments));
    const responses: FlatAggregatedFulfillment[] = [].concat(...await Promise.all(promises));
    const items = mergeFulfillments(responses);

    items.forEach(item =>
      this.topic.emit(`fulfillmentCancelled`, item)
    );

    return super.update({
      request: {
        items
      }
    }, context);
  }
}
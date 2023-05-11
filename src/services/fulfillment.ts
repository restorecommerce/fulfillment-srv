import { ResourcesAPIBase, ServiceBase } from '@restorecommerce/resource-base-interface';
import { DatabaseProvider } from '@restorecommerce/chassis-srv';
import { Topic } from '@restorecommerce/kafka-client';
import { DeepPartial } from '@restorecommerce/kafka-client/lib/protos';
import { ReadRequest } from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/resource_base';
import { Filter_Operation, Filter_ValueType } from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/filter';
import {
  FulfillmentCourierListResponse as CourierResponseList
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/fulfillment_courier';
import {
  FulfillmentProductListResponse as ProductResponseList
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/fulfillment_product';
import {
  State,
  FulfillmentListResponse,
  Fulfillment,
  FulfillmentList,
  FulfillmentIdList,
  FulfillmentServiceImplementation,
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/fulfillment';
import { FulfillmentCourierService, FulfillmentProductService} from './';
import {
  Stub,
  Courier,
  Product,
  AggregatedFulfillment,
  mergeFulfillments,
  FlatAggregatedFulfillment,
  flattenAggregatedFulfillments,
} from '..';
import { Subject } from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/auth';

const FULFILLMENT_SUBMIT_EVENT = 'fulfillmentSubmitted';
const FULFILLMENT_INVALID_EVENT = 'fulfillmentInvalid';
const FULFILLMENT_TRACK_EVENT = 'fulfillmentTracked';
const FULFILLMENT_FULFILL_EVENT = 'fulfillmentFulfilled';
const FULFILLMENT_CANCEL_EVENT = 'fulfillmentCancelled';
const FULFILLMENT_FAILED_EVENT = 'fulfillmentFailed';

export class FulfillmentService
  extends ServiceBase<FulfillmentListResponse, FulfillmentList>
  implements FulfillmentServiceImplementation
{
  constructor(
    readonly fulfillmentCourierSrv: FulfillmentCourierService,
    readonly fulfillmentProductSrv: FulfillmentProductService,
    readonly topic: Topic,
    readonly db: DatabaseProvider,
    readonly cfg: any,
    readonly logger: any,
  ) {
    super(
      cfg.get('database:main:entities:0'),
      topic,
      logger,
      new ResourcesAPIBase(db, cfg.get('database:main:collections:0')),
      true
    );
  }

  private getProductsByIDs(ids: string[], context?: any): Promise<DeepPartial<ProductResponseList>> {
    const request = ReadRequest.fromPartial({
      filters: [{
        filter: [{
          field: 'id',
          operation: Filter_Operation.in,
          value: JSON.stringify(ids),
          type: Filter_ValueType.ARRAY
        }]
      }]
    });
    return this.fulfillmentProductSrv.read(request, context);
  }

  private getCouriersByIDs(ids: string[], context?: any): Promise<DeepPartial<CourierResponseList>> {
    const request = ReadRequest.fromPartial({
      filters: [{
        filter: [{
          field: 'id',
          operation: Filter_Operation.in,
          value: JSON.stringify(ids),
          type: Filter_ValueType.ARRAY
        }]
      }]
    });
    return this.fulfillmentCourierSrv.read(request, context);
  }

  private getFulfillmentsByIDs(ids: string[], context?: any): Promise<DeepPartial<FulfillmentListResponse>> {
    const request = ReadRequest.fromPartial({
      filters: [{
        filter: [{
          field: 'id',
          operation: Filter_Operation.in,
          value: JSON.stringify(ids),
          type: Filter_ValueType.ARRAY
        }]
      }]
    });
    return this.read(request, context);
  }

  private async aggregateFulfillments(fulfillments: Fulfillment[], subject: Subject, context?: any): Promise<AggregatedFulfillment[]>
  {
    const product_map = await this.getProductsByIDs(
      Object.keys(product_map),
      context
    ).then(
      response => response.items.forEach(
        item => product_map[item.payload.id] = item as Product
      )
    );
    
    
    {[id: string]: Product} = {};
    fulfillments.forEach(
      item => item.packing.parcels.forEach(
        product => product_map[product.product_id] = null
      )
    );
    

    const courier_map = await this.getCouriersByIDs(
      Object.values(product_map).map(
        product => product.payload.courier_id
      ),
      context
    ).then(
      response => {
        if (response.operation_status?.code === 200) {
          return response.items.reduce(
            (a, b) => {
              a[b.status.id] = b as Courier;
              return a;
            },
            {} as {[id: string]: Courier}
          );
        }
        else {
          throw response.operation_status;
        }
      }
    );

    const aggregatedFulfillmentRequests = fulfillments.map((item): AggregatedFulfillment => {
      const aggregated = { ...item } as AggregatedFulfillment;
      aggregated.products = item.packing.parcels.map(parcel => product_map[parcel.product_id]);
      aggregated.couriers = aggregated.products.map(product => courier_map[product.payload.courier_id]);
      return aggregated;
    });

    return aggregatedFulfillmentRequests;
  }

  private registerStubsFor(requests: AggregatedFulfillment[]): void {
    requests.forEach(request =>
      request.couriers.forEach(courier =>
        Stub.getInstance(courier, { cfg:this.cfg, logger:this.logger })
      )
    );
  }

  async submit(request: FulfillmentList, context?: any): Promise<DeepPartial<FulfillmentListResponse>> {
    try {
      const fulfillments = await this.aggregateFulfillments(request.items, request.subject, context);
      const flat_fulfillments = flattenAggregatedFulfillments(fulfillments);
      const promises = Stub.submit(flat_fulfillments, { cfg:this.cfg, logger:this.logger });
      const responses: FlatAggregatedFulfillment[] = [].concat(...await Promise.all(promises));
      const items = mergeFulfillments(responses);

      const upsert_results = await super.upsert({
        items,
        total_count: items.length,
        subject: request.subject
      }, context);

      upsert_results.items.forEach(item => {
        if (item.payload.state === State.Invalid) {
          this.topic.emit(FULFILLMENT_INVALID_EVENT, item)
        }
        else {
          this.topic.emit(FULFILLMENT_SUBMIT_EVENT, item)
        }
      });
      return upsert_results;
    }
    catch (err) {
      this.logger.error(err);
      return {
        items: [],
        total_count: 0,
        operation_status: {
          code: 500,
          message: err.toString(),
        }
      }
    }
  }

  async track(request: FulfillmentIdList, context?: any): Promise<DeepPartial<FulfillmentListResponse>> {
    const request_map = new Map(request.items.map(item => [item.id, item.shipment_numbers]));
    const fulfillments = await this.getFulfillmentsByIDs(request.items.map(item => item.id)).then(
      response => response.items.map(item => item.payload as Fulfillment)
    );
    const agg_fulfillments = await this.aggregateFulfillments(fulfillments, context);
    const flat_fulfillments = flattenAggregatedFulfillments(agg_fulfillments).filter(
      f => {
        const shipment_numbers = request_map.get(f.id);
        return !shipment_numbers?.length || shipment_numbers.find(s => s === f.labels[0].shipment_number)
      }
    );
    const promises = Stub.track(flat_fulfillments);
    const response: FlatAggregatedFulfillment[] = [].concat(...await Promise.all(promises));
    const items = mergeFulfillments(response);

    const update_results = await super.update({
      items,
      total_count: items.length,
      subject: request.subject
    }, context);

    update_results.items.forEach(item => {
      if (item.payload.state === State.Fulfilled) {
        this.topic.emit(FULFILLMENT_FULFILL_EVENT, item);
      }
      else if (item.payload.state === State.Failed) {
        this.topic.emit(FULFILLMENT_FAILED_EVENT, item);
      }
      else {
        this.topic.emit(FULFILLMENT_TRACK_EVENT, item);
      }
    });

    return update_results;
  }

  async cancel(request: FulfillmentIdList, context?: any): Promise<DeepPartial<FulfillmentListResponse>> {
    const request_map = new Map(request.items.map(item => [item.id, item.shipment_numbers]));
    const fulfillments = await this.getFulfillmentsByIDs(request.items.map(item => item.id)).then(
      response => response.items.map(item => item.payload as Fulfillment)
    );
    const agg_fulfillments = await this.aggregateFulfillments(fulfillments, context);
    const flat_fulfillments = flattenAggregatedFulfillments(agg_fulfillments).filter(
      f => {
        const shipment_numbers = request_map.get(f.id);
        return !shipment_numbers?.length || shipment_numbers.find(s => s === f.labels[0].shipment_number)
      }
    );
    const promises = Stub.cancel(flat_fulfillments);
    const responses: FlatAggregatedFulfillment[] = [].concat(...await Promise.all(promises));
    const items = mergeFulfillments(responses);

    const update_results = await super.update({
      items,
      total_count: items.length,
      subject: request.subject
    }, context);

    update_results.items.forEach(item => {
      if (item.payload.state === State.Invalid) {
        this.topic.emit(FULFILLMENT_INVALID_EVENT, item)
      }
      else {
        this.topic.emit(FULFILLMENT_CANCEL_EVENT, item);
      }
    });

    return update_results;
  }
}
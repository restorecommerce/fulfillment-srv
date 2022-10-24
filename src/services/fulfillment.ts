import { Client } from 'nice-grpc';
import { createClient, createChannel, GrpcClientConfig } from '@restorecommerce/grpc-client';
import { ResourcesAPIBase, ServiceBase } from '@restorecommerce/resource-base-interface';
import { DatabaseProvider } from '@restorecommerce/chassis-srv';
import { Topic } from '@restorecommerce/kafka-client';
import { DeepPartial } from '@restorecommerce/kafka-client/lib/protos';
import { ReadRequest } from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/resource_base';
import { Filter_Operation, Filter_ValueType } from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/filter';
import {
  Country,
  CountryListResponse,
  ServiceDefinition as CountryServiceDefinition
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/country';
import {
  FulfillmentCourier as Courier,
  FulfillmentCourierResponseList as CourierResponseList
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/fulfillment_courier';
import {
  FulfillmentProduct as Product,
  FulfillmentProductResponseList as ProductResponseList
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/fulfillment_product';
import {
  State,
  FulfillmentListResponse,
  Fulfillment,
  FulfillmentList,
  FulfillmentIdList,
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/fulfillment';
import { FulfillmentCourierService, FulfillmentProductService} from './';
import {
  Stub,
  AggregatedFulfillment,
  //AggregatedTrackingRequest,
  mergeFulfillments,
  FlatAggregatedFulfillment,
  flattenAggregatedFulfillments,
  //flattenAggregatedTrackingRequest,
  //mergeTrackingResults,
  //flattenFulfillments
} from '..';

const ENTITY_NAME = 'fulfillment';
const COLLECTION_NAME = 'fulfillments';
const FULFILLMENT_SUBMIT_EVENT = 'fulfillmentSubmitted';
const FULFILLMENT_INVALID_EVENT = 'fulfillmentInvalid';
const FULFILLMENT_TRACK_EVENT = 'fulfillmentTracked';
const FULFILLMENT_FULFILL_EVENT = 'fulfillmentFulfilled';
const FULFILLMENT_CANCEL_EVENT = 'fulfillmentCancelled';
const FULFILLMENT_FAILED_EVENT = 'fulfillmentFailed';

export class FulfillmentService extends ServiceBase<FulfillmentListResponse, FulfillmentList> {

  private _countryClient: Client<CountryServiceDefinition> = null;

  constructor(
    private _fulfillmentCourierSrv: FulfillmentCourierService,
    private _fulfillmentProductSrv: FulfillmentProductService,
    private _topic: Topic,
    _db: DatabaseProvider,
    private _cfg: any,
    _logger: any,
  ) {
    super(
      ENTITY_NAME,
      _topic,
      _logger,
      new ResourcesAPIBase(_db, COLLECTION_NAME),
      true
    );
  }

  get topic(): Topic {
    return this._topic;
  }

  get cfg(): any {
    return this._cfg;
  }

  get countryClient(): Client<CountryServiceDefinition> {
    if (!this._countryClient) {
      this._countryClient = createClient(
        {
          ...this.cfg.get('client:country'),
          logger: this.logger
        } as GrpcClientConfig,
        CountryServiceDefinition,
        createChannel(this.cfg.get('client:country').address)
      ) as Client<CountryServiceDefinition>;
    }
    return this._countryClient;
  }

  get fulfillmentCourierSrv(): FulfillmentCourierService {
    return this._fulfillmentCourierSrv;
  }

  get fulfillmentProductSrv(): FulfillmentProductService {
    return this._fulfillmentProductSrv;
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

  private getCountriesByIDs(ids: string[], context?: any): Promise<DeepPartial<CountryListResponse>> {
    const request = {
      filters: [{
        filter: [{
          field: 'id',
          operation: Filter_Operation.in,
          value: JSON.stringify(ids),
          type: Filter_ValueType.ARRAY
        }]
      }]
    };
    return this.countryClient.read(request, context);
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

  private getAllUnfulfilledFulfillments(context?: any): Promise<DeepPartial<FulfillmentListResponse>> {
    const request = ReadRequest.fromPartial({
      filters: [{
        filter: [{
          field: 'state',
          operation: Filter_Operation.neq,
          value: 'Done'
        }]
      }]
    });
    return this.read(request, context);
  }

  private async aggregateFulfillments(fulfillments: Fulfillment[], context?: any): Promise<AggregatedFulfillment[]>
  {
    const product_map: {[id: string]: Product} = {};
    fulfillments.forEach(
      item => item.order.parcels.forEach(
        product => product_map[product.product_id] = null
      )
    );
    await this.getProductsByIDs(Object.keys(product_map), context).then(
      response => response.items.forEach(
        item => product_map[item.payload.id] = item.payload as Product
      )
    );

    const courier_map: {[id: string]: Courier} = {};
    Object.values(product_map).forEach(
      product => courier_map[product.courier_id] = null
    );
    await this.getCouriersByIDs(Object.keys(courier_map), context).then(
      response => response.items.forEach(
        item => courier_map[item.payload.id] = item.payload as Courier
      )
    );

    const country_map: {[id: string]: Country} = {};
    fulfillments.forEach(item => {
      country_map[item.order.sender.address.country_id] = null;
      country_map[item.order.receiver.address.country_id] = null;
    });
    await this.getCountriesByIDs(Object.keys(country_map), context).then(
      response => response.items.forEach(
        item => country_map[item.payload.id] = item.payload as Country
      )
    );

    const aggregatedFulfillmentRequests = fulfillments.map((item): AggregatedFulfillment => {
      const aggregated = { ...item } as AggregatedFulfillment;
      aggregated.products = item.order.parcels.map(parcel => product_map[parcel.product_id]);
      aggregated.couriers = aggregated.products.map(product => courier_map[product.courier_id]);
      aggregated.order.sender.address.country = country_map[item.order.sender.address.country_id]
      return aggregated;
    });

    this.registerStubsFor(aggregatedFulfillmentRequests);
    return aggregatedFulfillmentRequests;
  }

  private registerStubsFor(requests: AggregatedFulfillment[]): void {
    requests.forEach(request =>
      request.couriers.forEach(courier =>
        Stub.instantiate(courier, { cfg:this.cfg, logger:this.logger })
      )
    );
  }

  /*
  private async aggregateTracking(tracking: FulfillmentIdList, context?: any): Promise<AggregatedTrackingRequest[]> {
    const fulfillment_ids = tracking.items.map((item) => item.id);
    const fulfillments = await this.getFulfillmentsByIDs(fulfillment_ids, context).then(
      response => response.items.map(item => item.payload as Fulfillment)
    );
    const aggregatedFulfillments = this.aggregateFulfillments(fulfillments, context);
    const aggregatedTrackingRequests = tracking.map(item => ({
      ...item,
      fulfillment: aggregatedFulfillments[item.fulfillment_id],
      shipment_numbers: item.shipment_numbers.concat(
        aggregatedFulfillments[item.fulfillment_id].labels.map((label: any) => label.shipmentNumber)
      )
    }));
    return aggregatedTrackingRequests;
  }
  */

  async submit(request: FulfillmentList, context?: any): Promise<DeepPartial<FulfillmentListResponse>> {
    const requests = await this.aggregateFulfillments(request.items, context);
    const flat_requests = flattenAggregatedFulfillments(requests);
    const promises = Object.values(Stub.REGISTER).map(stub => stub.order(flat_requests));
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

  async track(request: FulfillmentIdList, context?: any): Promise<DeepPartial<FulfillmentListResponse>> {
    const request_map = new Map(request.items.map(item => [item.id, item.shipment_numbers]));
    const fulfillments = await this.getFulfillmentsByIDs(request.items.map(item => item.id)).then(
      response => response.items.map(item => item.payload as Fulfillment)
    );
    const agg_fulfillments = await this.aggregateFulfillments(fulfillments, context);
    const flat_fulfillments = flattenAggregatedFulfillments(agg_fulfillments).filter(
      f => {
        const shipment_numbers = request_map.get(f.id);
        return !shipment_numbers?.length || shipment_numbers.find(s => s === f.label.shipment_number)
      }
    );
    const promises = Object.values(Stub.REGISTER).map(stub => stub.track(flat_fulfillments));
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
        return !shipment_numbers?.length || shipment_numbers.find(s => s === f.label.shipment_number)
      }
    );
    const promises = Object.values(Stub.REGISTER).map(stub => stub.cancel(flat_fulfillments));
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
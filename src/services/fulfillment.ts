import { 
  ResourcesAPIBase,
  ServiceBase
} from '@restorecommerce/resource-base-interface';
import { DatabaseProvider } from '@restorecommerce/chassis-srv';
import { Topic } from '@restorecommerce/kafka-client';
import { DeepPartial } from '@restorecommerce/kafka-client/lib/protos';
import { ReadRequest } from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/resource_base';
import {
  OperationStatus,
  Status,
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/status';
import {
  Filter_Operation,
  Filter_ValueType,
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/filter';
import {
  GrpcClientConfig,
  createChannel,
  createClient,
  Client
} from '@restorecommerce/grpc-client';
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
import { Subject } from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/auth';
import { AddressServiceDefinition } from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/address';
import {
  CountryListResponse,
  CountryResponse,
  CountryServiceDefinition,
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/country';
import { TaxResponse, TaxServiceDefinition, VAT } from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/tax';
import { TaxTypeServiceDefinition } from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/tax_type';
import { 
  FulfillmentCourierService,
  FulfillmentProductService
} from './';
import {
  Stub,
  ProductResponseMap,
  ProductResponse,
  AggregatedFulfillment,
  mergeFulfillments,
  flatMapAggregatedFulfillments,
  CourierResponse,
  CourierResponseMap,
  StateRank,
  CountryResponseMap,
  TaxResponseMap,
  applyVat,
  getVat,
} from '..';

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
  private readonly address_service: Client<AddressServiceDefinition>;
  private readonly country_service: Client<CountryServiceDefinition>;
  private readonly tax_service: Client<TaxServiceDefinition>;
  private readonly tax_type_service: Client<TaxTypeServiceDefinition>;

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

    Stub.cfg = cfg;
    Stub.logger = logger;

    this.address_service = createClient(
      {
        ...cfg.get('client:address'),
        logger
      } as GrpcClientConfig,
      AddressServiceDefinition,
      createChannel(cfg.get('client:address').address)
    );

    this.country_service = createClient(
      {
        ...cfg.get('client:country'),
        logger
      } as GrpcClientConfig,
      CountryServiceDefinition,
      createChannel(cfg.get('client:country').address)
    );

    this.tax_service = createClient(
      {
        ...cfg.get('client:tax'),
        logger
      } as GrpcClientConfig,
      TaxServiceDefinition,
      createChannel(cfg.get('client:tax').address)
    );

    this.tax_type_service = createClient(
      {
        ...cfg.get('client:tax_type'),
        logger
      } as GrpcClientConfig,
      TaxTypeServiceDefinition,
      createChannel(cfg.get('client:tax_type').address)
    );
  }

  private handleError(e: any) {
    this.logger.error(e);
    return {
      items: [],
      total_count: 0,
      operation_status: {
        code: e?.code ?? 500,
        message: e?.message ?? e?.details ?? e?.toString(),
      }
    };
  }

  private getTaxesByCountryIDs(
    ids: string[],
    subject?: Subject,
    context?: any
  ): Promise<DeepPartial<ProductResponseList>> {
    ids = [...new Set(ids).values()];
    if (ids.length > 1000) {
      throw {
        code: 500,
        message: 'Query for taxes exceeds limit of 1000!'
      } as OperationStatus
    }

    const request = ReadRequest.fromPartial({
      filters: [{
        filter: [{
          field: 'country_id',
          operation: Filter_Operation.in,
          value: JSON.stringify(ids),
          type: Filter_ValueType.ARRAY
        }]
      }],
      subject
    });
    return this.tax_service.read(request, context);
  }

  private getTaxTypesByIDs(
    ids: string[],
    subject?: Subject,
    context?: any
  ): Promise<DeepPartial<ProductResponseList>> {
    ids = [...new Set(ids).values()];
    if (ids.length > 1000) {
      throw {
        code: 500,
        message: 'Query for taxes exceeds limit of 1000!'
      } as OperationStatus
    }

    const request = ReadRequest.fromPartial({
      filters: [{
        filter: [{
          field: 'id',
          operation: Filter_Operation.in,
          value: JSON.stringify(ids),
          type: Filter_ValueType.ARRAY
        }]
      }],
      subject
    });
    return this.tax_type_service.read(request, context);
  }

  private getProductsByIDs(
    ids: string[],
    subject?: Subject,
    context?: any
  ): Promise<DeepPartial<ProductResponseList>> {
    ids = [...new Set(ids).values()];
    if (ids.length > 1000) {
      throw {
        code: 500,
        message: 'Query for products exceeds limit of 1000!'
      } as OperationStatus
    }

    const request = ReadRequest.fromPartial({
      filters: [{
        filter: [{
          field: 'id',
          operation: Filter_Operation.in,
          value: JSON.stringify(ids),
          type: Filter_ValueType.ARRAY
        }]
      }],
      subject
    });
    return this.fulfillmentProductSrv.read(request, context);
  }

  private getCouriersByIDs(
    ids: string[],
    subject?: Subject,
    context?: any
  ): Promise<DeepPartial<CourierResponseList>> {
    ids = [...new Set(ids).values()];
    if (ids.length > 1000) {
      throw {
        code: 500,
        message: 'Query for couriers exceeds limit of 1000!'
      } as OperationStatus
    }

    const request = ReadRequest.fromPartial({
      filters: [{
        filter: [{
          field: 'id',
          operation: Filter_Operation.in,
          value: JSON.stringify(ids),
          type: Filter_ValueType.ARRAY
        }]
      }],
      subject
    });
    return this.fulfillmentCourierSrv.read(request, context);
  }

  private getCountriesByIDs(
    ids: string[],
    subject?: Subject,
    context?: any
  ): Promise<DeepPartial<CountryListResponse>> {
    ids = [...new Set(ids).values()];
    if (ids.length > 1000) {
      throw {
        code: 500,
        message: 'Query for couriers exceeds limit of 1000!'
      } as OperationStatus
    }

    const request = ReadRequest.fromPartial({
      filters: [{
        filter: [{
          field: 'id',
          operation: Filter_Operation.in,
          value: JSON.stringify(ids),
          type: Filter_ValueType.ARRAY
        }]
      }],
      subject
    });
    return this.country_service.read(request, context);
  }

  private getFulfillmentsByIDs(ids: string[], subject?: Subject, context?: any): Promise<DeepPartial<FulfillmentListResponse>> {
    ids = [...new Set(ids).values()];
    if (ids.length > 1000) {
      throw {
        code: 500,
        message: 'Query for fulfillments exceeds limit of 1000!'
      } as OperationStatus
    }

    const request = ReadRequest.fromPartial({
      filters: [{
        filter: [{
          field: 'id',
          operation: Filter_Operation.in,
          value: JSON.stringify(ids),
          type: Filter_ValueType.ARRAY
        }]
      }],
      subject
    });
    return this.read(request, context);
  }

  private getProductMap(ids: string[], subject?: Subject, context?: any): Promise<ProductResponseMap> {
    return this.getProductsByIDs(
      ids,
      subject,
      context
    ).then(
      response => {
        if (response.operation_status?.code === 200) {
          return response.items.reduce(
            (a, b) => {
              a[b.payload?.id ?? b.status?.id] = b as ProductResponse;
              return a;
            },
            {} as ProductResponseMap
          );
        }
        else {
          throw response.operation_status;
        }
      }
    ); 
  }

  private getCourierMap(ids: string[], subject?: Subject, context?: any): Promise<CourierResponseMap> {
    return this.getCouriersByIDs(
      ids,
      subject,
      context,
    ).then(
      response => {
        if (response.operation_status?.code === 200) {
          return response.items.reduce(
            (a, b) => {
              a[b.payload?.id ?? b.status?.id] = b as CourierResponse;
              return a;
            },
            {} as CourierResponseMap
          );
        }
        else {
          throw response.operation_status;
        }
      }
    );
  }

  private getCountryMap(ids: string[], subject?: Subject, context?: any): Promise<CountryResponseMap> {
    return this.getCountriesByIDs(
      ids,
      subject,
      context,
    ).then(
      response => {
        if (response.operation_status?.code === 200) {
          return response.items.reduce(
            (a, b) => {
              a[b.payload?.id ?? b.status?.id] = b as CountryResponse;
              return a;
            },
            {} as CountryResponseMap
          );
        }
        else {
          throw response.operation_status;
        }
      }
    );
  }

  private getTaxMap(country_ids: string[], subject?: Subject, context?: any): Promise<TaxResponseMap> {
    return this.getProductsByIDs(
      country_ids,
      subject,
      context
    ).then(
      response => {
        if (response.operation_status?.code === 200) {
          return response.items.reduce(
            (a, b) => {
              a[b.payload?.id ?? b.status?.id] = b as TaxResponse;
              return a;
            },
            {} as TaxResponseMap
          );
        }
        else {
          throw response.operation_status;
        }
      }
    ); 
  }

  private async aggregateFulfillments(
    fulfillments: Fulfillment[],
    subject?: Subject,
    context?: any,
    evaluate?: boolean,
  ): Promise<AggregatedFulfillment[]> {
    const country_map = await this.getCountryMap(
      [
        ...fulfillments.map(
          f => f.packaging?.sender?.address?.country_id
        ),
        ...fulfillments.map(
          f => f.packaging?.receiver?.address?.country_id
        ),
      ],
      subject,
      context,
    );

    const product_map = await this.getProductMap(
      fulfillments.flatMap(
        f => f.packaging.parcels.map(p => p.product_id)
      ),
      subject,
      context,
    );

    const courier_map = await this.getCourierMap(
      Object.values(
        product_map
      ).filter(
        product => product.status?.code === 200
      ).map(
        product => product.payload?.courier_id
      ),
      subject,
      context,
    );

    const aggregatedFulfillmentRequests = fulfillments.map((item): AggregatedFulfillment => {
      const sender_country = country_map[item.packaging?.sender?.address?.country_id];
      const receiver_country = country_map[item.packaging?.sender?.address?.country_id];
      const products = item.packaging.parcels.map(
        parcel => product_map[parcel?.product_id]
      );
      const couriers = products.flatMap(
        product => courier_map[product.payload?.courier_id]
      );
      const status = [
        sender_country.status,
        receiver_country.status,
        ...products.map(p => p.status),
        ...couriers.map(c => c.status),
      ] as Status[];

      if (evaluate) {
        const tax_map = this.getTaxMap(
          [sender_country.payload.id, receiver_country.payload.id],
          subject,
          context,
        );

        const tax_type_map = {};

        item.packaging.parcels.forEach(
          p => {
            const product = product_map[p.product_id]?.payload;
            const variant = product?.variants.find(
              v => v.id === p.variant_id
            );
            const taxes = product.tax_ids.map(
              tax_id => tax_map[tax_id]
            ).filter(
              tax => !!tax
            );

            p.price = variant.price + taxes.reduce(
              (sum, tax) => sum + applyVat(
                variant.price,
                tax.payload?.rate ?? 0,
                tax_type_map[tax.payload?.id].behavior,
              ),
              0
            ),
            p.vats = taxes.map(
              tax => ({
                tax_id: tax.id,
                vat: getVat(
                  variant.price,
                  tax.payload?.rate,
                  tax_type_map[tax.payload?.id].behavior,
                )
              })
            );
          }
        );
      }

      return {
        payload: item,
        products,
        couriers,
        sender_country,
        receiver_country,
        status: status.reduce(
          (a, b) => b.code > a.code ? b : a,
          {
            id: item.id,
            code: 200,
            message: 'OK'
          }
        )
      } as AggregatedFulfillment;
    });

    return aggregatedFulfillmentRequests;
  }

  async evaluate(
    request: FulfillmentList,
    context?: any,
  ): Promise<DeepPartial<FulfillmentListResponse>> {
    try {
      const fulfillments = await this.aggregateFulfillments(request.items, request.subject, context);
      const flat_fulfillments = flatMapAggregatedFulfillments(fulfillments);
      const invalid_fulfillments = flat_fulfillments.filter(f => f.status?.code !== 200);
      const promises = Stub.evaluate(flat_fulfillments.filter(f => f.status?.code === 200));
      const responses = (await Promise.all(promises)).flatMap(f => f);
      const items = mergeFulfillments([
        ...responses,
        ...invalid_fulfillments,
      ]);

      return {
        items,
        total_count: items.length,
        operation_status: {
          code: 200,
          message: 'OK',
        }
      };
    }
    catch (e) {
      return this.handleError(e);
    }
  }

  async submit(
    request: FulfillmentList,
    context?: any
  ): Promise<DeepPartial<FulfillmentListResponse>> {
    try {
      const fulfillments = await this.aggregateFulfillments(request.items, request.subject, context);
      const flat_fulfillments = flatMapAggregatedFulfillments(fulfillments);
      const invalid_fulfillments = flat_fulfillments.filter(
        f => f.status?.code !== 200 || StateRank[f.payload?.state] >= StateRank[State.Submitted]
      );
      const promises = Stub.submit(flat_fulfillments.filter(f => f.status?.code === 200));
      const responses = (await Promise.all(promises)).flatMap(f => f);
      const items = mergeFulfillments([
        ...responses,
        ...invalid_fulfillments,
      ]);

      const upsert_results = await super.upsert({
        items: items.filter(
          f => f.status?.code === 200
        ).map(
          f => f.payload
        ),
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

      upsert_results.items.push(
        ...items.filter(i => i.status?.code !== 200)
      );
      upsert_results.total_count = upsert_results.items.length;
      return upsert_results;
    }
    catch (e) {
      return this.handleError(e);
    }
  }

  async track(
    request: FulfillmentIdList,
    context?: any
  ): Promise<DeepPartial<FulfillmentListResponse>> {
    try {
      const request_map = request.items.reduce(
        (a, b) => {
          a[b.id] = b.shipment_numbers;
          return a;
        },
        {}
      );
  
      const fulfillments = await this.getFulfillmentsByIDs(
        request.items.map(item => item.id),
        request.subject,
        context,
      ).then(
        response => response.items.map(item => item.payload as Fulfillment)
      );
  
      const agg_fulfillments = await this.aggregateFulfillments(
        fulfillments,
        request.subject,
        context,
      );
  
      const flat_fulfillments = flatMapAggregatedFulfillments(
        agg_fulfillments,
      ).map(
        f => {
          const id = f.status?.id;
          if (!f.payload?.labels?.length) {
            f.status = {
              id: id,
              code: 400,
              message: `Fulfillment ${id} has no labels!`
            }
          }
          else if (f.payload?.state !== State.Submitted && f.payload?.state !== State.InTransit) {
            f.status = {
              id: id,
              code: 400,
              message: `For tracking Fulfillment ${
                id
              } is expected to be ${
                State.Submitted
              } or ${
                State.InTransit
              } but is ${
                f.payload?.state
              }!`
            }
          }

          return f;
        }
      );
  
      const invalid_fulfillments = flat_fulfillments.filter(
        f => f.status?.code !== 200
      );
      
      const promises = Stub.track(flat_fulfillments.filter(
        f => {
          const shipment_numbers = request_map[f.payload?.id];
          return f.status?.code === 200 &&
            !shipment_numbers?.length ||
            shipment_numbers.find(
            s => s === f.payload?.labels[0]?.shipment_number
          )
        }
      ));

      const response = (await Promise.all(promises)).flatMap(f => f);
      const items = mergeFulfillments([
        ...response,
        ...invalid_fulfillments,
      ]);
  
      const update_results = await super.update({
        items: items.filter(
          f => f.status?.code === 200
        ).map(
          f => f.payload
        ),
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
  
      update_results.items.push(
        ...items.filter(i => i.status?.code !== 200)
      );
      update_results.total_count = update_results.items.length;
      return update_results;
    }
    catch (e) {
      return this.handleError(e);
    }
  }

  async withdraw(request: FulfillmentIdList, context?: any): Promise<DeepPartial<FulfillmentListResponse>> {
    return null;
  }

  async cancel(request: FulfillmentIdList, context?: any): Promise<DeepPartial<FulfillmentListResponse>> {
    try {
      const request_map = request.items.reduce(
        (a, b) => {
          a[b.id] = b.shipment_numbers;
          return a;
        },
        {}
      );
  
      const fulfillments = await this.getFulfillmentsByIDs(
        request.items.map(item => item.id),
        request.subject,
        context
      ).then(
        response => response.items.map(
          item => item.payload as Fulfillment
        )
      );
  
      const agg_fulfillments = await this.aggregateFulfillments(
        fulfillments,
        request.subject,
        context
      );
  
      const flat_fulfillments = flatMapAggregatedFulfillments(
        agg_fulfillments,
      ).map(
        f => {
          const id = f.status?.id;
          if (!f.payload?.labels?.length) {
            f.status = {
              id: id,
              code: 400,
              message: `Fulfillment ${id} has no labels!`
            }
          }
          else if (f.payload?.state !== State.Submitted && f.payload?.state !== State.InTransit) {
            f.status = {
              id: id,
              code: 400,
              message: `For canceling Fulfillment ${
                id
              } is expected to be ${
                State.Submitted
              } or ${
                State.InTransit
              } but is ${
                f.payload?.state
              }!`
            }
          }
  
          return f;
        }
      );
      
      const invalid_fulfillments = flat_fulfillments.filter(
        f => f.status?.code !== 200
      );
  
      const promises = Stub.track(flat_fulfillments.filter(
        f => {
          const shipment_numbers = request_map[f.payload?.id];
          return f.status?.code === 200 &&
            !shipment_numbers?.length ||
            shipment_numbers.find(
            s => s === f.payload?.labels[0]?.shipment_number
          )
        }
      ));
  
      const response = (await Promise.all(promises)).flatMap(f => f);
      const items = mergeFulfillments([
        ...response,
        ...invalid_fulfillments,
      ]);
  
      const update_results = await super.update({
        items: items.filter(
          f => f.status?.code === 200
        ).map(
          f => f.payload
        ),
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
  
      update_results.items.push(
        ...items.filter(i => i.status?.code !== 200)
      );
      update_results.total_count = update_results.items.length;
      return update_results;
    }
    catch (e) {
      return this.handleError(e);
    }
  }
}
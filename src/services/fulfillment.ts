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
  StatusListResponse,
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/status';
import {
  Filter_Operation,
  Filter_ValueType,
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/filter';
import {
  Client,
  GrpcClientConfig,
  createChannel,
  createClient,
} from '@restorecommerce/grpc-client';
import {
  State,
  FulfillmentListResponse,
  Fulfillment,
  FulfillmentList,
  FulfillmentIdList,
  FulfillmentServiceImplementation,
  InvoiceRequestList,
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/fulfillment';
import { Subject } from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/auth';
import { AddressServiceDefinition } from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/address';
import {
  CountryServiceDefinition,
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/country';
import { TaxServiceDefinition } from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/tax';
import { 
  FulfillmentCourierService,
  FulfillmentProductService
} from './';
import {
  Stub,
  ProductResponseMap,
  AggregatedFulfillment,
  mergeFulfillments,
  flatMapAggregatedFulfillments,
  CourierResponseMap,
  StateRank,
  CountryResponseMap,
  TaxResponseMap,
  CRUDClient,
  CustomerResponseMap,
  ShopResponseMap,
  OrganizationResponseMap,
  ContactPointResponseMap,
  AddressResponseMap,
  filterTax,
} from '..';
import { InvoiceListResponse } from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/invoice';
import { ContactPointResponse, ContactPointServiceDefinition } from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/contact_point';
import { CustomerServiceDefinition } from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/customer';
import { ShopServiceDefinition } from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/shop';
import { OrganizationServiceDefinition } from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/organization';
import { VAT } from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/amount';

export class FulfillmentService
  extends ServiceBase<FulfillmentListResponse, FulfillmentList>
  implements FulfillmentServiceImplementation
{
  private readonly status_codes: { [key: string]: Status } = {
    OK: {
      id: '',
      code: 200,
      message: 'OK',
    },
    NOT_FOUND: {
      id: '',
      code: 404,
      message: '{entity} {id} not found!',
    },
    NO_LEGAL_ADDRESS: {
      id: '',
      code: 404,
      message: '{entity} {id} has no legal address!',
    },
  };

  private readonly operation_status_codes: { [key: string]: OperationStatus} = {
    SUCCESS: {
      code: 200,
      message: 'SUCCESS',
    },
    PARTIAL: {
      code: 400,
      message: 'Patrial executed with errors!',
    },
    LIMIT_EXHAUSTED: {
      code: 500,
      message: 'Query limit 1000 exhausted!',
    },
  };

  protected readonly emitters: any;
  protected readonly legal_address_type_id: string;
  protected readonly customer_service: Client<CustomerServiceDefinition>;
  protected readonly shop_service: Client<ShopServiceDefinition>;
  protected readonly organization_service: Client<OrganizationServiceDefinition>;
  protected readonly contact_point_service: Client<ContactPointServiceDefinition>;
  protected readonly address_service: Client<AddressServiceDefinition>;
  protected readonly country_service: Client<CountryServiceDefinition>;
  protected readonly tax_service: Client<TaxServiceDefinition>;

  constructor(
    readonly fulfillmentCourierSrv: FulfillmentCourierService,
    readonly fulfillmentProductSrv: FulfillmentProductService,
    readonly topic: Topic,
    readonly db: DatabaseProvider,
    readonly cfg: any,
    readonly logger: any,
  ) {
    super(
      cfg.get('database:main:entities:0') ?? 'fulfillment',
      topic,
      logger,
      new ResourcesAPIBase(
        db,
        cfg.get('database:main:collections:0') ?? 'fulfillments',
        cfg.get('fieldHandlers:fulfillment'),
      ),
      !!cfg.get('events:enableEvents'),
    );

    Stub.cfg = cfg;
    Stub.logger = logger;

    this.status_codes = {
      ...this.status_codes,
      ...cfg.get('statusCodes'),
    };

    this.operation_status_codes = {
      ...this.operation_status_codes,
      ...cfg.get('operationStatusCodes'),
    };

    this.emitters = cfg.get('events:emitters');
    this.legal_address_type_id = this.cfg.get('preDefinedIds:legalAddressTypeId');

    this.customer_service = createClient(
      {
        ...cfg.get('client:customer'),
        logger
      } as GrpcClientConfig,
      CustomerServiceDefinition,
      createChannel(cfg.get('client:customer').address)
    );

    this.shop_service = createClient(
      {
        ...cfg.get('client:shop'),
        logger
      } as GrpcClientConfig,
      ShopServiceDefinition,
      createChannel(cfg.get('client:shop').address)
    );

    this.organization_service = createClient(
      {
        ...cfg.get('client:organization'),
        logger
      } as GrpcClientConfig,
      OrganizationServiceDefinition,
      createChannel(cfg.get('client:organization').address)
    );

    this.contact_point_service = createClient(
      {
        ...cfg.get('client:contact_point'),
        logger
      } as GrpcClientConfig,
      ContactPointServiceDefinition,
      createChannel(cfg.get('client:contact_point').address)
    );

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
  }

  private createStatusCode(
    entity: string,
    id: string,
    status: Status,
    error?: string,
  ): Status {
    return {
      id,
      code: status?.code ?? 500,
      message: status?.message?.replace(
        '{error}', error
      ).replace(
        '{entity}', entity
      ).replace(
        '{id}', id
      ) ?? 'Unknown status',
    };
  }

  private throwStatusCode<T>(
    entity: string,
    id: string,
    status: Status,
    error?: string,
  ): T {
    throw this.createStatusCode(
      entity,
      id,
      status,error
    );
  }

  private createOperationStatusCode(
    entity: string,
    status: OperationStatus,
  ): OperationStatus {
    return {
      code: status?.code ?? 500,
      message: status?.message?.replace(
        '{entity}', entity
      ) ?? 'Unknown status',
    };
  }

  private catchStatusError<T>(id: string, e: any, payload = null): T {
    this.logger?.warn(e);
    return {
      payload,
      status: {
        id,
        code: e?.code ?? 500,
        message: e?.message ?? e?.details ?? e?.toString(),
      }
    } as T;
  }

  private catchOperationError<T>(e: any): T {
    this.logger?.error(e);
    return {
      items: [],
      total_count: 0,
      operation_status: {
        code: e?.code ?? 500,
        message: e?.message ?? e?.details ?? e?.toString(),
      }
    } as T;
  }

  private get<T>(
    ids: string[],
    service: CRUDClient,
    subject?: Subject,
    context?: any,
  ): Promise<T> {
    ids = [...new Set<string>(ids)];
    const entity = typeof ({} as T);

    if (ids.length > 1000) {
      throw this.createOperationStatusCode(
        entity,
        this.operation_status_codes.LIMIT_EXHAUSTED,
      );
    }

    const request = ReadRequest.fromPartial({
      filters: [{
        filters: [
          {
            field: 'id',
            operation: Filter_Operation.in,
            value: JSON.stringify(ids),
            type: Filter_ValueType.ARRAY,
          }
        ]
      }],
      limit: ids.length,
      subject,
    });

    return service.read(
      request,
      context,
    ).then(
      response => {
        if (response.operation_status?.code === 200) {
          return response.items?.reduce(
            (a, b) => {
              a[b.payload?.id] = b;
              return a;
            }, {} as T
          );
        }
        else {
          throw response.operation_status;
        }
      }
    );
  }

  async getById<T>(map: { [id:string]: T }, id: string): Promise<T> {
    if (id in map) {
      return map[id];
    }
    else {
      this.throwStatusCode<T>(
        'Object',
        id,
        this.status_codes.NOT_FOUND
      );
    }
  }

  async getByIds<T>(map: { [id:string]: T }, ids: string[]): Promise<T[]> {
    return Promise.all(ids.map(
      id => this.getById(map, id)
    ));
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
        filters: [{
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

  private async aggregateFulfillments(
    fulfillments: Fulfillment[],
    subject?: Subject,
    context?: any,
    evaluate?: boolean,
  ): Promise<AggregatedFulfillment[]> {
    const customer_map = await this.get<CustomerResponseMap>(
      fulfillments.map(q => q.customer_id),
      this.customer_service,
      subject,
      context,
    );

    const shop_map = await this.get<ShopResponseMap>(
      fulfillments.map(q => q.shop_id),
      this.shop_service,
      subject,
      context,
    );

    const orga_map = await this.get<OrganizationResponseMap>(
      [
        ...Object.values(shop_map).map(
          item => item.payload?.organization_id
        ),
        ...Object.values(customer_map).map(
          item => item.payload?.commercial?.organization_id
            ?? item.payload?.public_sector?.organization_id
        ),
      ],
      this.organization_service,
      subject,
      context,
    );

    const contact_point_map = await this.get<ContactPointResponseMap>(
      [
        ...Object.values(orga_map).flatMap(
          item => item.payload?.contact_point_ids
        ),
        ...Object.values(customer_map).flatMap(
          item => item.payload?.private?.contact_point_ids
        ),
      ],
      this.contact_point_service,
      subject,
      context,
    );

    const address_map = await this.get<AddressResponseMap>(
      Object.values(contact_point_map).map(
        item => item.payload?.physical_address_id
      ),
      this.address_service,
      subject,
      context,
    );

    const country_map = await this.get<CountryResponseMap>(
      Object.values(address_map).map(
        item => item.payload?.country_id
      ),
      this.country_service,
      subject,
      context,
    );

    const product_map = await this.get<ProductResponseMap>(
      fulfillments.flatMap(
        f => f.packaging.parcels.map(p => p.product_id)
      ),
      this.fulfillmentProductSrv,
      subject,
      context,
    );

    const courier_map = await this.get<CourierResponseMap>(
      Object.values(product_map).map(
        p => p.payload?.courier_id
      ),
      this.fulfillmentCourierSrv,
      subject,
      context,
    );

    const tax_map = await this.get<TaxResponseMap>(
      Object.values(product_map).flatMap(
        p => p.payload?.tax_ids
      ),
      this.tax_service,
      subject,
      context,
    );

    const promises = fulfillments.map(async (item): Promise<AggregatedFulfillment> => {
      try {
        const sender_country = await this.getById(
          country_map,
          item.packaging.sender?.address?.country_id,
        );

        const recipient_country = await this.getById(
          country_map,
          item.packaging.recipient?.address?.country_id,
        );

        const products = await this.getByIds(
          product_map,
          item.packaging.parcels.map(
            parcel => parcel?.product_id
          ),
        );

        const couriers = await this.getByIds(
          courier_map,
          products.map(
            product => product.payload?.courier_id
          )
        );

        const status: Status[] = [
          sender_country?.status,
          recipient_country?.status,
          ...products?.map(p => p?.status),
          ...couriers?.map(c => c?.status),
        ];

        const shop_country = await this.getById(
          shop_map,
          item.shop_id
        ).then(
          shop => this.getById(
            orga_map,
            shop.payload?.organization_id
          )
        ).then(
          orga => this.getByIds(
            contact_point_map,
            orga.payload?.contact_point_ids
          )
        ).then(
          cpts => cpts.find(
            cpt => cpt.payload?.contact_point_type_ids.indexOf(
              this.legal_address_type_id
            ) >= 0
          ) ?? this.throwStatusCode<ContactPointResponse>(
            typeof(item),
            item.id,
            this.status_codes.NO_LEGAL_ADDRESS,
          )
        ).then(
          contact_point => this.getById(
            address_map,
            contact_point.payload?.physical_address_id,
          )
        ).then(
          address => this.getById(
            country_map,
            address.payload?.country_id
          )
        );

        const customer = await this.getById(
          customer_map,
          item.customer_id
        );

        const customer_country = await this.getByIds(
          contact_point_map,
          [
            customer.payload.private?.contact_point_ids,
            orga_map[customer.payload.commercial?.organization_id]?.payload.contact_point_ids,
            orga_map[customer.payload.public_sector?.organization_id]?.payload.contact_point_ids,
          ].flatMap(id => id).filter(id => id)
        ).then(
          cps => cps.find(
            cp => cp.payload?.contact_point_type_ids.indexOf(
              this.legal_address_type_id
            ) >= 0
          ) ?? this.throwStatusCode<ContactPointResponse>(
            typeof(item),
            item.id,
            this.status_codes.NO_LEGAL_ADDRESS,
          )
        ).then(
          cp => this.getById(
            address_map,
            cp.payload.physical_address_id,
          )
        ).then(
          address => this.getById(
            country_map,
            address.payload.country_id
          )
        );

        if (evaluate) {
          item.packaging.parcels.forEach(
            p => {
              const product = product_map[p.product_id].payload;
              const variant = product.variants.find(
                v => v.id === p.variant_id
              );
              const price = variant?.price;
              const taxes = product.tax_ids.map(
                id => tax_map[id]?.payload
              ).filter(
                tax => filterTax(
                  tax,
                  shop_country.payload,
                  customer_country.payload,
                  !!customer.payload.private?.user_id,
                )
              )
              const gross = price.sale ? price.sale_price : price.regular_price;
              const vats = taxes.map((tax): VAT => ({
                tax_id: tax.id,
                vat: gross * tax.rate,
              }));
              const net = vats.reduce((a, b) => a + b.vat, gross);

              p.price = variant.price;
              p.amount = {
                currency_id: price.currency_id,
                gross,
                net,
                vats,
              }
            }
          );
        }

        const aggreagatedFulfillment: AggregatedFulfillment = {
          payload: item,
          products,
          couriers,
          sender_country,
          recipient_country,
          options: null,
          status: status.reduce(
            (a, b) => b.code > a.code ? b : a,
            {
              id: item.id,
              code: 200,
              message: 'OK'
            }
          )
        };

        return aggreagatedFulfillment;
      }
      catch (error) {
        return this.catchStatusError<AggregatedFulfillment>(item?.id, error, item);
      }
    });

    return await Promise.all(promises);
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
      return this.catchOperationError<FulfillmentListResponse>(e);
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
        f => f.status?.code !== 200 || StateRank[f.payload?.state] >= StateRank[State.SUBMITTED]
      );
      const promises = Stub.submit(flat_fulfillments.filter(f => f.status?.code === 200));
      const responses = (await Promise.all(promises)).flatMap(f => f);
      console.log(responses);
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
        if (item.payload.state in this.emitters) {
          switch (item.payload.state) {
            case State.INVALID, State.FAILED:
              this.topic.emit(this.emitters[item.payload.state], item);
            default:
              this.topic.emit(this.emitters[item.payload.state], item.payload);
              break;
          }
        }
      });

      upsert_results.items.push(
        ...items.filter(i => i.status?.code !== 200)
      );
      upsert_results.total_count = upsert_results.items.length;
      return upsert_results;
    }
    catch (e) {
      return this.catchOperationError<FulfillmentListResponse>(e);
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
          else if (f.payload?.state !== State.SUBMITTED && f.payload?.state !== State.IN_TRANSIT) {
            f.status = {
              id: id,
              code: 400,
              message: `For tracking Fulfillment ${
                id
              } is expected to be ${
                State.SUBMITTED
              } or ${
                State.IN_TRANSIT
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
        if (item.payload.state in this.emitters) {
          switch (item.payload.state) {
            case State.INVALID, State.FAILED:
              this.topic.emit(this.emitters[item.payload.state], item);
            default:
              this.topic.emit(this.emitters[item.payload.state], item.payload);
              break;
          }
        }
      });
  
      update_results.items.push(
        ...items.filter(i => i.status?.code !== 200)
      );
      update_results.total_count = update_results.items.length;
      return update_results;
    }
    catch (e) {
      return this.catchOperationError<FulfillmentListResponse>(e);
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
          else if (f.payload?.state !== State.SUBMITTED && f.payload?.state !== State.IN_TRANSIT) {
            f.status = {
              id: id,
              code: 400,
              message: `For canceling Fulfillment ${
                id
              } is expected to be ${
                State.SUBMITTED
              } or ${
                State.IN_TRANSIT
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
        if (item.payload.state in this.emitters) {
          switch (item.payload.state) {
            case State.INVALID, State.FAILED:
              this.topic.emit(this.emitters[item.payload.state], item);
            default:
              this.topic.emit(this.emitters[item.payload.state], item.payload);
              break;
          }
        }
      });
  
      update_results.items.push(
        ...items.filter(i => i.status?.code !== 200)
      );
      update_results.total_count = update_results.items.length;
      return update_results;
    }
    catch (e) {
      return this.catchOperationError<FulfillmentListResponse>(e);
    }
  }

  async createInvoice(
    request: InvoiceRequestList,
    context: any
  ): Promise<DeepPartial<InvoiceListResponse>> {
    return null;
  }
  
  async triggerInvoice(
    request: InvoiceRequestList,
    context: any
  ): Promise<DeepPartial<StatusListResponse>> {
    return null;
  }
}
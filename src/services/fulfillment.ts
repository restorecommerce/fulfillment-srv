import {
  ResourcesAPIBase,
  ServiceBase
} from '@restorecommerce/resource-base-interface';
import {
  ACSClientContext,
  AuthZAction,
  access_controlled_function,
  access_controlled_service,
  DefaultACSClientContextFactory,
  Operation,
  DefaultResourceFactory,
  injects_meta_data,
  resolves_subject
} from '@restorecommerce/acs-client';
import { type Logger } from '@restorecommerce/logger';
import { type ServiceConfig } from '@restorecommerce/service-config';
import { type DatabaseProvider } from '@restorecommerce/chassis-srv';
import { Topic } from '@restorecommerce/kafka-client';
import {
  DeleteRequest,
  ReadRequest
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/resource_base.js';
import {
  OperationStatus,
  Status,
  StatusListResponse,
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/status.js';
import {
  Filter_Operation,
  Filter_ValueType,
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/filter.js';
import {
  Client,
  GrpcClientConfig,
  createChannel,
  createClient,
} from '@restorecommerce/grpc-client';
import { type CallContext } from 'nice-grpc-common';
import {
  FulfillmentState,
  FulfillmentListResponse,
  Fulfillment,
  FulfillmentList,
  FulfillmentIdList,
  FulfillmentServiceImplementation,
  FulfillmentInvoiceRequestList,
  FulfillmentResponse,
  FulfillmentId,
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/fulfillment.js';
import { Subject } from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/auth.js';
import { Address, AddressServiceDefinition, ShippingAddress } from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/address.js';
import {
  Country,
  CountryServiceDefinition,
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/country.js';
import { Tax, TaxServiceDefinition } from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/tax.js';
import { InvoiceListResponse } from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/invoice.js';
import {
  ContactPoint,
  ContactPointResponse,
  ContactPointServiceDefinition
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/contact_point.js';
import {
  Customer,
  CustomerServiceDefinition
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/customer.js';
import {
  Credential,
  CredentialServiceDefinition
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/credential.js';
import {
  Shop,
  ShopServiceDefinition
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/shop.js';
import {
  Organization,
  OrganizationServiceDefinition
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/organization.js';
import { VAT } from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/amount.js';
import { FulfillmentProduct } from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/fulfillment_product.js';
import { FulfillmentCourierService } from './fulfillment_courier.js';
import { FulfillmentProductService } from './fulfillment_product.js';
import {
  AggregatedFulfillment,
  mergeFulfillments,
  flatMapAggregatedFulfillments,
  StateRank,
  CRUDClient,
  filterTax,
  throwOperationStatusCode,
  throwStatusCode,
  createStatusCode,
  createOperationStatusCode,
  ResponseMap,
  Courier,
  unique,
} from './../utils.js';
import { Stub } from './../stub.js';


@access_controlled_service
export class FulfillmentService
  extends ServiceBase<FulfillmentListResponse, FulfillmentList>
  implements FulfillmentServiceImplementation
{
  private static async ACSContextFactory(
    self: FulfillmentService,
    request: FulfillmentList & FulfillmentIdList & FulfillmentInvoiceRequestList & DeleteRequest,
    context: any,
  ): Promise<ACSClientContext> {
    const ids = request.ids ?? request.items?.map((item: any) => item.id);
    const resources = await self.getFulfillmentsByIds(ids, request.subject, context);
    return {
      ...context,
      subject: request.subject,
      resources: [
        ...resources.items ?? [],
        ...request.items ?? [],
      ],
    };
  }

  protected readonly status_codes: { [key: string]: Status } = {
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
    NO_SHIPPING_ADDRESS: {
      id: '',
      code: 404,
      message: '{entity} {id} has no shipping address!',
    },
    NO_LABEL: {
      id: '',
      code: 404,
      message: '{entity} {id} has no label!',
    },
    NOT_SUBMITTED: {
      id: '',
      code: 400,
      message: '{entity} {id} is not submitted!',
    },
    SHOP_ID_NOT_IDENTICAL: {
      id: '',
      code: 400,
      message: '{entity} {id} Fulfillment.shopId must be listed in Courier.shopIds!',
    },
  };

  protected readonly operation_status_codes: { [key: string]: OperationStatus } = {
    SUCCESS: {
      code: 200,
      message: 'SUCCESS',
    },
    PARTIAL: {
      code: 207,
      message: 'Patrial executed with errors!',
    },
    LIMIT_EXHAUSTED: {
      code: 500,
      message: 'Query limit 1000 exhausted!',
    },
    TIMEOUT: {
      code: 500,
      message: 'Request timeout, API not responding!',
    },
  };

  protected readonly emitters: any;
  protected readonly customer_service: Client<CustomerServiceDefinition>;
  protected readonly shop_service: Client<ShopServiceDefinition>;
  protected readonly organization_service: Client<OrganizationServiceDefinition>;
  protected readonly contact_point_service: Client<ContactPointServiceDefinition>;
  protected readonly address_service: Client<AddressServiceDefinition>;
  protected readonly country_service: Client<CountryServiceDefinition>;
  protected readonly tax_service: Client<TaxServiceDefinition>;
  protected readonly credential_service: Client<CredentialServiceDefinition>;
  protected readonly tech_user: Subject;
  protected readonly contact_point_type_ids = {
    legal: 'legal',
    shipping: 'shipping',
    billing: 'billing',
  };

  constructor(
    readonly fulfillmentCourierSrv: FulfillmentCourierService,
    readonly fulfillmentProductSrv: FulfillmentProductService,
    readonly topic: Topic,
    readonly db: DatabaseProvider,
    readonly cfg: ServiceConfig,
    readonly logger: Logger,
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
      cfg.get('events:enableEvents')?.toString() === 'true',
    );

    Stub.cfg = cfg;
    Stub.logger = logger;
    this.isEventsEnabled = cfg.get('events:enableEvents')?.toString() === 'true';

    this.status_codes = {
      ...this.status_codes,
      ...cfg.get('statusCodes'),
    };

    this.operation_status_codes = {
      ...this.operation_status_codes,
      ...cfg.get('operationStatusCodes'),
    };

    this.emitters = cfg.get('events:emitters');
    this.contact_point_type_ids = {
      ...this.contact_point_type_ids,
      ...cfg.get('contactPointTypeIds')
    };

    this.customer_service = createClient(
      {
        ...cfg.get('client:customer'),
        logger
      } as GrpcClientConfig,
      CustomerServiceDefinition,
      createChannel(cfg.get('client:customer:address'))
    );

    this.shop_service = createClient(
      {
        ...cfg.get('client:shop'),
        logger
      } as GrpcClientConfig,
      ShopServiceDefinition,
      createChannel(cfg.get('client:shop:address'))
    );

    this.organization_service = createClient(
      {
        ...cfg.get('client:organization'),
        logger
      } as GrpcClientConfig,
      OrganizationServiceDefinition,
      createChannel(cfg.get('client:organization:address'))
    );

    this.contact_point_service = createClient(
      {
        ...cfg.get('client:contact_point'),
        logger
      } as GrpcClientConfig,
      ContactPointServiceDefinition,
      createChannel(cfg.get('client:contact_point:address'))
    );

    this.address_service = createClient(
      {
        ...cfg.get('client:address'),
        logger
      } as GrpcClientConfig,
      AddressServiceDefinition,
      createChannel(cfg.get('client:address:address'))
    );

    this.country_service = createClient(
      {
        ...cfg.get('client:country'),
        logger
      } as GrpcClientConfig,
      CountryServiceDefinition,
      createChannel(cfg.get('client:country:address'))
    );

    this.tax_service = createClient(
      {
        ...cfg.get('client:tax'),
        logger
      } as GrpcClientConfig,
      TaxServiceDefinition,
      createChannel(cfg.get('client:tax:address'))
    );

    this.credential_service = createClient(
      {
        ...cfg.get('client:credential'),
        logger
      } as GrpcClientConfig,
      CredentialServiceDefinition,
      createChannel(cfg.get('client:credential:address'))
    );

    this.tech_user = cfg.get('tech_user');
  }

  protected handleStatusError<T>(id: string, e: any, payload?: any): T {
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

  protected handleOperationError<T>(e: any, items?: any[]): T {
    this.logger?.error(e);
    return {
      items,
      total_count: items?.length ?? 0,
      operation_status: {
        code: e?.code ?? 500,
        message: e?.message ?? e?.details ?? e?.toString(),
      }
    } as T;
  }

  protected getProductsBySuper(
    ids: string[],
    subject?: Subject,
    context?: CallContext,
  ): Promise<ResponseMap<FulfillmentProduct>> {
    ids = [...new Set(ids)];

    if (ids.length > 1000) {
      throwOperationStatusCode(
        'FulfillmentProduct',
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

    return this.fulfillmentProductSrv.superRead(
      request,
      context,
    ).then(
      (response: any) => {
        if (response.operation_status?.code === 200) {
          return response.items?.reduce(
            (a: ResponseMap<FulfillmentProduct>, b: any) => {
              a[b.payload?.id] = b;
              return a;
            },
            {} as ResponseMap<FulfillmentProduct>
          );
        }
        else {
          throw response.operation_status;
        }
      }
    );
  }

  protected getCouriersBySuper(
    ids: string[],
    subject?: Subject,
    context?: CallContext,
  ): Promise<ResponseMap<Courier>> {
    ids = [...new Set(ids)];

    if (ids.length > 1000) {
      throwOperationStatusCode(
        'Courier',
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

    return this.fulfillmentCourierSrv.superRead(
      request,
      context,
    ).then(
      (response: any) => {
        if (response.operation_status?.code === 200) {
          return response.items?.reduce(
            (a: ResponseMap<Courier>, b: any) => {
              a[b.payload?.id] = b;
              return a;
            },
            {} as ResponseMap<Courier>
          );
        }
        else {
          throw response.operation_status;
        }
      }
    );
  }

  protected async get<T>(
    ids: string[],
    service: CRUDClient,
    subject?: Subject,
    context?: CallContext,
  ): Promise<ResponseMap<T>> {
    ids = [...new Set(ids)].filter(id => id);

    if (ids.length > 1000) {
      throwOperationStatusCode(
        service.constructor?.name,
        this.operation_status_codes.LIMIT_EXHAUSTED,
      );
    }

    if (!ids.length) {
      return {} as ResponseMap<T>;
    }

    const request = ReadRequest.fromPartial({
      filters: [{
        filters: [
          {
            field: '_key',
            operation: Filter_Operation.in,
            value: JSON.stringify(ids),
            type: Filter_ValueType.ARRAY,
          }
        ]
      }],
      limit: ids.length,
      subject,
    });

    return await service.read(
      request,
      context,
    ).then(
      (response: any) => {
        if (response.operation_status?.code === 200) {
          return response.items?.reduce(
            (a: ResponseMap<T>, b: any) => {
              a[b.payload?.id] = b;
              return a;
            },
            {} as ResponseMap<T>
          );
        }
        else {
          throw response.operation_status;
        }
      }
    );
  }

  async getById<T>(map: { [id: string]: T }, id: string, name: string): Promise<T> {
    if (map && id in map) {
      return map[id];
    }
    else {
      throwStatusCode<T>(
        name,
        id,
        this.status_codes.NOT_FOUND
      );
    }
  }

  async getByIds<T>(map: { [id: string]: T }, ids: string[], name: string): Promise<T[]> {
    return Promise.all(ids.map(
      id => this.getById(map, id, name)
    ));
  }

  protected getFulfillmentsByIds(
    ids: string[],
    subject?: Subject,
    context?: CallContext
  ): Promise<FulfillmentListResponse> {
    ids = [...new Set(ids)];
    if (ids.length > 1000) {
      throw {
        code: 500,
        message: 'Query for fulfillments exceeds limit of 1000!'
      } as OperationStatus;
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
    return super.read(request, context);
  }

  protected async aggregate(
    fulfillments: Fulfillment[],
    subject?: Subject,
    context?: CallContext,
    evaluate?: boolean,
  ): Promise<AggregatedFulfillment[]> {
    const customer_map = await this.get<Customer>(
      fulfillments.map(q => q.customer_id),
      this.customer_service,
      this.tech_user ?? subject,
      context,
    );

    const shop_map = await this.get<Shop>(
      fulfillments.map(q => q.shop_id),
      this.shop_service,
      subject,
      context,
    ) ?? {};

    const orga_map = await this.get<Organization>(
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
      this.tech_user ?? subject,
      context,
    ) ?? {};

    const contact_point_map = await this.get<ContactPoint>(
      [
        ...Object.values(orga_map).flatMap(
          item => item.payload?.contact_point_ids
        ),
        ...Object.values(customer_map).flatMap(
          item => item.payload?.private?.contact_point_ids
        ),
      ],
      this.contact_point_service,
      this.tech_user ?? subject,
      context,
    ) ?? {};

    const address_map = await this.get<Address>(
      Object.values(contact_point_map).map(
        item => item.payload?.physical_address_id
      ),
      this.address_service,
      this.tech_user ?? subject,
      context,
    ) ?? {};

    const country_map = await this.get<Country>(
      [
        ...Object.values(address_map).map(
          item => item.payload?.country_id
        ),
        ...(fulfillments?.map(
          item => item.packaging?.sender?.address?.country_id
        ) ?? []),
        ...(fulfillments?.map(
          item => item.packaging?.recipient?.address?.country_id
        ) ?? []),
      ],
      this.country_service,
      this.tech_user ?? subject,
      context,
    ) ?? {};

    const product_map = await this.getProductsBySuper(
      fulfillments.flatMap(
        f => f.packaging.parcels.map(p => p.product_id)
      ),
      subject,
      context,
    ) ?? {};

    const courier_map = await this.getCouriersBySuper(
      Object.values(product_map).map(
        p => p.payload?.courier_id
      ),
      subject,
      context,
    ) ?? {};

    const credential_map = await this.get<Credential>(
      Object.values(courier_map).map(
        c => c.payload?.credential_id
      ),
      this.credential_service,
      subject,
      context,
    ) ?? {};

    const tax_map = await this.get<Tax>(
      Object.values(product_map).flatMap(
        p => p.payload?.tax_ids
      ),
      this.tax_service,
      this.tech_user ?? subject,
      context,
    ) ?? {};

    const promises = fulfillments.map(async (item): Promise<AggregatedFulfillment> => {
      try {
        item.packaging.sender ??= await this.getById(
          shop_map,
          item.shop_id,
          'Shop'
        ).then(
          shop => this.getById(
            orga_map,
            shop.payload.organization_id,
            'Organization',
          )
        ).then(
          orga => this.getByIds(
            contact_point_map,
            orga.payload.contact_point_ids,
            'ContactPoint'
          )
        ).then(
          async cps => {
            const cp = cps.find(
              cp => cp.payload.contact_point_type_ids?.includes(
                this.contact_point_type_ids.shipping
              )
            )?.payload;

            if (!cp) {
              throwStatusCode(
                'Shop',
                item.shop_id,
                this.status_codes.NO_SHIPPING_ADDRESS,
              );
            }

            const address = await this.getById(
              address_map,
              cp?.physical_address_id,
              'Address',
            )?.then(
              address => address.payload
            );

            delete address.meta;
            return {
              address,
              contact: {
                name: cp.name,
                email: cp.email,
                phone: cp.telephone,
              },
            } as ShippingAddress
          }
        );

        item.packaging.recipient ??= await this.getById(
          customer_map,
          item.customer_id,
          'Customer'
        ).then(
          async customer => {
            const orga_id = (
              customer.payload.commercial?.organization_id
              ?? customer.payload.public_sector?.organization_id
            );

            const orga = orga_id && await this.getById(
              orga_map,
              orga_id,
              'Organization'
            );

            const cps = await this.getByIds(
              contact_point_map,
              [
                ...(orga?.payload?.contact_point_ids ?? []),
                ...(customer.payload?.private?.contact_point_ids ?? [])
              ],
              'ContactPoint'
            );

            const cp = cps.find(
              cp => cp.payload.contact_point_type_ids?.includes(
                this.contact_point_type_ids.shipping
              )
            )?.payload;
            const address = await this.getById(
              address_map,
              cp?.physical_address_id,
              'Address',
            )?.then(
              address => address.payload
            );

            delete address.meta;
            return {
              address,
              contact: {
                name: cp.name,
                email: cp.email,
                phone: cp.telephone,
              },
            } as ShippingAddress
          }
        );

        const sender_country = await this.getById(
          country_map,
          item.packaging.sender?.address?.country_id,
          'Country'
        );

        const recipient_country = await this.getById(
          country_map,
          item.packaging.recipient?.address?.country_id,
          'Country'
        );

        const products = await this.getByIds(
          product_map,
          item.packaging.parcels.map(
            parcel => parcel?.product_id
          ),
          'Product'
        );

        const couriers = await this.getByIds(
          courier_map,
          products.map(
            product => product.payload?.courier_id
          ),
          'Courier'
        );
        
        if (!couriers.every(
            courier => courier.payload?.shop_ids?.includes(
              item.shop_id
            )
          )
        ) {
          throwStatusCode<any>(
            'Fulfillment',
            item.id,
            this.status_codes.SHOP_ID_NOT_IDENTICAL,
          );
        }

        const credentials = await this.getByIds(
          credential_map,
          couriers.map(
            c => c.payload?.credential_id
          ).filter(
            id => id
          ),
          'Credential'
        );

        const status: Status[] = [
          sender_country?.status,
          recipient_country?.status,
          ...(products?.map(p => p?.status) ?? []),
          ...(couriers?.map(c => c?.status) ?? []),
        ];

        const shop_country = await this.getById(
          shop_map,
          item.shop_id,
          'Shop'
        ).then(
          shop => this.getById(
            orga_map,
            shop.payload!.organization_id,
            'Organization'
          )
        ).then(
          orga => this.getByIds(
            contact_point_map,
            orga.payload!.contact_point_ids,
            'ContactPoint'
          )
        ).then(
          cpts => cpts.find(
            cpt => cpt.payload?.contact_point_type_ids.includes(
              this.contact_point_type_ids.legal
            )
          ) ?? throwStatusCode<ContactPointResponse>(
            'Shop',
            item.shop_id,
            this.status_codes.NO_LEGAL_ADDRESS,
          )
        ).then(
          contact_point => this.getById(
            address_map,
            contact_point.payload!.physical_address_id,
            'ContactPoint'
          )
        ).then(
          address => this.getById(
            country_map,
            address.payload!.country_id,
            'Country'
          )
        );

        const customer = await this.getById(
          customer_map,
          item.customer_id,
          'Customer'
        );

        const customer_country = await this.getByIds(
          contact_point_map,
          [
            customer.payload.private?.contact_point_ids,
            orga_map[customer.payload.commercial?.organization_id]?.payload.contact_point_ids,
            orga_map[customer.payload.public_sector?.organization_id]?.payload.contact_point_ids,
          ].flatMap(id => id).filter(id => id),
          'ContactPoint'
        ).then(
          async cps => {
            const cp = cps.find(
              cp => cp.payload?.contact_point_type_ids.includes(
                this.contact_point_type_ids.legal
              )
            );

            if (cp) {
              return this.getById(
                address_map,
                cp.payload.physical_address_id,
                'Address'
              ).then(
                address => this.getById(
                  country_map,
                  address.payload.country_id,
                  'Country'
                )
              );
            }
            else if (recipient_country) {
              return recipient_country
            }
            else {
              throwStatusCode<ContactPointResponse>(
                'Customer',
                item.customer_id,
                this.status_codes.NO_LEGAL_ADDRESS,
              );
            }
          }
        );

        if (evaluate) {
          await Promise.all(item.packaging?.parcels?.map(
            async p => {
              const product = product_map[p.product_id].payload;
              const variant = product.variants.find(
                v => v.id === p.variant_id
              );
              variant.attributes = unique(
                [
                  ...(product.attributes ?? []),
                  ...(variant.attributes ?? []),
                ]
              );
              const courier = courier_map[product.courier_id]?.payload;
              const stub = Stub.getInstance(courier);
              const taxes = product.tax_ids.map(
                id => tax_map[id]?.payload
              ).filter(
                tax => filterTax(
                  tax,
                  shop_country.payload,
                  customer_country.payload,
                  !!customer.payload.private?.user_id,
                )
              );
              const gross = await stub.calcGross(variant, p.package);
              const vats = taxes.map((tax): VAT => ({
                tax_id: tax.id,
                vat: gross.multipliedBy(tax.rate).decimalPlaces(2).toNumber(),
              }));
              const net = vats.reduce(
                (a, b) => a.plus(b.vat),
                gross
              );

              p.price = variant.price;
              p.amount = {
                currency_id: variant.price.currency_id,
                gross: gross.decimalPlaces(2).toNumber(),
                net: net.decimalPlaces(2).toNumber(),
                vats,
              };
            }
          ));
        }

        const aggreagatedFulfillment: AggregatedFulfillment = {
          payload: item,
          products,
          couriers,
          credentials,
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
      catch (e: any) {
        return this.handleStatusError<AggregatedFulfillment>(item?.id, e, item);
      }
    });

    return await Promise.all(promises);
  }

  @access_controlled_function({
    action: AuthZAction.READ,
    operation: Operation.whatIsAllowed,
    context: DefaultACSClientContextFactory,
    resource: [{ resource: 'fulfillment' }],
    database: 'arangoDB',
    useCache: true,
  })
  public override read(
    request: ReadRequest,
    context?: CallContext
  ) {
    return super.read(request, context);
  }

  @resolves_subject()
  @injects_meta_data()
  @access_controlled_function({
    action: AuthZAction.CREATE,
    operation: Operation.isAllowed,
    context: FulfillmentService.ACSContextFactory,
    resource: DefaultResourceFactory('fulfillment'),
    database: 'arangoDB',
    useCache: true,
  })
  public override create(
    request: FulfillmentList,
    context?: CallContext
  ) {
    request?.items?.forEach(
      item => {
        if (!item.fulfillment_state || item.fulfillment_state === FulfillmentState.UNRECOGNIZED) {
          item.fulfillment_state = FulfillmentState.PENDING;
        }
      }
    );
    return super.create(request, context);
  }

  @resolves_subject()
  @access_controlled_function({
    action: AuthZAction.MODIFY,
    operation: Operation.isAllowed,
    context: FulfillmentService.ACSContextFactory,
    resource: DefaultResourceFactory('fulfillment'),
    database: 'arangoDB',
    useCache: true,
  })
  public override update(
    request: FulfillmentList,
    context?: CallContext
  ) {
    return super.update(request, context);
  }

  @resolves_subject()
  @injects_meta_data()
  @access_controlled_function({
    action: AuthZAction.MODIFY,
    operation: Operation.isAllowed,
    context: FulfillmentService.ACSContextFactory,
    resource: DefaultResourceFactory('fulfillment'),
    database: 'arangoDB',
    useCache: true,
  })
  public override upsert(
    request: FulfillmentList,
    context?: CallContext
  ) {
    return super.upsert(request, context);
  }

  @resolves_subject()
  @injects_meta_data()
  @access_controlled_function({
    action: AuthZAction.EXECUTE,
    operation: Operation.isAllowed,
    context: DefaultACSClientContextFactory,
    resource: DefaultResourceFactory('execution.evaluateFulfillments'),
    database: 'arangoDB',
    useCache: true,
  })
  public async evaluate(
    request: FulfillmentList,
    context?: CallContext,
  ): Promise<FulfillmentListResponse> {
    try {
      await this.getFulfillmentsByIds(
        request.items.map(item => item.id),
        request.subject,
        context,
      ).then(
        response => {
          if (response.operation_status?.code !== 200) {
            throw response.operation_status;
          }
          else {
            const result_map = new Map(response.items.map(item => [item.payload.id, item]));
            request.items = request.items.map(
              item => ({
                ...result_map.get(item.id)?.payload,
                ...item
              })
            )
          }
        }
      );
      const fulfillments = await this.aggregate(request.items, request.subject, context);
      const flat_fulfillments = flatMapAggregatedFulfillments(fulfillments);
      const invalid_fulfillments = flat_fulfillments.filter(f => f.status?.code !== 200);
      const responses = await Stub.evaluate(flat_fulfillments.filter(f => f.status?.code === 200));
      const items = mergeFulfillments([
        ...responses,
        ...invalid_fulfillments,
      ]);

      return {
        items,
        total_count: items.length,
        operation_status: createOperationStatusCode(
          this.name,
          this.operation_status_codes.SUCCESS,
        )
      };
    }
    catch (e: any) {
      return this.handleOperationError<FulfillmentListResponse>(
        e,
        request.items?.map(item => this.handleStatusError(item.id, e, item)),
      );
    }
  }

  @resolves_subject()
  @injects_meta_data()
  @access_controlled_function({
    action: AuthZAction.EXECUTE,
    operation: Operation.isAllowed,
    context: FulfillmentService.ACSContextFactory,
    resource: DefaultResourceFactory('execution.submitFulfillments'),
    database: 'arangoDB',
    useCache: true,
  })
  public async submit(
    request: FulfillmentList,
    context?: CallContext
  ): Promise<FulfillmentListResponse> {
    try {
      await this.getFulfillmentsByIds(
        request.items.map(item => item.id),
        request.subject,
        context,
      ).then(
        response => {
          if (response.operation_status?.code !== 200) {
            throw response.operation_status;
          }
          else {
            const result_map = new Map(response.items.map(item => [item.payload.id, item]));
            request.items = request.items.map(
              item => ({
                ...result_map.get(item.id)?.payload,
                ...item
              })
            )
          }
        }
      );
      const fulfillments = await this.aggregate(request.items, request.subject, context);
      const flattened = flatMapAggregatedFulfillments(fulfillments);
      const valids = flattened.filter(
        f => {
          if (f.status?.code !== 200) {
            return false;
          }
          else if (StateRank[f.payload?.fulfillment_state] >= StateRank[FulfillmentState.SUBMITTED]) {
            f.status = createStatusCode(
              this.name,
              f.payload?.id,
              this.status_codes.ALREADY_SUBMITTED,
            );
            return false;
          }
          return true;
        }
      );
      const invalids = flattened.filter(
        f => f.status?.code !== 200 || StateRank[f.payload?.fulfillment_state] >= StateRank[FulfillmentState.SUBMITTED]
      );
      this.logger.debug('Submitting:', valids);
      const responses = await Stub.submit(valids);
      const merged = mergeFulfillments([
        ...responses,
        ...invalids,
      ]);
      const items = merged.filter(
        item => item.payload?.labels?.length > 0
      ).map(
        item => item.payload
      );

      const upsert_results = await super.upsert({
        items,
        total_count: items.length,
        subject: request.subject
      }, context);

      if (this.isEventsEnabled) {
        upsert_results.items.forEach(item => {
          if (this.emitters && item.payload.fulfillment_state in this.emitters) {
            switch (item.payload.fulfillment_state) {
              case FulfillmentState.INVALID:
              case FulfillmentState.FAILED:
                this.topic?.emit(this.emitters[item.payload.fulfillment_state], item);
                break;
              default:
                this.topic?.emit(this.emitters[item.payload.fulfillment_state], item.payload);
                break;
            }
          }
        });
      }

      upsert_results.items.push(
        ...merged.filter(item => item.payload?.labels?.length === 0)
      );
      upsert_results.total_count = upsert_results.items.length;
      if (invalids.length) {
        upsert_results.operation_status = this.operation_status_codes.PARTIAL;
      }
      return upsert_results;
    }
    catch (e: any) {
      return this.handleOperationError<FulfillmentListResponse>(
        e,
        request.items?.map(item => this.handleStatusError(item.id, e, item)),
      );
    }
  }

  @resolves_subject()
  @access_controlled_function({
    action: AuthZAction.EXECUTE,
    operation: Operation.isAllowed,
    context: FulfillmentService.ACSContextFactory,
    resource: DefaultResourceFactory('execution.trackFulfillments'),
    database: 'arangoDB',
    useCache: true,
  })
  public async track(
    request: FulfillmentIdList,
    context?: CallContext
  ): Promise<FulfillmentListResponse> {
    try {
      const request_map: { [id: string]: FulfillmentId } = request.items.reduce(
        (a, b) => {
          a[b.id] = b;
          return a;
        },
        {} as { [id: string]: FulfillmentId },
      );

      const response_map: { [id: string]: FulfillmentResponse } = request.items.reduce(
        (a, b) => {
          a[b.id] = {
            payload: null,
            status: createStatusCode(
              this.name,
              b.id,
              this.status_codes.NOT_FOUND,
            )
          };
          return a;
        },
        {} as { [id: string]: FulfillmentResponse },
      );

      await this.getFulfillmentsByIds(
        request.items.map(item => item.id),
        request.subject,
        context,
      ).then(
        response => response.items.filter(
          item => {
            response_map[item.payload?.id ?? item.status?.id] = item as FulfillmentResponse;
            return item.status?.code === 200;
          }
        ).map(
          item => item.payload as Fulfillment
        )
      ).then(
        fulfillments => this.aggregate(
          fulfillments,
          request.subject,
          context,
        ),
      ).then(
        aggregated => flatMapAggregatedFulfillments(
          aggregated.filter(
            item => {
              response_map[item.payload?.id ?? item.status?.id] = item as FulfillmentResponse;
              return item.status?.code === 200;
            }
          )
        ).filter(
          f => {
            const request = request_map[f.payload?.id];
            if (
              !request.shipment_numbers?.includes(f.label.shipment_number)
            ) {
              return false;
            }

            if (!f.label) {
              f.status = createStatusCode(
                this.name,
                f.payload?.id,
                this.status_codes.NO_LABEL
              );
              return false;
            }

            switch (f.label.state) {
              case FulfillmentState.SUBMITTED:
              case FulfillmentState.IN_TRANSIT:
                return true;
              default:
                f.label.status = createStatusCode(
                  this.name,
                  f.payload?.id,
                  this.status_codes.NOT_SUBMITTED
                );
                f.status = f.label.status;
                return false;
            }
          }
        )
      ).then(
        flat_fulfillments => {
          return Stub.track(flat_fulfillments);
        }
      ).then(
        tracked_fulfillments => mergeFulfillments(tracked_fulfillments)
      ).then(
        merged_fulfillments => merged_fulfillments.filter(
          item => {
            response_map[item.payload?.id ?? item.status?.id] = item;
            return item.status.code === 200;
          }
        ).map(
          item => item.payload
        )
      ).then(
        items => super.update(
          {
            items,
            total_count: items.length,
            subject: request.subject
          },
          context
        )
      ).then(
        updates => this.isEventsEnabled && updates.items.forEach(
          item => {
            response_map[item.payload?.id ?? item.status?.id] = item;
            if (this.emitters && item.payload.fulfillment_state in this.emitters) {
              switch (item.payload.fulfillment_state) {
                case FulfillmentState.INVALID:
                case FulfillmentState.FAILED:
                  this.topic?.emit(this.emitters[item.payload.fulfillment_state], item);
                  break;
                default:
                  this.topic?.emit(this.emitters[item.payload.fulfillment_state], item.payload);
                  break;
              }
            }
          }
        )
      );

      const items = Object.values(response_map);

      return {
        items,
        total_count: items.length,
        operation_status: createOperationStatusCode(
          this.name,
          this.operation_status_codes.SUCCESS,
        ),
      };
    }
    catch (e: any) {
      return this.handleOperationError<FulfillmentListResponse>(e);
    }
  }

  @resolves_subject()
  @access_controlled_function({
    action: AuthZAction.EXECUTE,
    operation: Operation.isAllowed,
    context: FulfillmentService.ACSContextFactory,
    resource: DefaultResourceFactory('execution.withdrawOrder'),
    database: 'arangoDB',
    useCache: true,
  })
  public async withdraw(request: FulfillmentIdList, context?: CallContext): Promise<FulfillmentListResponse> {
    return null;
  }

  @resolves_subject()
  @access_controlled_function({
    action: AuthZAction.EXECUTE,
    operation: Operation.isAllowed,
    context: FulfillmentService.ACSContextFactory,
    resource: DefaultResourceFactory('execution.cancelFulfillments'),
    database: 'arangoDB',
    useCache: true,
  })
  public async cancel(request: FulfillmentIdList, context?: CallContext): Promise<FulfillmentListResponse> {
    try {
      const request_map = request.items!.reduce(
        (a, b) => {
          a[b.id] = b.shipment_numbers;
          return a;
        },
        {} as { [key: string]: string[] }
      );

      const fulfillments = await this.getFulfillmentsByIds(
        request.items.map(item => item.id),
        request.subject,
        context
      ).then(
        response => response.items.map(
          item => item.payload as Fulfillment
        )
      );

      const agg_fulfillments = await this.aggregate(
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
              id,
              code: 400,
              message: `Fulfillment ${id} has no labels!`
            };
          }
          else if (f.payload?.fulfillment_state !== FulfillmentState.SUBMITTED && f.payload?.fulfillment_state !== FulfillmentState.IN_TRANSIT) {
            f.status = {
              id,
              code: 400,
              message: `For canceling Fulfillment ${
                id
              } is expected to be ${
                FulfillmentState.SUBMITTED
              } or ${
                FulfillmentState.IN_TRANSIT
              } but is ${
                f.payload?.fulfillment_state
              }!`
            };
          }

          return f;
        }
      );

      const invalid_fulfillments = flat_fulfillments.filter(
        f => f.status?.code !== 200
      );

      const response = await Stub.track(flat_fulfillments.filter(
        f => {
          const shipment_numbers = request_map[f.payload?.id];
          return f.status?.code === 200 &&
            !shipment_numbers?.length ||
            shipment_numbers.find(
              s => s === f.payload?.labels[0]?.shipment_number
            );
        }
      ));

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

      if (this.isEventsEnabled) {
        update_results.items.forEach(item => {
          if (this.emitters && item.payload.fulfillment_state in this.emitters) {
            switch (item.payload.fulfillment_state) {
              case FulfillmentState.INVALID:
              case FulfillmentState.FAILED:
                this.topic?.emit(this.emitters[item.payload.fulfillment_state], item);
                break;
              default:
                this.topic?.emit(this.emitters[item.payload.fulfillment_state], item.payload);
                break;
            }
          }
        });
      }

      update_results.items.push(
        ...items.filter(i => i.status?.code !== 200)
      );
      update_results.total_count = update_results.items.length;
      return update_results;
    }
    catch (e: any) {
      return this.handleOperationError<FulfillmentListResponse>(e);
    }
  }

  @resolves_subject()
  @access_controlled_function({
    action: AuthZAction.DELETE,
    operation: Operation.isAllowed,
    context: FulfillmentService.ACSContextFactory,
    resource: DefaultResourceFactory('fulfillment'),
    database: 'arangoDB',
    useCache: true,
  })
  public override delete(
    request: DeleteRequest,
    context: any,
  ) {
    return super.delete(request, context);
  }

  @resolves_subject()
  @access_controlled_function({
    action: AuthZAction.CREATE,
    operation: Operation.isAllowed,
    context: FulfillmentService?.ACSContextFactory,
    resource: [{ resource: 'invoice' }],
    database: 'arangoDB',
    useCache: true,
  })
  async createInvoice(
    request: FulfillmentInvoiceRequestList,
    context: any
  ): Promise<InvoiceListResponse> {
    return null;
  }

  async triggerInvoice(
    request: FulfillmentInvoiceRequestList,
    context: any
  ): Promise<StatusListResponse> {
    return null;
  }
}
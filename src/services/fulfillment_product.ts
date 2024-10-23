import { randomUUID } from 'node:crypto';
import { BigNumber } from 'bignumber.js';
import {
  createClient,
  createChannel,
  GrpcClientConfig,
  Client
} from '@restorecommerce/grpc-client';
import { ResourcesAPIBase, ServiceBase } from '@restorecommerce/resource-base-interface';
import { type Logger } from '@restorecommerce/logger';
import { type ServiceConfig } from '@restorecommerce/service-config';
import { type DatabaseProvider } from '@restorecommerce/chassis-srv';
import { 
  ACSClientContext,
  AuthZAction,
  DefaultACSClientContextFactory,
  DefaultResourceFactory,
  Operation,
  access_controlled_function,
  access_controlled_service,
  injects_meta_data
} from '@restorecommerce/acs-client';
import { Topic } from '@restorecommerce/kafka-client';
import {
  DeleteRequest,
  ReadRequest
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/resource_base.js';
import {
  FilterOp_Operator,
  Filter_Operation,
  Filter_ValueType
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/filter.js';
import { Courier as Packer, Offer } from '@restorecommerce/cart/lib/model/impl/Courier.js';
import { Container } from '@restorecommerce/cart/lib/model/impl/bin/Container.js';
import { IItem } from '@restorecommerce/cart/lib/model/IItem.js';
import { Subject } from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/auth.js';
import {
  Amount,
  VAT
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/amount.js';
import { OperationStatus, Status } from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/status.js';
import { Country, CountryServiceDefinition } from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/country.js';
import { Customer, CustomerServiceDefinition } from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/customer.js';
import { Shop, ShopServiceDefinition } from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/shop.js';
import { Organization, OrganizationServiceDefinition } from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/organization.js';
import { ContactPoint, ContactPointResponse, ContactPointServiceDefinition } from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/contact_point.js';
import { Address, AddressServiceDefinition } from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/address.js';
import {
  Tax,
  TaxServiceDefinition,
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/tax.js';
import {
  Parcel,
  Item,
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/fulfillment.js';
import {
  PackingSolutionQuery,
  PackingSolutionQueryList,
  PackingSolution,
  PackingSolutionListResponse,
  FulfillmentProductList,
  FulfillmentProductListResponse,
  PackingSolutionResponse,
  FulfillmentProductServiceImplementation,
  FulfillmentProduct,
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/fulfillment_product.js';
import {
  FulfillmentCourierListResponse
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/fulfillment_courier.js';
import { FulfillmentCourierService } from './index.js';
import {
  CRUDClient,
  Payload,
  Response,
  ResponseList,
  ResponseMap,
  filterTax,
  throwOperationStatusCode,
} from './../utils.js';
import { Stub } from './../stub.js';


interface PackageSolutionTotals extends PackingSolutionQuery {
  volume: number;
  total_weight: number;
  max_width: number;
  max_height: number;
  max_length: number;
}

const buildQueryTotals = (queries: PackingSolutionQuery[]): PackageSolutionTotals[] => queries.map(
  (item: PackingSolutionQuery): PackageSolutionTotals => item.items.reduce((a: PackageSolutionTotals, b: any) => {
    a.volume += b.width_in_cm * b.height_in_cm * b.length_in_cm * b.quantity;
    a.total_weight += b.weight_in_kg * b.quantity;
    a.max_width = Math.max(a.max_width, b.width_in_cm);
    a.max_height = Math.max(a.max_height, b.height_in_cm);
    a.max_length = Math.max(a.max_length, b.length_in_cm);
    return a;
  }, {
    ...item,
    volume: 0.0,
    total_weight: 0.0,
    max_width: 0.0,
    max_height: 0.0,
    max_length: 0.0
  } as PackageSolutionTotals)
);

const countItems = (goods: Item[], container: Container) => {
  const item_map = new Map<string, Item>(goods.map(
    item => [`${item.product_id}\t${item.variant_id}`, { ...item, quantity: 0 }]
  ));
  container.getLevels().forEach((level) =>
    level.forEach((a) => {
      const item = item_map.get(a.getBox().getName());
      item && (item.quantity += 1);
    })
  );
  return [...item_map.values()];
};

@access_controlled_service
export class FulfillmentProductService
  extends ServiceBase<FulfillmentProductListResponse, FulfillmentProductList>
  implements FulfillmentProductServiceImplementation
{
  private static async ACSContextFactory(
    self: FulfillmentProductService,
    request: FulfillmentProductList,
    context: any,
  ): Promise<ACSClientContext> {
    const ids = request.items?.map((item: any) => item.id);
    const resources = await self.getFulfillmentProductsByIds(ids, request.subject, context);
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
    NO_ENTITY_ID: {
      id: '',
      code: 400,
      message: '{entity} ID not provided!'
    },
    MISSING_PACKAGING_INFO: {
      id: '',
      code: 500,
      message: '{entity} {id} is missing packaging info: {error}'
    },
  };

  protected readonly operation_status_codes: { [key: string]: OperationStatus } = {
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
    COURIERS_NOT_FOUND: {
      code: 404,
      message: 'Couriers not found!',
    }
  };

  protected readonly customer_service: Client<CustomerServiceDefinition>;
  protected readonly shop_service: Client<ShopServiceDefinition>;
  protected readonly organization_service: Client<OrganizationServiceDefinition>;
  protected readonly contact_point_service: Client<ContactPointServiceDefinition>;
  protected readonly address_service: Client<AddressServiceDefinition>;
  protected readonly country_service: Client<CountryServiceDefinition>;
  protected readonly tax_service: Client<TaxServiceDefinition>;
  protected readonly tech_user: Subject;
  protected readonly contact_point_type_ids = {
    legal: 'legal',
    shipping: 'shipping',
    billing: 'billing',
  };

  constructor(
    protected readonly courier_srv: FulfillmentCourierService,
    topic: Topic,
    db: DatabaseProvider,
    protected readonly cfg: ServiceConfig,
    logger: Logger
  ) {
    super(
      cfg.get('database:main:entities:2') ?? 'fulfillment_product',
      topic,
      logger,
      new ResourcesAPIBase(
        db,
        cfg.get('database:main:collections:2') ?? 'fulfillment_products',
        cfg.get('fieldHandlers:fulfillment_product')
      ),
      true
    );

    this.status_codes = {
      ...this.status_codes,
      ...cfg.get('statusCodes'),
    };

    this.operation_status_codes = {
      ...this.operation_status_codes,
      ...cfg.get('operationStatusCodes'),
    };

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

    this.tech_user = cfg.get('tech_user');
  }

  protected createStatusCode(
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

  protected throwStatusCode<T>(
    entity: string,
    id: string,
    status: Status,
    error?: string,
  ): T {
    throw this.createStatusCode(
      entity,
      id,
      status,
      error
    );
  }

  protected createOperationStatusCode(
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

  protected catchStatusError(id: string, e: any) {
    this.logger?.warn(e);
    return {
      id,
      code: e?.code ?? 500,
      message: e?.message ?? e?.details ?? e?.toString(),
    };
  }

  protected catchOperationError<T>(e: any) {
    this.logger?.error(e);
    return {
      items: [] as T[],
      total_count: 0,
      operation_status: {
        code: e?.code ?? 500,
        message: e?.message ?? e?.details ?? e?.toString(),
      }
    };
  }

  protected get<T extends Payload>(
    ids: string[],
    service: CRUDClient,
    subject?: Subject,
    context?: any,
  ): Promise<ResponseMap<T>> {
    ids = [...new Set(ids.filter(id => id))];
    const entity = ({} as new() => T).name;

    if (ids.length > 1000) {
      throwOperationStatusCode(
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
      (response: ResponseList<any>) => {
        if (response.operation_status?.code === 200) {
          return response.items?.reduce(
            (a: ResponseMap<T>, b: Response<T>) => {
              a[b.payload?.id!] = b;
              return a;
            },
            {}
          );
        }
        else {
          throw response.operation_status;
        }
      }
    );
  }

  async getById<T>(map: { [id: string]: T }, id: string, entity: string): Promise<T> {
    if (id in map) {
      return map[id];
    }
    else {
      throw this.createStatusCode(
        entity,
        id,
        this.status_codes.NOT_FOUND
      );
    }
  }

  async getByIds<T>(map: { [id: string]: T }, ids: string[], entity: string): Promise<T[]> {
    return Promise.all(ids.map(
      id => this.getById(map, id, entity)
    ));
  }

  protected async getFulfillmentProductsByIds(
    ids: string[],
    subject?: Subject,
    context?: any,
  ): Promise<FulfillmentProductListResponse> {
    ids = [...new Set(ids).values()];
    if (ids.length > 1000) {
      throw {
        code: 500,
        message: 'Query for fulfillmentProducts exceeds limit of 1000!'
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
    return await super.read(request, context).then(
      resp => {
        if (resp.operation_status?.code !== 200) {
          throw resp.operation_status;
        }
        else {
          return resp;
        }
      }
    );
  }

  protected async findCouriers(
    query: PackageSolutionTotals,
    subject?: Subject,
    context?: any,
  ): Promise<FulfillmentCourierListResponse> {
    const call = ReadRequest.fromPartial({
      filters: [
        {
          filters: [
            {
              field: 'shop_ids',
              operation: Filter_Operation.in,
              value: query.shop_id
            },
            ...(query.preferences?.couriers?.map(
              att => ({
                field: att.id,
                operation: Filter_Operation.eq,
                value: att.value,
              })
            ).filter(item => !!item) ?? [])
          ],
          operator: FilterOp_Operator.and
        }
      ],
      subject,
    });

    const response = await this.courier_srv.read(call, context).then(
      resp => {
        if (resp.operation_status?.code !== 200) {
          throw resp.operation_status;
        }
        else {
          return resp;
        }
      }
    );
    this.logger.debug('Available Couriers:', response);
    return response;
  }

  protected async findFulfillmentProducts(
    query: PackageSolutionTotals,
    sender_country: Country,
    recipient_country: Country,
    subject?: Subject,
    context?: any,
  ): Promise<FulfillmentProductListResponse> {
    const stubs = await this.findCouriers(
      query,
      subject,
      context,
    ).then(
      (resp: FulfillmentCourierListResponse) => resp.items?.map(
        item => Stub.getInstance(
          item.payload,
          {
            cfg: this.cfg,
            logger: this.logger
          }
        )
      ).filter(
        s => !!s
      )
    );

    if (!stubs?.length) {
      throw this.operation_status_codes.COURIERS_NOT_FOUND;
    }

    const call = ReadRequest.fromPartial({
      filters: [{
        filters: [
          {
            field: 'courier_id',
            operation: Filter_Operation.in,
            value: JSON.stringify(stubs.map(stub => stub.courier.id)),
            type: Filter_ValueType.ARRAY
          },
          {
            field: 'start_zones',
            operation: Filter_Operation.in,
            value: sender_country.country_code
          },
          {
            field: 'destination_zones',
            operation: Filter_Operation.in,
            value: recipient_country.country_code
          }
        ],
        operator: FilterOp_Operator.and
      }],
      subject,
    });

    const response = await super.read(call, context).then(
      resp => {
        if (resp.operation_status?.code !== 200) {
          throw resp.operation_status;
        }
        else {
          return resp;
        }
      }
    );

    this.logger.debug('Available Fulfillment Products:', response);
    return response;
  }

  public superRead(
    request: ReadRequest,
    context?: any,
  ) {
    return super.read(request, context);
  }

  @access_controlled_function({
    action: AuthZAction.READ,
    operation: Operation.whatIsAllowed,
    context: DefaultACSClientContextFactory,
    resource: [{ resource: 'fulfillment_product' }],
    database: 'arangoDB',
    useCache: true,
  })
  public override read(
    request: ReadRequest,
    context?: any,
  ) {
    return super.read(request, context);
  }

  @injects_meta_data()
  @access_controlled_function({
    action: AuthZAction.CREATE,
    operation: Operation.isAllowed,
    context: FulfillmentProductService.ACSContextFactory,
    resource: DefaultResourceFactory('fulfillment_product'),
    database: 'arangoDB',
    useCache: true,
  })
  public override create(
    request: FulfillmentProductList,
    context?: any
  ) {
    return super.create(request, context);
  }

  @access_controlled_function({
    action: AuthZAction.MODIFY,
    operation: Operation.isAllowed,
    context: FulfillmentProductService.ACSContextFactory,
    resource: DefaultResourceFactory('fulfillment_product'),
    database: 'arangoDB',
    useCache: true,
  })
  public override update(
    request: FulfillmentProductList,
    context?: any
  ) {
    return super.update(request, context);
  }

  @injects_meta_data()
  @access_controlled_function({
    action: AuthZAction.MODIFY,
    operation: Operation.isAllowed,
    context: FulfillmentProductService.ACSContextFactory,
    resource: DefaultResourceFactory('fulfillment_product'),
    database: 'arangoDB',
    useCache: true,
  })
  public override upsert(
    request: FulfillmentProductList,
    context?: any
  ) {
    return super.upsert(request, context);
  }

  async find(request: PackingSolutionQueryList, context?: any): Promise<PackingSolutionListResponse> {
    try {
      const queries = buildQueryTotals(request.items);

      const customer_map = await this.get<Customer>(
        queries.map(q => q.customer_id),
        this.customer_service,
        this.tech_user ?? request.subject,
        context,
      ) ?? {};

      const shop_map = await this.get<Shop>(
        queries.map(q => q.shop_id),
        this.shop_service,
        request.subject,
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
        this.tech_user ?? request.subject,
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
        this.tech_user ?? request.subject,
        context,
      ) ?? {};

      const address_map = await this.get<Address>(
        Object.values(contact_point_map).map(
          item => item.payload?.physical_address_id
        ),
        this.address_service,
        this.tech_user ?? request.subject,
        context,
      ) ?? {};

      const country_map = await this.get<Country>(
        [
          ...Object.values(address_map).map(
            item => item.payload?.country_id
          ),
          ...queries.map(query => query.sender?.address?.country_id),
          ...queries.map(query => query.recipient?.address?.country_id)
        ],
        this.country_service,
        this.tech_user ?? request.subject,
        context,
      ) ?? {};

      const promises = queries.flatMap(async query => {
        try {
          if (!query.shop_id) {
            this.throwStatusCode(
              'Shop',
              query.reference?.instance_id,
              this.status_codes.NO_ENTITY_ID,
            );
          }
          if (!query.customer_id) {
            this.throwStatusCode(
              'Customer',
              query.reference?.instance_id,
              this.status_codes.NO_ENTITY_ID,
            );
          }

          const shop_country = (
            query.sender?.address?.country_id
            ? await this.getById(
              country_map,
              query.sender.address.country_id,
              'Country',
            )
            : await this.getById(
              shop_map,
              query.shop_id,
              'Shop',
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
                'ContactPoint',
              )
            ).then(
              cpts => cpts.find(
                cpt => cpt.payload?.contact_point_type_ids.includes(
                  this.contact_point_type_ids.legal
                )
              ) ?? this.throwStatusCode<ContactPointResponse>(
                'Shop',
                query.shop_id,
                this.status_codes.NO_LEGAL_ADDRESS,
              )
            ).then(
              contact_point => this.getById(
                address_map,
                contact_point.payload.physical_address_id,
                'Address',
              )
            ).then(
              address => this.getById(
                country_map,
                address.payload.country_id,
                'Country',
              )
            )
          );
          this.logger.debug('Shop Country:', shop_country);

          const customer = await this.getById(
            customer_map,
            query.customer_id,
            'Customer',
          );

          const customer_country = (
            query.recipient?.address?.country_id
            ? await this.getById(
              country_map,
              query.recipient.address.country_id,
              'Country',
            )
            : await this.getByIds(
              contact_point_map,
              [
                customer.payload.private?.contact_point_ids,
                orga_map[customer.payload.commercial?.organization_id]?.payload.contact_point_ids,
                orga_map[customer.payload.public_sector?.organization_id]?.payload.contact_point_ids,
              ].flatMap(id => id).filter(id => id),
              'ContactPoint',
            ).then(
              cps => cps.find(
                cp => cp.payload?.contact_point_type_ids.includes(
                  this.contact_point_type_ids.shipping
                )
              ) ?? this.throwStatusCode<ContactPointResponse>(
                'Customer',
                customer.payload.id,
                this.status_codes.NO_SHIPPING_ADDRESS,
              )
            ).then(
              cp => this.getById(
                address_map,
                cp.payload.physical_address_id,
                'Address',
              )
            ).then(
              address => this.getById(
                country_map,
                address.payload.country_id,
                'Country',
              )
            )
          );
          this.logger.debug('Customer Country:', customer_country);

          const product_map = await this.findFulfillmentProducts(
            query,
            shop_country.payload,
            customer_country.payload,
            request.subject,
            context,
          ).then(
            response => response.items.reduce(
              (a: ResponseMap<FulfillmentProduct>, b) => {
                a[b.payload?.id ?? b.status?.id!] = b;
                return a;
              },
              {} as ResponseMap<FulfillmentProduct>
            )
          );

          const tax_map = await this.get<Tax>(
            Object.values(product_map).flatMap(
              p => p.payload.tax_ids
            ),
            this.tax_service,
            this.tech_user ?? request.subject,
            context,
          );

          const offer_lists = Object.values(product_map).map(
            (product): Offer[] => product.payload?.variants?.map(
              (variant): Offer => (
                {
                  name: `${product.payload?.id}\t${variant.id}`,
                  price: variant.price.sale ? variant.price.sale_price : variant.price.regular_price,
                  maxWeight: variant.max_weight ?? this.throwStatusCode(
                    'FulfillmentProduct',
                    product.payload?.id,
                    this.status_codes.MISSING_PACKAGING_INFO,
                    'Weight'
                  ),
                  width: variant.max_size?.width ?? this.throwStatusCode(
                    'FulfillmentProduct',
                    product.payload?.id,
                    this.status_codes.MISSING_PACKAGING_INFO,
                    'Width'
                  ),
                  height: variant.max_size?.height ?? this.throwStatusCode(
                    'FulfillmentProduct',
                    product.payload?.id,
                    this.status_codes.MISSING_PACKAGING_INFO,
                    'Height'
                  ),
                  depth: variant.max_size?.length ?? this.throwStatusCode(
                    'FulfillmentProduct',
                    product.payload?.id,
                    this.status_codes.MISSING_PACKAGING_INFO,
                    'Length'
                  ),
                  type: 'parcel'
                }
              )
            )
          );
          this.logger.debug('Offer List:', offer_lists);
        
          const goods = query.items.map((good): IItem => ({
            sku: `${good.product_id}\t${good.variant_id}`,
            desc: `${good.product_id}\t${good.variant_id}`,
            quantity: good.quantity,
            weight: good.package?.weight_in_kg ?? this.throwStatusCode(
              'Product',
              good.product_id,
              this.status_codes.MISSING_PACKAGING_INFO,
              'Weight'
            ),
            width: good.package?.size_in_cm.width ?? this.throwStatusCode(
              'Product',
              good.product_id,
              this.status_codes.MISSING_PACKAGING_INFO,
              'Width',
            ),
            height: good.package?.size_in_cm.height ?? this.throwStatusCode(
              'Product',
              good.product_id,
              this.status_codes.MISSING_PACKAGING_INFO,
              'Height'
            ),
            depth: good.package?.size_in_cm.length ?? this.throwStatusCode(
              'Product',
              good.product_id,
              this.status_codes.MISSING_PACKAGING_INFO,
              'Length',
            ),
            price: 0.0, // placeholder
            taxType: 'vat_standard' // placeholder
          }));
          this.logger.debug('Goods:', goods);

          const packer = new Packer({
            source: JSON.stringify({ zones: [] }),
            shipping: null
          });
          
          const solutions: PackingSolution[] = offer_lists.map(
            offers => packer.canFit(offers, goods)
          ).map(
            containers => {
              const parcels = containers.map((container): Parcel => {
                const [product_id, variant_id] = container.getOffer().name.split('\t');
                const product = product_map[product_id].payload;
                const variant = product.variants.find(
                  variant => variant.id === variant_id
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
                );
                const gross = new BigNumber(price.sale ? price.sale_price : price.regular_price);
                const vats = taxes.map((tax): VAT => ({
                  tax_id: tax.id,
                  vat: gross.multipliedBy(tax.rate).decimalPlaces(2).toNumber(),
                }));
                const net = vats.reduce((a, b) => a.plus(b.vat), gross).decimalPlaces(2).toNumber();

                return {
                  id: randomUUID(),
                  product_id,
                  variant_id,
                  items: countItems(query.items, container),
                  package: {
                    rotatable: !query.items.some(i => !i.package?.rotatable),
                    size_in_cm: {
                      height: container.getStackHeight(),
                      width: container.getWidth(),
                      length: container.getDepth()
                    },
                    weight_in_kg: container.getStackWeight(),
                  },
                  price,
                  amount: {
                    currency_id: price.currency_id,
                    gross: gross.toNumber(),
                    net,
                    vats,
                  }
                };
              });

              const amounts = Object.values<Amount>(
                parcels.reduce(
                  (a: { [key: string]: Amount }, b) => {
                    const c = a[b.amount.currency_id];
                    if (c) {
                      c.gross += b.amount.gross;
                      c.net += b.amount.net;
                      c.vats.push(...b.amount.vats);
                    }
                    else {
                      a[b.amount.currency_id] = { ...b.amount };
                    }
                    return a;
                  },
                  {}
                )
              );

              amounts.forEach(amount => {
                amount.vats = Object.values(amount.vats?.reduce(
                  (a: { [id: string]: VAT }, b) => {
                    const c = a[b.tax_id];
                    if (c) {
                      c.vat += b.vat;
                    }
                    a[b.tax_id] = { ...b };
                    return a;
                  },
                  {}
                ));
              });

              return {
                parcels,
                amounts,
              };
            }
          ).sort(
            (a, b) => Math.min(
              ...a.amounts?.map(am => am.net)
            ) - Math.min(
              ...b.amounts?.map(am => am.net)
            )
          );

          const solution: PackingSolutionResponse = {
            reference: query.reference,
            solutions,
            status: {
              id: query.reference?.instance_id,
              code: 200,
              message: `Best Solution: ${
                Math.min(
                  ...solutions.flatMap(
                    (s) => s.amounts.map(a => a.net)
                  )
                )
              }`
            }
          };

          return solution;
        }
        catch (e: any) {
          const solution: PackingSolutionResponse = {
            reference: query.reference,
            solutions: [],
            status: this.catchStatusError(
              query.reference?.instance_id,
              e,
            ),
          };
          return solution;
        }
      });

      const items = await Promise.all(promises);
      return {
        items,
        total_count: items.length,
        operation_status: this.createOperationStatusCode(
          this.name,
          this.operation_status_codes.SUCCESS,
        )
      };
    }
    catch (e: any) {
      return this.catchOperationError(e);
    }
  }

  @access_controlled_function({
    action: AuthZAction.DELETE,
    operation: Operation.isAllowed,
    context: FulfillmentProductService.ACSContextFactory,
    resource: DefaultResourceFactory('fulfillment_product'),
    database: 'arangoDB',
    useCache: true,
  })
  public override delete(
    request: DeleteRequest,
    context: any,
  ) {
    return super.delete(request, context);
  }
}
import { randomUUID } from 'crypto';
import {
  createClient,
  createChannel,
  GrpcClientConfig,
  Client
} from '@restorecommerce/grpc-client';
import { ResourcesAPIBase, ServiceBase } from '@restorecommerce/resource-base-interface';
import { DatabaseProvider } from '@restorecommerce/chassis-srv';
import { Topic } from '@restorecommerce/kafka-client';
import { DeepPartial } from '@restorecommerce/kafka-client/lib/protos';
import { ReadRequest } from '@restorecommerce/types/server/io/restorecommerce/resource_base';
import {
  FilterOp_Operator,
  Filter_Operation,
  Filter_ValueType
} from '@restorecommerce/types/server/io/restorecommerce/filter';
import { Courier as Packer, Offer } from '@restorecommerce/cart/lib/model/impl/Courier';
import { Container } from '@restorecommerce/cart/lib/model/impl/bin/Container';
import { IItem } from '@restorecommerce/cart/lib/model/IItem';
import {
  TaxServiceDefinition,
} from '@restorecommerce/types/server/io/restorecommerce/tax';
import {
  Parcel,
  Item,
} from '@restorecommerce/types/server/io/restorecommerce/fulfillment';
import {
  ProductQuery,
  ProductQueryList,
  PackingSolution,
  PackingSolutionListResponse,
  FulfillmentProductList,
  FulfillmentProductListResponse,
  PackingSolutionResponse,
  FulfillmentProductServiceImplementation,
} from '@restorecommerce/types/server/io/restorecommerce/fulfillment_product';
import {
  FulfillmentCourierListResponse
} from '@restorecommerce/types/server/io/restorecommerce/fulfillment_courier';
import { FulfillmentCourierService } from '.';
import {
  CRUDClient,
  Courier,
  ProductResponse,
  ProductResponseMap,
  TaxResponseMap,
  Stub,
  CountryResponseMap,
  ShopResponseMap,
  OrganizationResponseMap,
  ContactPointResponseMap,
  AddressResponseMap,
  CustomerResponseMap,
  COUNTRY_CODES_EU,
  filterTax,
} from '..';
import { Subject } from '@restorecommerce/types/server/io/restorecommerce/auth';
import { Amount, VAT } from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/amount';
import { OperationStatus, Status } from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/status';
import { CountryServiceDefinition } from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/country';
import { CustomerServiceDefinition } from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/customer';
import { ShopServiceDefinition } from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/shop';
import { OrganizationServiceDefinition } from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/organization';
import { ContactPointServiceDefinition } from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/contact_point';
import { AddressServiceDefinition } from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/address';


interface ProductQueryTotals extends ProductQuery {
  volume: number;
  total_weight: number;
  max_width: number;
  max_height: number;
  max_length: number;
}

const buildQueryTotals = (queries: ProductQuery[]): ProductQueryTotals[] => queries.map(
  (item: ProductQuery): ProductQueryTotals => item.items.reduce((a: ProductQueryTotals, b: any) => {
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
  } as ProductQueryTotals)
);

const countItems = (goods: Item[], container: Container) => {
  const item_map = new Map<string, Item>(goods.map(
    item => [`${item.product_id}\t${item.variant_id}`, { ...item, quantity: 0 }]
  ));
  container.getLevels().forEach(level =>
    level.forEach(a => {
      const item = item_map.get(a.getBox().getName());
      item && (item.quantity += 1);
    })
  );
  return [...item_map.values()];
};

export class FulfillmentProductService 
  extends ServiceBase<FulfillmentProductListResponse, FulfillmentProductList> 
  implements FulfillmentProductServiceImplementation
{
  private readonly status_codes: {
    OK: {
      id: string;
      code: 200;
      message: 'OK';
    };
    NOT_FOUND: {
      id: string;
      code: 404;
      message: '{entity} {id} not found!';
    };
  };

  private readonly operation_status_codes: {
    SUCCESS: {
      code: 200;
      message: 'SUCCESS';
    };
    PARTIAL: {
      code: 400;
      message: 'Patrial executed with errors!';
    };
    LIMIT_EXHAUSTED: {
      code: 500;
      message: 'Query limit 1000 exhausted!';
    };
  };

  private readonly legal_address_type_id: string;
  private readonly customer_service: Client<CustomerServiceDefinition>;
  private readonly shop_service: Client<ShopServiceDefinition>;
  private readonly organization_service: Client<OrganizationServiceDefinition>;
  private readonly contact_point_service: Client<ContactPointServiceDefinition>;
  private readonly address_service: Client<AddressServiceDefinition>;
  private readonly country_service: Client<CountryServiceDefinition>;
  private readonly tax_service: Client<TaxServiceDefinition>;

  constructor(
    private readonly courier_srv: FulfillmentCourierService,
    topic: Topic,
    db: DatabaseProvider,
    private readonly cfg: any,
    logger: any
  ) {
    super(
      cfg.get('database:main:entities:2'),
      topic,
      logger,
      new ResourcesAPIBase(db, cfg.get('database:main:collections:2')),
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

    this.legal_address_type_id = this.cfg.get('ids:legalAddressTypeId');

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

  private buildStatusCode(
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

  private buildOperationStatusCode(
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

  private handleStatusError(id: string, e: any) {
    this.logger.warn(e);
    return {
      id,
      code: e?.code ?? 500,
      message: e?.message ?? e?.details ?? e?.toString(),
    };
  }

  private handleOperationError(e: any) {
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

  private get<T>(
    ids: string[],
    service: CRUDClient,
    subject?: Subject,
    context?: any,
  ): Promise<T> {
    ids = [...new Set<string>(ids)];
    const entity = typeof ({} as T);

    if (ids.length > 1000) {
      throw this.buildOperationStatusCode(
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
            (a: any, b: any) => {
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
      throw this.buildStatusCode(
        typeof({} as T),
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

  private async findCouriers(
    queries: ProductQueryTotals[],
    subject?: Subject,
    context?: any,
  ): Promise<DeepPartial<FulfillmentCourierListResponse>> {
    const call = ReadRequest.fromPartial({
      filters: [{
        filters: queries.flatMap(
          item => item.preferences.couriers.map(
            att => ({
              field: att.id,
              operation: Filter_Operation.eq,
              value: att.value,
            })
          )
        ),
        operator: FilterOp_Operator.or
      }],
      subject,
    });
    return this.courier_srv.read(call, context);
  }

  private async findProducts(
    queries: ProductQueryTotals[],
    stubs?: Stub[],
    subject?: Subject,
    context?: any
  ): Promise<DeepPartial<FulfillmentProductListResponse>> {
    stubs = stubs || await this.findCouriers(
      queries,
      subject,
      context,
    ).then(
      (resp: FulfillmentCourierListResponse) => resp.items.map(
        item => Stub.getInstance(
          item.payload,
          {
            cfg: this.cfg,
            logger: this.logger
          }
        )
      )
    );

    const call = ReadRequest.fromPartial({
      filters: [{
        filters: [{
          field: 'courier_id',
          operation: Filter_Operation.in,
          value: JSON.stringify(stubs.map(stub => stub.courier.id)),
          type: Filter_ValueType.ARRAY
        }],
        operator: FilterOp_Operator.or
      }],
      subject,
    });

    return this.read(call, context);
  }

  async find(request: ProductQueryList, context?: any): Promise<PackingSolutionListResponse> {
    try {
      const queries = buildQueryTotals(request.items);

      const customer_map = await this.get<CustomerResponseMap>(
        queries.map(q => q.customer_id),
        this.customer_service,
        request.subject,
        context,
      );

      const shop_map = await this.get<ShopResponseMap>(
        queries.map(q => q.shop_id),
        this.shop_service,
        request.subject,
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
        request.subject,
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
        request.subject,
        context,
      );
  
      const address_map = await this.get<AddressResponseMap>(
        Object.values(contact_point_map).map(
          item => item.payload?.physical_address_id
        ),
        this.address_service,
        request.subject,
        context,
      );

      const country_map = await this.get<CountryResponseMap>(
        Object.values(address_map).map(
          item => item.payload?.country_id
        ),
        this.country_service,
        request.subject,
        context,
      );

      const stubs = await this.findCouriers(
        queries,
        request.subject,
        context,
      ).then(
        resp => resp.items.map(
          item => Stub.getInstance(
            item.payload as Courier,
            {
              cfg: this.cfg,
              logger: this.logger
            }
          )
        )
      );

      const product_map = await this.findProducts(
        queries,
        stubs,
        request.subject,
        context,
      ).then(
        response => response.items.reduce(
          (a, b) => {
            a[b.payload?.id ?? b.status?.id] = b as ProductResponse;
            return a;
          },
          {} as ProductResponseMap
        )
      );

      const tax_map = await this.get<TaxResponseMap>(
        Object.values(product_map).flatMap(
          p => p.payload.tax_ids
        ),
        this.tax_service,
        request.subject,
        context,
      );

      const offer_lists = Object.values(product_map).map(
        (product): Offer[] => product.payload?.variants?.map(
          (variant): Offer => (
            {
              name: `${product.payload?.id}\t${variant.id}`,
              price: variant.price.sale ? variant.price.sale_price : variant.price.regular_price,
              maxWeight: variant.max_weight,
              width: variant.max_size.width,
              height: variant.max_size.height,
              depth: variant.max_size.length,
              type: 'parcel'
            }
          )
        )
      );

      const promises = queries.map(async query => {
        try {
          const goods = query.items.map((good): IItem => ({
            desc: `${good.product_id}\t${good.variant_id}`,
            quantity: good.quantity,
            weight: good.package.weight_in_kg,
            width: good.package.size_in_cm.width,
            height: good.package.size_in_cm.height,
            depth: good.package.size_in_cm.length,
            price: 0.0, // placeholder
            taxType: 'vat_standard' // placeholder
          }));
  
          const packer = new Packer({
            source: JSON.stringify({ zones: [] }),
            shipping: null
          });
  
          const shop_country = await this.getById(
            shop_map,
            query.shop_id
          ).then(
            shop => this.getById(
              orga_map,
              shop.payload.organization_id
            )
          ).then(
            orga => this.getByIds(
              contact_point_map,
              orga.payload.contact_point_ids
            ).then(
              cpts => cpts.find(
                cpt => cpt.payload.contact_point_type_ids.indexOf(
                  this.legal_address_type_id
                ) >= 0
              )
            )
          ).then(
            contact_point => this.getById(
              address_map,
              contact_point.payload.physical_address_id
            )
          ).then(
            address => this.getById(country_map, address.payload.country_id)
          );
  
          const customer = await this.getById(
            customer_map,
            query.customer_id
          );
  
          const customer_country = await this.getByIds(
            contact_point_map,
            [
              ...customer.payload.private?.contact_point_ids,
              ...(await this.getById(
                orga_map,
                customer.payload.commercial?.organization_id
              )).payload.contact_point_ids,
              ...(await this.getById(
                orga_map,
                customer.payload.public_sector?.organization_id
              )).payload.contact_point_ids,
            ]
          ).then(
            cps => cps.find(
              cp => cp.payload.contact_point_type_ids.indexOf(
                this.legal_address_type_id
              )
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
                )
                const gross = price.sale ? price.sale_price : price.regular_price;
                const vats = taxes.map((tax): VAT => ({
                  tax_id: tax.id,
                  vat: gross * tax.rate,
                }));
                const net = vats.reduce((a, b) => a + b.vat, gross);
  
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
                    gross,
                    net,
                    vats,
                  }
                }
              });
  
              const amounts = Object.values(
                parcels.reduce((a, b) => {
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
                {} as { [key: string]: Amount })
              );
  
              amounts.forEach(amount => {
                amount.vats = Object.values(amount.vats.reduce(
                  (a, b) => {
                    const c = a[b.tax_id];
                    if (c) {
                      c.vat += b.vat;
                    }
                    a[b.tax_id] = { ...b };
                    return a;
                  },
                  {} as { [id: string]: VAT }
                ))
              });
  
              return {
                parcels,
                amounts,
                compactness: 1,
                homogeneity: 1,
                score: 1,
                reference: query.reference,
              }
            }
          );
  
          const solution: PackingSolutionResponse = {
            solutions,
            status: {
              id: query.reference.instance_id,
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
        catch (e) {
          const solution: PackingSolutionResponse = {
            solutions: [],
            status: this.handleStatusError(
              query.reference.instance_id,
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
        operation_status: this.buildOperationStatusCode(
          this.name,
          this.operation_status_codes.SUCCESS,
        )
      };
    }
    catch (e) {
      this.handleOperationError(e);
    }
  }
}
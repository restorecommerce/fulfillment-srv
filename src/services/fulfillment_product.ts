import { randomUUID } from 'node:crypto';
import { type CallContext } from 'nice-grpc-common';
import { type Logger } from '@restorecommerce/logger';
import { type ServiceConfig } from '@restorecommerce/service-config';
import { type DatabaseProvider } from '@restorecommerce/chassis-srv';
import { Topic } from '@restorecommerce/kafka-client';
import {
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
import {
  Country,
  CountryServiceDefinition
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/country.js';
import {
  CustomerServiceDefinition
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/customer.js';
import {
  ShopServiceDefinition
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/shop.js';
import { OrganizationServiceDefinition } from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/organization.js';
import { ContactPointServiceDefinition } from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/contact_point.js';
import { AddressServiceDefinition } from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/address.js';
import {
  Tax,
  TaxServiceDefinition,
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/tax.js';
import {
  Parcel,
  Item,
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/fulfillment.js';
import {
  FulfillmentSolutionQuery,
  FulfillmentSolutionQueryList,
  FulfillmentSolution,
  FulfillmentSolutionListResponse,
  FulfillmentProductList,
  FulfillmentProductListResponse,
  FulfillmentSolutionResponse,
  FulfillmentProductServiceImplementation,
  FulfillmentProduct,
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/fulfillment_product.js';
import {
  FulfillmentCourier,
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/fulfillment_courier.js';
import {
  AccessControlledServiceBase,
} from '@restorecommerce/resource-base-interface/lib/experimental/AccessControlledServiceBase.js';
import { FulfillmentCourierService } from './fulfillment_courier.js';
import {
  Product,
  ProductServiceDefinition,
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/product.js';
import {
  Currency,
  CurrencyServiceDefinition,
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/currency.js';
import {
  ClientRegister,
  ResourceAggregator,
  ResourceMap,
} from '@restorecommerce/resource-base-interface/lib/experimental/index.js';
import { Stub } from './../stub.js';
import {
  AggregatedFulfillmentSolutionQueryList,
  FulfillmentSolutionQueryAggregationTemplate,
  createOperationStatusCode,
  throwStatusCode,
  resolveCustomerAddress as resolveRecipientAddress,
  resolveShopAddress as resolveSenderAddress,
  mergeFulfillmentProductVariant,
  createStatusCode,
  calcAmount,
} from './../utils.js';


interface PackageSolutionTotals extends FulfillmentSolutionQuery {
  volume: number;
  total_weight: number;
  max_width: number;
  max_height: number;
  max_length: number;
}

const calcPackageTotals = (queries: FulfillmentSolutionQuery[]): PackageSolutionTotals[] => queries.map(
  (item: FulfillmentSolutionQuery): PackageSolutionTotals => item.items.reduce((a: PackageSolutionTotals, b) => {
    if (!b.package) throw new Error(`Package info missing in product: ${b?.product_id}, variant: ${b?.variant_id}`);
    a.volume += b.package.size_in_cm.width * b.package.size_in_cm.height * b.package.size_in_cm.length * b.quantity;
    a.total_weight += b.package.weight_in_kg * b.quantity;
    a.max_width = Math.max(a.max_width, b.package.size_in_cm.width);
    a.max_height = Math.max(a.max_height, b.package.size_in_cm.height);
    a.max_length = Math.max(a.max_length, b.package.size_in_cm.length);
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
      if (item) {
        item.quantity += 1
      }
    })
  );
  return [...item_map.values()];
};

export class FulfillmentProductService
  extends AccessControlledServiceBase<FulfillmentProductListResponse, FulfillmentProductList>
  implements FulfillmentProductServiceImplementation
{
  protected readonly status_codes = {
    OK: {
      code: 200,
      message: 'OK',
    },
    NOT_FOUND: {
      code: 404,
      message: '{entity} {id} not found!',
    },
    NO_LEGAL_ADDRESS: {
      code: 404,
      message: '{entity} {id} has no legal address!',
    },
    NO_SHIPPING_ADDRESS: {
      code: 404,
      message: '{entity} {id} has no shipping address!',
    },
    NO_ENTITY_ID: {
      code: 400,
      message: '{entity} ID not provided!'
    },
    MISSING_PACKAGING_INFO: {
      code: 500,
      message: '{entity} {id} is missing packaging info: {details}'
    },
    NO_SOLUTION_FOUND: {
      code: 404,
      message: 'No solution found for {id}',
    },
  };

  protected readonly operation_status_codes = {
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
    COURIERS_NOT_FOUND: {
      code: 404,
      message: 'Couriers not found!',
    }
  };

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
    logger?: Logger,
    client_register = new ClientRegister(cfg, logger),
    protected readonly aggregator = new ResourceAggregator(cfg, logger, client_register),
  ) {
    super(
      cfg.get('database:main:entities:2') ?? 'fulfillment_product',
      topic as any,
      db,
      cfg,
      logger,
      cfg.get('events:enableEvents')?.toString() === 'true',
      cfg.get('database:main:collections:2') ?? 'fulfillment_products',
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

    this.tech_user = cfg.get('tech_user');
  }

  protected async aggregateProductBundles(
    products: ResourceMap<Product>,
    output?: ResourceMap<Product>,
    subject?: Subject,
  ): Promise<ResourceMap<Product>> {
    output ??= products;
    const ids = products?.all.filter(
      p => p.bundle
    ).flatMap(
      p => p.bundle.products.map(
        p => p.product_id
      )
    ).filter(
      id => !output.has(id)
    );

    if (ids?.length) {
      const bundled_products = await this.aggregator.getByIds<Product>(
        ids,
        ProductServiceDefinition,
        subject,
      );

      bundled_products.forEach(
        p => output.set(p.id, p)
      );

      await this.aggregateProductBundles(
        bundled_products,
        output,
        subject,
      );
    }
    return output;
  }

  protected async aggregate(
    query: FulfillmentSolutionQueryList,
    subject?: Subject,
    context?: CallContext,
  ): Promise<AggregatedFulfillmentSolutionQueryList> {
    const aggregation = await this.aggregator.aggregate(
      query,
      [
        {
          service: ShopServiceDefinition,
          map_by_ids: (query) => query.items?.map(
            i => i.shop_id
          ),
          container: 'shops',
          entity: 'Shop',
        },
        {
          service: CustomerServiceDefinition,
          map_by_ids: (query) => query.items?.map(
            i => i.customer_id
          ),
          container: 'customers',
          entity: 'Customer',
        },
        {
          service: ProductServiceDefinition,
          map_by_ids: (query) => query.items?.flatMap(
            i => i.items
          )?.flatMap(
            item => item?.product_id
          ),
          container: 'products',
          entity: 'Product',
        },
      ],
      FulfillmentSolutionQueryAggregationTemplate,
      subject,
      context,
    ).then(
      async aggregation => {
        await this.aggregateProductBundles(
          aggregation.products,
          aggregation.products,
          subject,
        );
        return aggregation;
      }
    ).then(
      async aggregation => await this.aggregator.aggregate(
        aggregation,
        [
          {
            service: OrganizationServiceDefinition,
            map_by_ids: (aggregation) => [].concat(
              aggregation.customers?.all.map(
                customer => customer.public_sector?.organization_id
              ),
              aggregation.customers?.all.map(
                customer => customer.commercial?.organization_id
              ),
              aggregation.shops?.all.map(
                shop => shop?.organization_id
              ),
            ),
            container: 'organizations',
            entity: 'Organization',
          },
        ],
        FulfillmentSolutionQueryAggregationTemplate,
        this.tech_user ?? subject,
        context,
      )
    ).then(
      async aggregation => await this.aggregator.aggregate(
        aggregation,
        [
          {
            service: ContactPointServiceDefinition,
            map_by_ids: (aggregation) => [
              aggregation.customers.all.flatMap(
                customer => customer.private?.contact_point_ids
              ),
              aggregation.organizations.all.flatMap(
                organization => organization.contact_point_ids
              )
            ].flatMap(ids => ids),
            container: 'contact_points',
            entity: 'ContactPoint',
          },
        ],
        FulfillmentSolutionQueryAggregationTemplate,
        this.tech_user ?? subject,
        context,
      )
    ).then(
      async aggregation => await this.aggregator.aggregate(
        aggregation,
        [
          {
            service: AddressServiceDefinition,
            map_by_ids: (aggregation) => [].concat(
              aggregation.contact_points.all.map(
                cp => cp.physical_address_id
              ),
              aggregation.items.map(
                item => item?.sender?.address?.id
              ),
              aggregation.items.map(
                item => item?.recipient?.address?.id
              ),
            ).filter(a => a),
            container: 'addresses',
            entity: 'Address',
          },
        ],
        FulfillmentSolutionQueryAggregationTemplate,
        this.tech_user ?? subject,
        context,
      )
    ).then(
      async aggregation => await this.aggregator.aggregate(
        aggregation,
        [
          {
            service: CountryServiceDefinition,
            map_by_ids: (aggregation) => [].concat(
              aggregation.addresses.all.map(
                a => a.country_id
              ),
              aggregation.items.map(
                item => item?.sender?.address?.country_id
              ),
              aggregation.items.map(
                item => item?.recipient?.address?.country_id
              )
            ),
            container: 'countries',
            entity: 'Country',
          },
        ],
        FulfillmentSolutionQueryAggregationTemplate,
        this.tech_user ?? subject,
        context,
      )
    );

    return aggregation;
  }

  protected async findFulfillmentProducts(
    query: PackageSolutionTotals,
    courier_ids: string[],
    sender_country: Country,
    recipient_country: Country,
    subject?: Subject,
    context?: CallContext,
  ): Promise<FulfillmentProductListResponse> {
    const ids = [...new Set(
      query.preferences?.fulfillment_product_ids?.map(id => id) ?? []
    ).values()];
    const call = ReadRequest.fromPartial({
      filters: [{
        filters: [
          ...(
            ids?.length ?
            [{
              field: '_key', // _key is faster
              operation: Filter_Operation.in,
              type: Filter_ValueType.ARRAY,
              value: JSON.stringify(ids),
            }] : []
          ),
          {
            field: 'courier_id',
            operation: Filter_Operation.in,
            value: JSON.stringify(courier_ids),
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

    this.logger?.debug('Available Fulfillment Products:', response);
    return response;
  }

  async find(
    request: FulfillmentSolutionQueryList,
    context?: CallContext
  ): Promise<FulfillmentSolutionListResponse> {
    try {
      const aggregation = await this.aggregate(
        request,
        request.subject,
        context,
      );
      const queries = calcPackageTotals(request.items);
      const promises = queries.flatMap(async query => {
        try {
          query.sender ??= resolveSenderAddress(
            query.shop_id,
            aggregation,
            this.contact_point_type_ids.shipping,
          );
          query.recipient ??= resolveRecipientAddress(
            query.customer_id,
            aggregation,
            this.contact_point_type_ids.shipping,
          );
    
          if (!query.sender?.address) {
            throwStatusCode(
              'FulfillmentSolutionQuery',
              query.reference?.instance_id,
              this.status_codes.NO_SHIPPING_ADDRESS,
            );
          }
    
          if (!query.recipient?.address) {
            throwStatusCode(
              'FulfillmentSolutionQuery',
              query.reference?.instance_id,
              this.status_codes.NO_SHIPPING_ADDRESS,
            );
          }

          const customer = aggregation.customers.get(query.customer_id);
          const shop_country = aggregation.countries.get(query.sender.address.country_id);
          const customer_country = aggregation.countries.get(query.recipient.address.country_id);
          const courier_map = await this.courier_srv.find(
            query,
            request.subject,
            context,
          ).then(
            response => new ResourceMap<FulfillmentCourier>(
              response.items.map(item => item.payload)
            )
          );
          const product_map = await this.findFulfillmentProducts(
            query,
            courier_map.all.map(c => c.id),
            shop_country,
            customer_country,
            request.subject,
            context,
          ).then(
            response => new ResourceMap<FulfillmentProduct>(
              response.items.map(item => item.payload)
            )
          );

          const currency_map = await this.aggregator.getByIds<Currency>(
            product_map.all.flatMap(
              p => p.variants.map(v => v.price?.currency_id)
            ),
            CurrencyServiceDefinition,
            this.tech_user ?? request.subject,
            context,
          );

          const tax_map = await this.aggregator.getByIds<Tax>(
            product_map.all.flatMap(
              p => p.tax_ids
            ),
            TaxServiceDefinition,
            this.tech_user ?? request.subject,
            context,
          );

          const offer_lists = product_map.all.map(
            (product): Offer[] => product?.variants?.map(
              (variant): Offer => (
                {
                  name: `${product?.id}\t${variant.id}`,
                  price: variant.price.sale ? variant.price.sale_price : variant.price.regular_price,
                  maxWeight: variant.max_weight ?? throwStatusCode(
                    'FulfillmentProduct',
                    product?.id,
                    this.status_codes.MISSING_PACKAGING_INFO,
                    'Weight'
                  ),
                  width: variant.max_size?.width ?? throwStatusCode(
                    'FulfillmentProduct',
                    product?.id,
                    this.status_codes.MISSING_PACKAGING_INFO,
                    'Width'
                  ),
                  height: variant.max_size?.height ?? throwStatusCode(
                    'FulfillmentProduct',
                    product?.id,
                    this.status_codes.MISSING_PACKAGING_INFO,
                    'Height'
                  ),
                  depth: variant.max_size?.length ?? throwStatusCode(
                    'FulfillmentProduct',
                    product?.id,
                    this.status_codes.MISSING_PACKAGING_INFO,
                    'Length'
                  ),
                  type: 'parcel'
                }
              )
            )
          );
          this.logger?.debug('Offer List:', offer_lists);
        
          const goods = query.items.map((good): IItem => ({
            sku: `${good.product_id}\t${good.variant_id}`,
            desc: `${good.product_id}\t${good.variant_id}`,
            quantity: good.quantity,
            weight: good.package?.weight_in_kg ?? throwStatusCode(
              'Product',
              good.product_id,
              this.status_codes.MISSING_PACKAGING_INFO,
              'Weight'
            ),
            width: good.package?.size_in_cm?.width ?? throwStatusCode(
              'Product',
              good.product_id,
              this.status_codes.MISSING_PACKAGING_INFO,
              'Width',
            ),
            height: good.package?.size_in_cm?.height ?? throwStatusCode(
              'Product',
              good.product_id,
              this.status_codes.MISSING_PACKAGING_INFO,
              'Height'
            ),
            depth: good.package?.size_in_cm?.length ?? throwStatusCode(
              'Product',
              good.product_id,
              this.status_codes.MISSING_PACKAGING_INFO,
              'Length',
            ),
            price: 0.0, // placeholder
            taxType: 'vat_standard' // placeholder
          }));
          this.logger?.debug('Goods:', goods);

          const packer = new Packer({
            source: JSON.stringify({ zones: [] }),
            shipping: null
          });
          
          const solutions: FulfillmentSolution[] = await Promise.all(offer_lists.map(
            offers => packer.canFit(offers, goods)
          ).map(
            async containers => {
              const courier_ids = new Set<string>();
              const parcels = await Promise.all(containers.map(async (container): Promise<Parcel> => {
                const [product_id, variant_id] = container.getOffer().name.split('\t');
                const product = product_map.get(product_id);
                const variant = mergeFulfillmentProductVariant(product, variant_id);
                if (!variant) {
                  throw createStatusCode(
                    'FulfillmentProductVariant',
                    variant_id,
                    this.status_codes.NOT_FOUND,
                  );
                }
                const currency = currency_map.get(variant.price?.currency_id);
                const stub = Stub.getInstance(courier_map.get(product.courier_id));
                const taxes = tax_map.getMany(product.tax_ids);
                const pack = {
                  rotatable: !query.items.some(i => !i.package?.rotatable),
                  size_in_cm: {
                    height: container.getStackHeight(),
                    width: container.getWidth(),
                    length: container.getDepth()
                  },
                  weight_in_kg: container.getStackWeight(),
                };
                const net = await stub.calcNet(variant, pack, currency.precision ?? 2);
                const price = variant.price;
                const amount = calcAmount(
                  net, taxes, shop_country, customer_country,
                  currency,
                  !!customer?.private?.user_id,
                );
                courier_ids.add(product?.courier_id);
                return {
                  id: randomUUID(),
                  product_id,
                  variant_id,
                  items: countItems(query.items, container),
                  package: pack,
                  price,
                  amount
                };
              }));

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
                courier_ids: [...courier_ids.values()],
                parcels,
                amounts,
              } as FulfillmentSolution;
            }
          ));
          solutions.sort(
            (a, b) => Math.min(
              ...(a.amounts?.map(am => am.gross) ?? [])
            ) - Math.min(
              ...(b.amounts?.map(am => am.gross) ?? [])
            )
          );

          const status = solutions.length ? createStatusCode(
            'Solution',
            query.reference?.instance_id,
            this.status_codes.OK,
          ) : createStatusCode(
            'Solution',
            query.reference?.instance_id,
            this.status_codes.NO_SOLUTION_FOUND,
          );

          const solution: FulfillmentSolutionResponse = {
            reference: query.reference,
            solutions,
            status,
          };

          return solution;
        }
        catch (e: any) {
          const solution: FulfillmentSolutionResponse = {
            reference: query.reference,
            solutions: [],
            status: {
              id: query?.reference?.instance_id,
              code: Number.isInteger(e?.code) ? e?.code : 500,
              message: e?.details ?? e?.message ?? e
            }
          };
          return solution;
        }
      });

      const items = await Promise.all(promises);
      return {
        items,
        total_count: items.length,
        operation_status: createOperationStatusCode(
          this.operation_status_codes.SUCCESS,
          this.name,
        )
      };
    }
    catch (e: any) {
      return this.catchOperationError(e);
    }
  }
}
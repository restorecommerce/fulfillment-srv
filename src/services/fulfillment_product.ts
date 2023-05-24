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
import { ReadRequest } from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/resource_base';
import {
  FilterOp_Operator,
  Filter_Operation,
  Filter_ValueType
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/filter';
import { Courier as Packer, Offer } from '@restorecommerce/cart/lib/model/impl/Courier';
import { Container } from '@restorecommerce/cart/lib/model/impl/bin/Container';
import { IItem } from '@restorecommerce/cart/lib/model/IItem';
import {
  TaxServiceDefinition, VAT,
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/tax';
import {
  TaxTypeServiceDefinition,
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/tax_type';
import {
  Parcel,
  FulfillmentItem as Item,
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/fulfillment';
import {
  ProductQuery,
  ProductQueryList,
  PackingSolution,
  PackingSolutionListResponse,
  FulfillmentProductList,
  FulfillmentProductListResponse,
  PackingSolutionResponse,
  FulfillmentProductServiceImplementation,
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/fulfillment_product';
import {
  FulfillmentCourier,
  FulfillmentCourierListResponse
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/fulfillment_courier';
import { FulfillmentCourierService } from '.';
import { Courier, ProductResponse, ProductResponseMap, Stub } from '..';
import { Subject } from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/auth';


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
  private readonly tax_service: Client<TaxServiceDefinition>;
  private readonly tax_type_service: Client<TaxTypeServiceDefinition>;

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

  private async findCouriers(
    queries: ProductQueryTotals[],
    subject?: Subject,
    context?: any,
  ): Promise<DeepPartial<FulfillmentCourierListResponse>> {
    const call = ReadRequest.fromPartial({
      filters: [{
        filter: queries.flatMap(
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
        filter: [{
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
    const queries = buildQueryTotals(request.items);
    const promises = queries.map(async query => {
      const goods = query.items.map((good): IItem => ({
        desc: `${good.product_id}\t${good.variant_id}`,
        quantity: good.quantity,
        weight: good.package.weight_in_kg,
        width: good.package.size_in_cm.width,
        height: good.package.size_in_cm.height,
        depth: good.package.size_in_cm.length,
        price: 0.0, //good.price,
        taxType: 'vat_standard'
      }));

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

      const offer_lists = Object.values(product_map).map((product): Offer[] =>
        product.payload?.variants?.map((variant): Offer => (
          {
            name: `${product.payload?.id}\t${variant.id}`,
            price: variant.price,
            maxWeight: variant.max_weight,
            width: variant.max_size.width,
            height: variant.max_size.height,
            depth: variant.max_size.length,
            type: 'parcel'
          }
        ))
      );

      const packer = new Packer({
        source: JSON.stringify({ zones: [] }),
        shipping: null
      });

      const solutions: PackingSolution[] = offer_lists.map(
        offers => packer.canFit(offers, goods)
      ).map(
        containers => {
          const parcels = containers.map((container): Parcel => {
            const product_id = container.getOffer().name.split('\t')[0];
            const variant_id = container.getOffer().name.split('\t')[1];
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
              price: container.getOffer().price,
              vats: product_map[product_id]?.payload?.tax_ids.map(
                id => ({
                  tax_id: id,
                  vat: 0,
                })
              ),
            }
          });

          return {
            parcels,
            price: parcels.reduce((a, b) => a + b.price, 0),
            vats: Object.values(parcels.flatMap(p => p.vats).reduce(
              (a, b) => {
                const c = a[b.tax_id];
                if (c) {
                  c.vat += b.vat;
                }
                a[b.tax_id] = b;
                return a;
              },
              {} as { [id: string]: VAT }
            )),
            compactness: 1,
            homogeneity: 1,
            score: 1,
            reference_id: query.reference_id
          }
        }
      );

      const solution: PackingSolutionResponse = {
        reference_id: query.reference_id,
        solutions,
        status: {
          id: query.reference_id,
          code: 200,
          message: `Best Solution: ${Math.min(...solutions.map((s) => s.price))}`
        }
      };

      return solution;
    });

    const items = await Promise.all(promises);
    return {
      items,
      total_count: items.length,
      operation_status: {
        code: 200,
        message: 'success'
      }
    };
  }
}
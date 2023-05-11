import { randomUUID } from 'crypto';
import { Client } from 'nice-grpc';
import {
  createClient,
  createChannel,
  GrpcClientConfig
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
  ServiceDefinition as TaxServiceDefinition,
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/tax';
import {
  ServiceDefinition as TaxTypeServiceDefinition,
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/tax_type';
import {
  Parcel,
  FulfillmentItem,
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
import { Stub } from '..';


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

const countItems = (goods: FulfillmentItem[], container: Container) => {
  const item_map = new Map<string, FulfillmentItem>(goods.map(
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
  readonly tax_service: Client<TaxServiceDefinition>;
  readonly tax_type_service: Client<TaxTypeServiceDefinition>;

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

  async findCouriers(queries: ProductQueryTotals[], context?: any): Promise<DeepPartial<FulfillmentCourierListResponse>> {
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
      }]
    });
    return this.courier_srv.read(call, context);
  }

  async findProducts(queries: ProductQueryTotals[], courier_stubs?: Stub[], context?: any): Promise<DeepPartial<FulfillmentProductListResponse>> {
    courier_stubs = courier_stubs || await this.findCouriers(queries, context).then((resp: FulfillmentCourierListResponse) =>
      resp.items.map(item => Stub.getInstance(item.payload, { cfg: this.cfg, logger: this.logger }))
    );

    const call = ReadRequest.fromPartial({
      filters: [{
        filter: [{
          field: 'courier_id',
          operation: Filter_Operation.in,
          value: JSON.stringify(courier_stubs.map(stub => stub.courier.id)),
          type: Filter_ValueType.ARRAY
        }],
        operator: FilterOp_Operator.or
      }]
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

      const stubs = await this.findCouriers(queries, context).then(resp =>
        resp.items.map(item => Stub.getInstance(item.payload as FulfillmentCourier, { cfg: this.cfg, logger: this.logger }))
      );

      const products = await this.findProducts(queries, stubs, context).then(resp =>
        resp.items.map(item => item.payload)
      );

      const offer_lists = products.map((product): Offer[] =>
        product.variants?.map((variant): Offer =>
        ({
          name: `${product.id}\t${variant.id}`,
          price: variant.price,
          maxWeight: variant.max_weight,
          width: variant.max_size.width,
          height: variant.max_size.height,
          depth: variant.max_size.length,
          type: 'parcel'
        })
        )
      );

      const packer = new Packer({
        source: JSON.stringify({ zones: [] }),
        shipping: null
      });

      const solutions: PackingSolution[] = offer_lists.map(offers => packer.canFit(offers, goods)).map(containers => ({
        parcels: containers.map((container): Parcel => ({
          id: randomUUID(),
          product_id: container.getOffer().name.split('\t')[0],
          variant_id: container.getOffer().name.split('\t')[1],
          items: countItems(query.goods, container),
          height_in_cm: container.getStackHeight(),
          width_in_cm: container.getWidth(),
          weight_in_kg: container.getStackWeight(),
          length_in_cm: container.getDepth()
        })),
        price: containers.reduce((a, b) => a + b.getOffer().price, 0),
        compactness: 1,
        homogeneity: 1,
        score: 1,
        reference_id: query.reference_id
      }));

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
import { randomUUID } from 'crypto';
import { ResourcesAPIBase, ServiceBase } from '@restorecommerce/resource-base-interface';
import { DatabaseProvider } from '@restorecommerce/chassis-srv';
import { Topic } from '@restorecommerce/kafka-client';
import { DeepPartial } from '@restorecommerce/kafka-client/lib/protos';
import { ReadRequest } from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/resource_base';
import { FilterOp_Operator, Filter_Operation, Filter_ValueType } from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/filter';
import { Courier as Packer, Offer } from '@restorecommerce/cart/lib/model/impl/Courier';
import { Container } from '@restorecommerce/cart/lib/model/impl/bin/Container';
import { IItem } from '@restorecommerce/cart/lib/model/IItem';
import { Item } from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/product';
import {
  QueryList,
  Query,
  PackingSolution,
  PackingSolutionResponseList,
  FulfillmentProductResponseList as ProductResponseList,
  PackingSolutionResponse,
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/fulfillment_product';
import { Parcel } from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/fulfillment';
import { 
  FulfillmentProductResponseList,
  FulfillmentProductList
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/fulfillment_product';
import {
  FulfillmentCourier as Courier,
  FulfillmentCourierResponseList as CourierResponseList 
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/fulfillment_courier';
import { FulfillmentCourierService } from '.';
import { Stub } from '..';

const ENTITY_NAME = 'fulfillment_product';
const COLLECTION_NAME = 'fulfillment_products';


interface QueryTotals extends Query {
  volume: number;
  total_weight: number;
  max_width: number;
  max_height: number;
  max_length: number;
}

const buildQueryTotals = (items: Query[]): QueryTotals[] => items.map(
  (item: Query): QueryTotals => item.goods.reduce((a: QueryTotals, b: any) => {
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
  } as QueryTotals)
);

const countItems = (goods: Item[], container: Container) => {
  const item_map = new Map<string, Item>(goods.map(
    item => [item.product_variant_bundle_id, { ...item, quantity: 0 }]
  ));
  container.getLevels().forEach(level =>
    level.forEach(a => {
      const item = item_map.get(a.getBox().getName());
      item && (item.quantity += 1);
    })
  );
  return [...item_map.values()];
};

export class FulfillmentProductService extends ServiceBase<FulfillmentProductResponseList, FulfillmentProductList> {

  constructor(
    public courier_srv: FulfillmentCourierService,
    topic: Topic,
    db: DatabaseProvider,
    public cfg: any,
    public logger: any
  ) {
    super(
      ENTITY_NAME,
      topic,
      logger,
      new ResourcesAPIBase(db, COLLECTION_NAME),
      true
    );
  }

  async findCouriers(query: QueryTotals, context?: any): Promise<DeepPartial<CourierResponseList>>
  {
    const call = ReadRequest.fromPartial({
      filters: [{
        filter: query.preferences.couriers.map(att => ({
          field: att.id,
          operation: Filter_Operation.eq,
          value: att.value
        })),
        operator: FilterOp_Operator.or
      }]
    });
    return this.courier_srv.read(call, context);
  }

  async findProducts(query: QueryTotals, courier_stubs?: Stub[], context?: any): Promise<DeepPartial<ProductResponseList>>
  {
    courier_stubs = courier_stubs || await this.findCouriers(query, context).then((resp: CourierResponseList) =>
      resp.items.map(item => Stub.instantiate(item.payload, { cfg: this.cfg, logger: this.logger }))
    );

    const start_zones: string[] = [];
    for (const promise of courier_stubs.map(courier => courier.getZoneFor(query.sender.address)))
    {
      start_zones.push(await promise.catch(err => null));
    }

    const dest_zones: string[] = [];
    for (const promise of courier_stubs.map(courier => courier.getZoneFor(query.receiver.address)))
    {
      dest_zones.push(await promise.catch(err => null));
    }

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

  async find(request: QueryList, context?: any): Promise<PackingSolutionResponseList>
  {
    const queries = buildQueryTotals(request.items);
    const promises = queries.map(async query => {
      const goods = query.goods.map((good): IItem => ({
        sku: good.product_variant_bundle_id,
        quantity: good.quantity,
        weight: good.weight_in_kg,
        width: good.width_in_cm,
        height: good.height_in_cm,
        depth: good.length_in_cm,
        price: good.price,
        taxType: 'vat_standard'
      }));

      const stubs = await this.findCouriers(query, context).then(resp =>
        resp.items.map(item => Stub.instantiate(item.payload as Courier, { cfg: this.cfg, logger: this.logger }))
      );

      const products = await this.findProducts(query, stubs, context).then(resp =>
        resp.items.map(item => item.payload)
      );

      const offer_lists = products.map((product): Offer[] =>
        product.variants?.map((variant): Offer =>
          ({
            name: `${product.id}\t${variant.id}`,
            price: variant.price,
            maxWeight: variant.max_weight,
            width: variant.max_width,
            height: variant.max_height,
            depth: variant.max_length,
            type: 'parcel'
          })
        )
      );

      const packer = new Packer({
        source: JSON.stringify({ zones:[] }),
        shipping: null
      });

      const solutions: PackingSolution[] = offer_lists.map(offers => packer.canFit(offers, goods)).map(containers => ({
        parcels: containers.map((container): Parcel => ({
          id: randomUUID(),
          product_id: container.getOffer().name.split('\t')[0],
          product_variant_id: container.getOffer().name.split('\t')[1],
          items: countItems(query.goods, container),
          height_in_cm: container.getStackHeight(),
          width_in_cm: container.getWidth(),
          weight_in_kg: container.getStackWeight(),
          length_in_cm: container.getDepth()
        })),
        price: containers.reduce((a,b) => a + b.getOffer().price, 0),
        compactness: 1,
        homogeneity: 1,
        score: 1,
        reference_id: query.reference_id
      }));

      const solution: PackingSolutionResponse = {
        solutions,
        status: {
          id: query.reference_id,
          code: 200,
          message: `Best Solution: ${solutions.reduce((a,b) => Math.min(a,b.price), Number.MAX_SAFE_INTEGER)}`
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
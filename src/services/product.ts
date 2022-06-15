import { ResourcesAPIBase, ServiceBase } from '@restorecommerce/resource-base-interface';
import {
  ServiceCall,
  ReadRequest,
  FilterOperation,
  FilterValueType,
  OperatorType
} from '@restorecommerce/resource-base-interface/lib/core/interfaces';
import { DatabaseProvider } from '@restorecommerce/chassis-srv';
import { Topic } from '@restorecommerce/kafka-client';
import { Courier as Packer, Offer } from '@restorecommerce/cart/lib/model/impl/Courier';
import { Container } from '@restorecommerce/cart/lib/model/impl/bin/Container';
import { IItem } from '@restorecommerce/cart/lib/model/IItem';
import {
  QueryList,
  Query,
  PackingSolution,
  PackingSolutionResponseList,
  FulfillmentProductResponseList as ProductResponseList,
  PackingSolutionResponse,
} from '../generated/io/restorecommerce/fulfillment_product';
import { Item as Good } from '../generated/io/restorecommerce/order';
import { Parcel } from '../generated/io/restorecommerce/fulfillment';
import { FulfillmentCourierResponseList as CourierResponseList } from '../generated/io/restorecommerce/fulfillment_courier';
import { FulfillmentCourierResourceService } from '.';
import { Stub } from '..';


interface QueryTotals extends Query {
  volume: number;
  total_weight: number;
  max_width: number;
  max_height: number;
  max_length: number;
}

const buildQueryTotals = (items: Query[]): QueryTotals[] => items.map((item: Query) => Object.assign({}, item.goods.reduce((a: any, b: Good) => {
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
})));

const count_items = (container:Container) => {
  const items_ids: { [item_id:string]:number } = {};
  container.getLevels().forEach(level => 
    level.forEach(a => 
      items_ids[a.getBox().getName()] = (items_ids[a.getBox().getName()] || 0) + 1
    )
  );
  return Object.entries(items_ids).map(([item_id, quantity]) => ({ item_id, quantity }));
};

export class FulfillmentProductResourceService extends ServiceBase {

  constructor(
    public courier_srv: FulfillmentCourierResourceService,
    topic: Topic,
    db: DatabaseProvider,
    public cfg: any,
    public logger: any
  ) {
    super(
      'fulfillment_product',
      topic,
      logger,
      new ResourcesAPIBase(db, 'fulfillment_product'),
      true
    );
  }

  async findCouriers(query: QueryTotals, context?: any): Promise<CourierResponseList>
  {
    const call: ServiceCall<ReadRequest> = {
      request: {
        filters: [{
          filter: query.preferences.couriers.map(att => ({
            field: att.id,
            operation: FilterOperation.eq,
            value: att.value
          })),
          operator: OperatorType.or
        }]
      }
    };
    return this.courier_srv.read(call, context);
  }

  async findProducts(query: QueryTotals, courier_stubs?: Stub[], context?: any): Promise<ProductResponseList>
  {
    courier_stubs = courier_stubs || await this.findCouriers(query, context).then((resp: CourierResponseList) =>
      resp.items.map(item => Stub.instantiate(item.payload, { cfg: this.cfg, logger: this.logger }))
    );

    const start_zones: string[] = [];
    for (const promise of courier_stubs.map(courier => courier.getZoneFor(query.sender)))
    {
      start_zones.push(await promise.catch(err => null));
    }

    const dest_zones: string[] = [];
    for (const promise of courier_stubs.map(courier => courier.getZoneFor(query.receiver)))
    {
      dest_zones.push(await promise.catch(err => null));
    }

    const call: ServiceCall<ReadRequest> = {
      request: {
        filters: [{
          filter: [{
            field: 'courier_id',
            operation: FilterOperation.in,
            value: JSON.stringify(courier_stubs.map(stub => stub.courier.id)),
            type: FilterValueType.ARRAY
          }],
          operator: OperatorType.or
        }]
      }
    };

    return this.read(call, context);
  }

  async find(call: ServiceCall<QueryList>, context?: any): Promise<PackingSolutionResponseList>
  {
    const queries = buildQueryTotals(call.request.items);
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
        resp.items.map(item => Stub.instantiate(item.payload, { cfg: this.cfg, logger: this.logger }))
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
          product_id: container.getOffer().name.split('\t')[0],
          product_variant_id: container.getOffer().name.split('\t')[1],
          items: count_items(container),
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
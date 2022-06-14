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
  totalWeight: number;
  maxWidth: number;
  maxHeight: number;
  maxLength: number;
}

const buildQueryTotals = (items: Query[]): QueryTotals[] => items.map((item: Query) => Object.assign({}, item.goods.reduce((a: any, b: Good) => {
  a.volume += b.widthInCm * b.heightInCm * b.lengthInCm * b.quantity;
  a.totalWeight += b.weightInKg * b.quantity;
  a.maxWidth = Math.max(a.maxWidth, b.widthInCm);
  a.maxHeight = Math.max(a.maxHeight, b.heightInCm);
  a.maxLength = Math.max(a.maxLength, b.lengthInCm);
  return a;
}, {
  ...item,
  volume: 0.0,
  totalWeight: 0.0,
  maxWidth: 0.0,
  maxHeight: 0.0,
  maxLength: 0.0
})));

const countItems = (container: Container) => {
  const itemsIds: { [itemId: string]: number } = {};
  container.getLevels().forEach(level =>
    level.forEach(a =>
      itemsIds[a.getBox().getName()] = (itemsIds[a.getBox().getName()] || 0) + 1
    )
  );
  return Object.entries(itemsIds).map(([itemId, quantity]) => ({ itemId, quantity }));
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
        sku: good.productVariantBundleId,
        quantity: good.quantity,
        weight: good.weightInKg,
        width: good.widthInCm,
        height: good.heightInCm,
        depth: good.lengthInCm,
        price: good.price,
        taxType: 'vat_standard'
      }));

      const stubs = await this.findCouriers(query, context).then(resp =>
        resp.items.map(item => Stub.instantiate(item.payload, { cfg: this.cfg, logger: this.logger }))
      );

      const products = await this.findProducts(query, stubs, context).then(resp =>
        resp.items.map(item => item.payload)
      );

      const offerLists = products.map((product): Offer[] =>
        product.variants?.map((variant): Offer =>
          ({
            name: `${product.id}\t${variant.id}`,
            price: variant.price,
            maxWeight: variant.maxWeight,
            width: variant.maxWidth,
            height: variant.maxHeight,
            depth: variant.maxLength,
            type: 'parcel'
          })
        )
      );

      const packer = new Packer({
        source: JSON.stringify({ zones:[] }),
        shipping: null
      });

      const solutions: PackingSolution[] = offerLists.map(offers => packer.canFit(offers, goods)).map(containers => ({
        parcels: containers.map((container): Parcel => ({
          productId: container.getOffer().name.split('\t')[0],
          productVariantId: container.getOffer().name.split('\t')[1],
          items: countItems(container),
          heightInCm: container.getStackHeight(),
          widthInCm: container.getWidth(),
          weightInKg: container.getStackWeight(),
          lengthInCm: container.getDepth()
        })),
        price: containers.reduce((a,b) => a + b.getOffer().price, 0),
        compactness: 1,
        homogeneity: 1,
        score: 1,
        referenceId: query.referenceId
      }));

      const solution: PackingSolutionResponse = {
        solutions,
        status: {
          id: query.referenceId,
          code: 200,
          message: `Best Solution: ${solutions.reduce((a,b) => Math.min(a,b.price), Number.MAX_SAFE_INTEGER)}`
        }
      };

      return solution;
    });

    const items = await Promise.all(promises);
    return {
      items,
      totalCount: items.length,
      operationStatus: {
        code: 200,
        message: 'success'
      }
    };
  }
}
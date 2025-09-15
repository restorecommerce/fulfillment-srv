import { Logger } from '@restorecommerce/logger';
import { ServiceConfig } from '@restorecommerce/service-config';
import { Status } from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/status.js';
import {
  AggregatedFulfillmentListResponse,
  Courier,
  FlatAggregatedFulfillment,
  flatMapAggregatedFulfillmentListResponse,
  mergeFulfillments,
} from './utils.js';
import {
  FulfillmentProduct,
  FulfillmentSolutionQuery,
  Variant
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/fulfillment_product.js';
import {
  Package
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/product.js';
import {
  FulfillmentState
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/fulfillment.js';

type AdapterType<T extends Adapter> = new (courier: Courier, cfg?: ServiceConfig, logger?: Logger, kwargs?: any) => T;

export abstract class Adapter
{
  protected static readonly ADAPTER_TYPES: Record<string, AdapterType<any>> = {};
  protected static readonly REGISTER: Record<string, Adapter> = {};
  static cfg: ServiceConfig = null;
  static logger: Logger = null;

  abstract get type(): string;

  constructor(
    protected courier: Courier,
    protected cfg?: any,
    protected logger?: Logger
  ) {}

  protected abstract evaluateImpl (
    fulfillments: FlatAggregatedFulfillment[],
    aggregation: AggregatedFulfillmentListResponse,
  ): Promise<FlatAggregatedFulfillment[]>;
  protected abstract submitImpl (
    fulfillments: FlatAggregatedFulfillment[],
    aggregation: AggregatedFulfillmentListResponse,
  ): Promise<FlatAggregatedFulfillment[]>;
  protected abstract trackImpl (
    fulfillments: FlatAggregatedFulfillment[],
    aggregation: AggregatedFulfillmentListResponse,
  ): Promise<FlatAggregatedFulfillment[]>;
  protected abstract cancelImpl (
    fulfillments: FlatAggregatedFulfillment[],
    aggregation: AggregatedFulfillmentListResponse,
  ): Promise<FlatAggregatedFulfillment[]>;
  public abstract matchesZone<T>(
    product: FulfillmentProduct,
    query: FulfillmentSolutionQuery,
    helper?: T
  ): Promise<boolean>;
  public abstract calcNet(
    product: Variant,
    pack: Package,
    precision: number,
  ): Promise<BigNumber>;

  protected createStatusCode(
    entity: string,
    id: string,
    status: Status,
    details?: string,
  ): Status {
    return {
      id,
      code: status?.code ?? 500,
      message: status?.message?.replaceAll(
        '{details}', details
      ).replaceAll(
        '{entity}', entity
      ).replaceAll(
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
      status,error
    );
  }

  protected catchStatusError(e?: any, item?: FlatAggregatedFulfillment): FlatAggregatedFulfillment {
    item ??= {};
    const {
      code,
      title,
      message,
      details,
    } = e ?? {};
    item.status = {
      id: item?.payload?.id,
      code: Number.isInteger(code) ? code : 500,
      message: message ? [
        title,
        message,
        details,
      ].filter(s => s).join('; ') : 'Unknwon Error!'
    };
    this.logger?.warn(e?.stack ?? item.status.message, item);
    return item;
  }

  public async evaluate(
    fulfillments: FlatAggregatedFulfillment[],
    aggregation: AggregatedFulfillmentListResponse
  ): Promise<FlatAggregatedFulfillment[]> {
    fulfillments = fulfillments?.filter(f => f.product.courier_id === this.courier.id);
    if (fulfillments?.length > 0) {
      return await this.evaluateImpl(
        fulfillments,
        aggregation,
      ).catch(
        error => fulfillments.map(
          fulfillment => {
            fulfillment = this.catchStatusError(
              error, fulfillment
            );
            return fulfillment;
          }
        )
      );
    }
    else {
      return [];
    }
  }

  public async submit(
    fulfillments: FlatAggregatedFulfillment[],
    aggregation: AggregatedFulfillmentListResponse
  ): Promise<FlatAggregatedFulfillment[]> {
    fulfillments = fulfillments?.filter(
      f => f.product.courier_id === this.courier.id
        && (
          f.fulfillment_state === undefined
          || f.fulfillment_state === FulfillmentState.PENDING
        )
    );
    if (fulfillments?.length > 0) {
      return await this.submitImpl(
        fulfillments,
        aggregation,
      ).catch(
        error => fulfillments.map(
          fulfillment => {
            fulfillment = this.catchStatusError(
              error, fulfillment
            );
            return fulfillment;
          }
        )
      );
    }
    else {
      return [];
    }
  }

  public async track(
    fulfillments: FlatAggregatedFulfillment[],
    aggregation: AggregatedFulfillmentListResponse
  ): Promise<FlatAggregatedFulfillment[]> {
    fulfillments = fulfillments?.filter(
      f => f.product.courier_id === this.courier.id
      && (
        f.fulfillment_state === FulfillmentState.SUBMITTED
        || f.fulfillment_state === FulfillmentState.IN_TRANSIT
        || f.fulfillment_state === FulfillmentState.RETOURE
      )
    );
    if (fulfillments?.length > 0) {
      return await this.trackImpl(
        fulfillments,
        aggregation,
      ).catch(
        error => fulfillments.map(
          fulfillment => {
            fulfillment = this.catchStatusError(
              error, fulfillment
            );
            return fulfillment;
          }
        )
      );
    }
    else {
      return [];
    }
  }

  public async cancel(
    fulfillments: FlatAggregatedFulfillment[],
    aggregation: AggregatedFulfillmentListResponse
  ): Promise<FlatAggregatedFulfillment[]> {
    fulfillments = fulfillments?.filter(
      f => f.product.courier_id === this.courier.id
      && (
        f.fulfillment_state === FulfillmentState.SUBMITTED
        || f.fulfillment_state === FulfillmentState.IN_TRANSIT
      )
    );
    if (fulfillments?.length > 0) {
      return await this.cancelImpl(
        fulfillments,
        aggregation,
      ).catch(
        error => fulfillments.map(
          fulfillment => {
            fulfillment = this.catchStatusError(
              error, fulfillment
            );
            return fulfillment;
          }
        )
      );
    }
    else {
      return [];
    }
  }

  public static all() {
    return Object.values(Adapter.REGISTER);
  }

  public static async evaluate(
    aggregation: AggregatedFulfillmentListResponse,
    cfg?: ServiceConfig,
    logger?: Logger,
    kwargs?: any,
  ) {
    const fulfillments = flatMapAggregatedFulfillmentListResponse(aggregation);
    const results = await Promise.all(aggregation.fulfillment_couriers.all.map(
      (courier) => Adapter.getInstance(
        courier,
        cfg ?? Adapter.cfg,
        logger ?? Adapter.logger,
        kwargs,
      ).evaluate(
        fulfillments,
        aggregation,
      )
    )).then(
      response => response.flat()
    );
    return mergeFulfillments(results, aggregation);
  }

  public static async submit(
    aggregation: AggregatedFulfillmentListResponse,
    cfg?: ServiceConfig,
    logger?: Logger,
    kwargs?: any,
  ) {
    const fulfillments = flatMapAggregatedFulfillmentListResponse(aggregation);
    const results = await Promise.all(aggregation.fulfillment_couriers.all.map(
      (courier) => Adapter.getInstance(
        courier,
        cfg ?? Adapter.cfg,
        logger ?? Adapter.logger,
        kwargs,
      ).submit(
        fulfillments,
        aggregation,
      )
    )).then(
      response => response.flat()
    );
    return mergeFulfillments(results, aggregation);
  }

  public static async track(
    aggregation: AggregatedFulfillmentListResponse,
    cfg?: ServiceConfig,
    logger?: Logger,
    kwargs?: any,
  ) {
    const fulfillments = flatMapAggregatedFulfillmentListResponse(aggregation);
    const results = await Promise.all(aggregation.fulfillment_couriers.all.map(
      (courier) => Adapter.getInstance(
        courier,
        cfg ?? Adapter.cfg,
        logger ?? Adapter.logger,
        kwargs,
      ).track(
        fulfillments,
        aggregation,
      )
    )).then(
      response => response.flat()
    );
    return mergeFulfillments(results, aggregation);
  }

  public static async cancel(
    aggregation: AggregatedFulfillmentListResponse,
    cfg?: ServiceConfig,
    logger?: Logger,
    kwargs?: any,
  ) {
    const fulfillments = flatMapAggregatedFulfillmentListResponse(aggregation);
    const results = await Promise.all(aggregation.fulfillment_couriers.all.map(
      (courier) => Adapter.getInstance(
        courier,
        cfg ?? Adapter.cfg,
        logger ?? Adapter.logger,
        kwargs,
      ).cancel(
        fulfillments,
        aggregation,
      )
    )).then(
      response => response.flat()
    );
    return mergeFulfillments(results, aggregation);
  }

  public static register<T extends Adapter>(
    type_name: string,
    type: AdapterType<T>
  ) {
    Adapter.ADAPTER_TYPES[type_name] = type;
    Adapter.logger?.info(
      'Courier Adapter registered:',
      {
        name: type_name,
        'type': type,
      }
    );
  }

  public static getInstance(
    courier: Courier,
    cfg?: ServiceConfig,
    logger?: Logger,
    kwargs?: any,
  ): Adapter {
    let adapter = Adapter.REGISTER[courier?.id];
    if (!adapter) {
      if (courier.api in Adapter.ADAPTER_TYPES)
      {
        adapter = new Adapter.ADAPTER_TYPES[courier.api](
          courier,
          cfg ?? Adapter.cfg,
          logger ?? Adapter.logger,
          kwargs,
        );
        Adapter.REGISTER[courier.id] = adapter;
      }
      else {
        throw new Error(`No API Adapter registered for courier id ${courier?.id} with adapter type ${courier.api}`);
      }
    }
    return adapter;
  }
};
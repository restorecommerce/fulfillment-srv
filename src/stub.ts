import { BigNumber } from 'bignumber.js';
import { Logger } from '@restorecommerce/logger';
import { ServiceConfig } from '@restorecommerce/service-config';
import { Status } from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/status.js';
import {
  AggregatedFulfillmentListResponse,
  Courier,
  FlatAggregatedFulfillment,
  flatMapAggregatedFulfillmentListResponse,
  mergeFulfillments,
  unique,
} from './utils.js';
import {
  FulfillmentProduct,
  FulfillmentSolutionQuery,
  Variant
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/fulfillment_product.js';
import { Package } from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/product.js';
import { FulfillmentState } from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/fulfillment.js';

type StubType<T extends Stub> = new (courier: Courier, cfg?: ServiceConfig, logger?: Logger, kwargs?: any) => T;

export abstract class Stub
{
  protected static readonly STUB_TYPES: Record<string, StubType<any>> = {};
  protected static readonly REGISTER: Record<string, Stub> = {};
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
  public abstract calcGross(
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
      message: status?.message?.replace(
        '{details}', details
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
      status,error
    );
  }

  protected handleStatusError<T>(id: string, error: any, payload?: any): T {
    this.logger?.warn(error);
    return {
      payload,
      status: {
        id,
        code: error?.code ?? 500,
        message: error?.details ?? error?.message ?? error?.toString(),
      }
    } as T;
  }

  protected handleOperationError<T>(error: any, items: any[] = []): T {
    this.logger?.error(error);
    return {
      items: items ?? [],
      total_count: items?.length ?? 0,
      operation_status: {
        code: error?.code ?? 500,
        message: error?.details ?? error?.message ?? error?.toString(),
      }
    } as T;
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
      );
    }
    else {
      return [];
    }
  }

  public static all() {
    return Object.values(Stub.REGISTER);
  }

  public static async evaluate(
    aggregation: AggregatedFulfillmentListResponse,
    cfg?: ServiceConfig,
    logger?: Logger,
    kwargs?: any,
  ) {
    const fulfillments = flatMapAggregatedFulfillmentListResponse(aggregation);
    const results = await Promise.all(aggregation.fulfillment_couriers.all.map(
      (courier) => Stub.getInstance(
        courier,
        cfg ?? Stub.cfg,
        logger ?? Stub.logger,
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
      (courier) => Stub.getInstance(
        courier,
        cfg ?? Stub.cfg,
        logger ?? Stub.logger,
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
      (courier) => Stub.getInstance(
        courier,
        cfg ?? Stub.cfg,
        logger ?? Stub.logger,
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
      (courier) => Stub.getInstance(
        courier,
        cfg ?? Stub.cfg,
        logger ?? Stub.logger,
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

  public static register<T extends Stub>(
    type_name: string,
    type: StubType<T>
  ) {
    Stub.STUB_TYPES[type_name] = type;
    Stub.logger?.info(
      'Courier Stub registered:',
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
  ): Stub {
    let stub = Stub.REGISTER[courier.id];
    if (!stub && (courier.api in Stub.STUB_TYPES))
    {
      stub = new Stub.STUB_TYPES[courier.api](
        courier,
        cfg ?? Stub.cfg,
        logger ?? Stub.logger,
        kwargs,
      );
      Stub.REGISTER[courier.id] = stub;
    }
    return stub;
  }
};
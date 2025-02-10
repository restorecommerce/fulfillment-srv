import { Logger } from 'winston';
import { Status } from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/status.js';
import {
  Courier,
  FlatAggregatedFulfillment,
  unique,
} from './utils.js';
import {
  FulfillmentProduct,
  FulfillmentSolutionQuery,
  Variant
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/fulfillment_product.js';
import { BigNumber } from 'bignumber.js';
import { Package } from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/product.js';

export abstract class Stub
{
  protected static readonly STUB_TYPES: { [key: string]: (new (courier: Courier, kwargs?: { [key: string]: any }) => Stub) } = {};
  protected static readonly REGISTER: { [key: string]: Stub } = {};
  static cfg: any = null;
  static logger: Logger = null;

  abstract get type(): string;

  constructor(
    public courier: Courier,
    public cfg?: any,
    public logger?: Logger
  ) {}

  protected abstract evaluateImpl (fulfillments: FlatAggregatedFulfillment[]): Promise<FlatAggregatedFulfillment[]>;
  protected abstract submitImpl (fulfillments: FlatAggregatedFulfillment[]): Promise<FlatAggregatedFulfillment[]>;
  protected abstract trackImpl (fulfillments: FlatAggregatedFulfillment[]): Promise<FlatAggregatedFulfillment[]>;
  protected abstract cancelImpl (fulfillments: FlatAggregatedFulfillment[]): Promise<FlatAggregatedFulfillment[]>;
  public abstract matchesZone<T>(product: FulfillmentProduct, query: FulfillmentSolutionQuery, helper?: T): Promise<boolean>;
  public abstract calcGross(product: Variant, pack: Package): Promise<BigNumber>;

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
        message: error?.message ?? error?.details ?? error?.toString(),
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
        message: error?.message ?? error?.details ?? error?.toString(),
      }
    } as T;
  }

  public readonly evaluate = (fulfillments: FlatAggregatedFulfillment[]) => this.evaluateImpl(
    fulfillments.filter(f => f.courier?.id === this.courier.id)
  );

  public readonly submit = (fulfillments: FlatAggregatedFulfillment[]) => this.submitImpl(
    fulfillments.filter(f => f.courier?.id === this.courier.id)
  );

  public readonly track = (fulfillments: FlatAggregatedFulfillment[]) => this.trackImpl(
    fulfillments.filter(f => f.courier?.id === this.courier.id)
  );

  public readonly cancel = (fulfillments: FlatAggregatedFulfillment[]) => this.cancelImpl(
    fulfillments.filter(f => f.courier?.id === this.courier.id)
  );

  public static all() {
    return Object.values(Stub.REGISTER);
  }

  public static async evaluate(
    fulfillments: FlatAggregatedFulfillment[],
    kwargs?: any
  ) {
    return await Promise.all(unique(fulfillments.map(f => f.courier)).map(
      (courier) => Stub.getInstance(
        courier,
        {
          cfg: Stub.cfg,
          logger: Stub.logger,
          ...kwargs
        }
      ).evaluate(
        fulfillments
      )
    )).then(
      response => response.flatMap(r => r)
    );
  }

  public static async submit(
    fulfillments: FlatAggregatedFulfillment[],
    kwargs?: any
  ) {
    return await Promise.all(unique(fulfillments.map(f => f.courier)).map(
      (courier) => Stub.getInstance(
        courier,
        {
          cfg: Stub.cfg,
          logger: Stub.logger,
          ...kwargs
        }
      ).submit(
        fulfillments
      )
    )).then(
      response => response.flatMap(r => r)
    );
  }

  public static async track(
    fulfillments: FlatAggregatedFulfillment[],
    kwargs?: any
  ) {
    return await Promise.all(Object.values(extractCouriers(fulfillments)).map(
      (courier) => Stub.getInstance(
        courier,
        {
          cfg: Stub.cfg,
          logger: Stub.logger,
          ...kwargs
        }
      ).track(
        fulfillments
      )
    )).then(
      response => response.flatMap(r => r)
    );
  }

  public static async cancel(
    fulfillments: FlatAggregatedFulfillment[],
    kwargs?: any
  ) {
    return await Promise.all(Object.values(extractCouriers(fulfillments)).map(
      (courier) => Stub.getInstance(
        courier,
        {
          cfg: Stub.cfg,
          logger: Stub.logger,
          ...kwargs
        }
      ).cancel(
        fulfillments
      )
    )).then(
      response => response.flatMap(r => r)
    );
  }

  public static register<T extends Stub>(
    type_name: string,
    type: (new (courier: Courier, kwargs?: { [key: string]: any }) => T)
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

  public static getInstance(courier: Courier, kwargs?: { [key: string]: any }): Stub
  {
    let stub = Stub.REGISTER[courier.id];
    if (!stub && (courier.stub_type in Stub.STUB_TYPES))
    {
      stub = new Stub.STUB_TYPES[courier.stub_type](courier, kwargs);
      Stub.REGISTER[courier.id] = stub;
    }
    return stub;
  }
};
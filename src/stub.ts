import { Logger } from 'winston';
import {
    Courier,
    FlatAggregatedFulfillment,
    extractCouriers,
} from './utils';

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

  /**
   * Evaluate the tarife code
   * @param address 
   */
  abstract getTariffCode(fulfillment: FlatAggregatedFulfillment): Promise<string>;
  
  readonly evaluate = (fulfillments: FlatAggregatedFulfillment[]) => this.evaluateImpl(
    fulfillments.filter(f => f.product?.courier_id === this.courier.id)
  );

  readonly submit = (fulfillments: FlatAggregatedFulfillment[]) => this.submitImpl(
    fulfillments.filter(f => f.product?.courier_id === this.courier.id)
  );

  readonly track = (fulfillments: FlatAggregatedFulfillment[]) => this.trackImpl(
    fulfillments.filter(f => f.product?.courier_id === this.courier.id)
  );

  readonly cancel = (fulfillments: FlatAggregatedFulfillment[]) => this.cancelImpl(
    fulfillments.filter(f => f.product?.courier_id === this.courier.id)
  );

  static all() {
    return Object.values(Stub.REGISTER);
  }

  static evaluate(
    fulfillments: FlatAggregatedFulfillment[],
    kwargs?: any
  ) {
    return Object.values(extractCouriers(fulfillments)).map(
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
    );
  }

  static submit(
    fulfillments: FlatAggregatedFulfillment[],
    kwargs?: any
  ) {
    return Object.values(extractCouriers(fulfillments)).map(
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
    );
  }

  static track(
    fulfillments: FlatAggregatedFulfillment[],
    kwargs?: any
  ) {
    return Object.values(extractCouriers(fulfillments)).map(
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
    );
  }

  static cancel(
    fulfillments: FlatAggregatedFulfillment[],
    kwargs?: any
  ) {
    return Object.values(extractCouriers(fulfillments)).map(
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
    );
  }

  static register<T extends Stub>(
    typeName: string,
    type: (new (courier: Courier, kwargs?: { [key: string]: any }) => T)
  ) {
    Stub.STUB_TYPES[typeName] = type;
  }
  
  static getInstance(courier: Courier, kwargs?: { [key: string]: any }): Stub
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
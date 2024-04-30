import { FlatAggregatedFulfillment } from '../utils.js';
import { Stub } from '../stub.js';

class DummyStub extends Stub {

  get type(): string {
    return this.constructor.name;
  }

  override async getTariffCode(
    fulfillment: FlatAggregatedFulfillment
  ): Promise<string> {
    return fulfillment.recipient_country.country_code;
  }

  protected override async evaluateImpl(
    fulfillments: FlatAggregatedFulfillment[]
  ): Promise<FlatAggregatedFulfillment[]> {
    return fulfillments;
  }

  protected override async submitImpl(
    fulfillments: FlatAggregatedFulfillment[]
  ): Promise<FlatAggregatedFulfillment[]> {
    return fulfillments;
  }

  protected override async trackImpl(
    fulfillments: FlatAggregatedFulfillment[]
  ): Promise<FlatAggregatedFulfillment[]> {
    return fulfillments;
  }

  protected override async cancelImpl(
    fulfillments: FlatAggregatedFulfillment[]
  ): Promise<FlatAggregatedFulfillment[]> {
    return fulfillments;
  }
}

Stub.register('Dummy', DummyStub);
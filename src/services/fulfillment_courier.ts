import { ResourcesAPIBase, ServiceBase } from '@restorecommerce/resource-base-interface';
import { type Logger } from '@restorecommerce/logger';
import { type DatabaseProvider } from '@restorecommerce/chassis-srv';
import { type ServiceConfig } from '@restorecommerce/service-config';
import { Topic } from '@restorecommerce/kafka-client';
import {
  ACSClientContext,
  AuthZAction,
  DefaultACSClientContextFactory,
  DefaultResourceFactory,
  Operation,
  access_controlled_function,
  access_controlled_service,
  injects_meta_data
} from '@restorecommerce/acs-client';
import {
  FulfillmentCourierListResponse,
  FulfillmentCourierList,
  FulfillmentCourierServiceImplementation,
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/fulfillment_courier.js';
import { Subject } from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/auth.js';
import { OperationStatus } from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/status.js';
import {
  DeleteRequest,
  ReadRequest
} from '@restorecommerce/rc-grpc-clients';
import {
  Filter_Operation,
  Filter_ValueType
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/filter.js';

@access_controlled_service
export class FulfillmentCourierService
  extends ServiceBase<FulfillmentCourierListResponse, FulfillmentCourierList>
  implements FulfillmentCourierServiceImplementation {
  private static async ACSContextFactory(
    self: FulfillmentCourierService,
    request: FulfillmentCourierList,
    context: any,
  ): Promise<ACSClientContext> {
    const ids = request.items?.map((item: any) => item.id);
    const resources = await self.getCouriersByIds(ids, request.subject, context);
    return {
      ...context,
      subject: request.subject,
      resources: [
        ...resources.items ?? [],
        ...request.items ?? [],
      ],
    };
  }

  constructor(
    topic:
    Topic,
    db: DatabaseProvider,
    cfg: ServiceConfig,
    logger: Logger
  ) {
    super(
      cfg.get('database:main:entities:1') ?? 'fulfillment_courier',
      topic,
      logger,
      new ResourcesAPIBase(
        db,
        cfg.get('database:main:collections:1') ?? 'fulfillment_couriers',
        cfg.get('fieldHandlers:fulfillment_courier')
      ),
      cfg.get('events:enableEvents')?.toString() === 'true',
    );
  }

  protected getCouriersByIds(
    ids: string[],
    subject?: Subject,
    context?: any
  ): Promise<FulfillmentCourierListResponse> {
    ids = [...new Set(ids)];
    if (ids.length > 1000) {
      throw {
        code: 500,
        message: 'Query for fulfillments exceeds limit of 1000!'
      } as OperationStatus;
    }

    const request = ReadRequest.fromPartial({
      filters: [{
        filters: [{
          field: 'id',
          operation: Filter_Operation.in,
          value: JSON.stringify(ids),
          type: Filter_ValueType.ARRAY
        }]
      }],
      subject
    });
    return super.read(request, context);
  }

  public superRead(
    request: ReadRequest,
    context?: any,
  ) {
    return super.read(request, context);
  }

  @access_controlled_function({
    action: AuthZAction.READ,
    operation: Operation.whatIsAllowed,
    context: DefaultACSClientContextFactory,
    resource: [{ resource: 'fulfillment_courier' }],
    database: 'arangoDB',
    useCache: true,
  })
  public override read(
    request: ReadRequest,
    context?: any,
  ) {
    return super.read(request, context);
  }

  @injects_meta_data()
  @access_controlled_function({
    action: AuthZAction.CREATE,
    operation: Operation.isAllowed,
    context: FulfillmentCourierService.ACSContextFactory,
    resource: DefaultResourceFactory('fulfillment_courier'),
    database: 'arangoDB',
    useCache: true,
  })
  public override create(
    request: FulfillmentCourierList,
    context?: any
  ) {
    return super.create(request, context);
  }

  @access_controlled_function({
    action: AuthZAction.MODIFY,
    operation: Operation.isAllowed,
    context: FulfillmentCourierService.ACSContextFactory,
    resource: DefaultResourceFactory('fulfillment_courier'),
    database: 'arangoDB',
    useCache: true,
  })
  public override update(
    request: FulfillmentCourierList,
    context?: any
  ) {
    return super.update(request, context);
  }

  @injects_meta_data()
  @access_controlled_function({
    action: AuthZAction.MODIFY,
    operation: Operation.isAllowed,
    context: FulfillmentCourierService.ACSContextFactory,
    resource: DefaultResourceFactory('fulfillment_courier'),
    database: 'arangoDB',
    useCache: true,
  })
  public override upsert(
    request: FulfillmentCourierList,
    context?: any
  ) {
    return super.upsert(request, context);
  }

  @access_controlled_function({
    action: AuthZAction.DELETE,
    operation: Operation.isAllowed,
    context: FulfillmentCourierService.ACSContextFactory,
    resource: DefaultResourceFactory('fulfillment_courier'),
    database: 'arangoDB',
    useCache: true,
  })
  public override delete(
    request: DeleteRequest,
    context: any,
  ) {
    return super.delete(request, context);
  }
}
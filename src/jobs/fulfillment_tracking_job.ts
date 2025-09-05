import {
  Logger
} from '@restorecommerce/logger';
import {
  type DefaultExportFunc
} from '@restorecommerce/scs-jobs';
import {
  ServiceConfig
} from '@restorecommerce/service-config';
import {
  Client,
  createChannel,
  createClient,
  GrpcClientConfig,
} from '@restorecommerce/grpc-client';
import {
  FulfillmentState,
  FulfillmentServiceDefinition,
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/fulfillment.js';
import { Filter_Operation, Filter_ValueType, FilterOp_Operator } from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/resource_base.js';
import { Subject } from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/auth.js';
import { OperationStatus } from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/status.js';

class OperationStatusError extends Error implements OperationStatus {
  constructor(
    status?: OperationStatus,
    public readonly code: number = status?.code,
    message = status.message
  ) {
    super(message);
  }
}

class FulfillmentTracker {
  protected readonly fulfillment_service: Client<FulfillmentServiceDefinition>;
  
  constructor(
    private readonly cfg?: ServiceConfig,
    private readonly logger?: Logger,
    public readonly job_name: string = cfg.get(
      'scs-jobs:fulfillment_tracking_job:name'
    ) ?? 'FULFILLMENT_TRACKING_JOB',
    private readonly tech_user: Subject = cfg.get('authorization:techUser'),
  ) {
    const fulfillment_cfg = this.cfg.get('client:fulfillment');
    this.fulfillment_service = createClient(
      {
        ...fulfillment_cfg,
        logger
      } as GrpcClientConfig,
      FulfillmentServiceDefinition,
      createChannel(fulfillment_cfg.address)
    );
  }

  public async execute(args?: any) {
    const ids = await this.fulfillment_service.read(
      {
        filters: [
          {
            filters: [
              {
                field: 'fulfillment_state',
                value: JSON.stringify([
                  FulfillmentState.SUBMITTED,
                  FulfillmentState.IN_TRANSIT,
                ]),
                type: Filter_ValueType.ARRAY,
                operation: Filter_Operation.in,
              },
            ],
          }
        ],
        subject: this.tech_user,
      }
    ).then(
      resp => {
        if (resp.operation_status?.code !== 200) {
          throw new OperationStatusError(resp.operation_status);
        }
        else {
          return resp.items?.map(item => item.payload?.id);
        }
      }
    );
    this.logger?.verbose('Start tracking for:', ids);
    const response = await this.fulfillment_service.track({
      items: ids.map(id => ({
        id
      })),
      total_count: ids.length,
      subject: this.tech_user,
    }).then(
      resp => ({
        ...resp,
        items: resp.items?.map(
          item => ({
            ...item,
            payload: {
              id: item.payload?.id,
              fulfillment_state: item.payload?.fulfillment_state,
            },
          })
        )
      })
    );
    this.logger?.verbose('Tracking response:', response);
  }
}

const main: DefaultExportFunc = async (
  cfg,
  logger,
  events: any,
  runWorker
) => {
  const tracker = new FulfillmentTracker(cfg, logger);
  const config = cfg.get('scs-jobs:fulfillment_tracking_job');
  await runWorker(
    config?.queue ?? 'default-queue',
    config?.concurrency ?? 1,
    cfg, logger, events,
    async (job: any) => {
      const { id, type, name } = job;
      logger?.info('Processing job:', job);
      try {
        if (type === tracker.job_name || name === tracker.job_name) {
          await tracker.execute(job.data?.payload);
          logger?.info('Job Done');
        }
      } catch (err: any) {
        const { code, message, stack } = err;
        logger?.error(`Error while processing ${tracker.job_name}:`, { code, message, stack});
      }
    }).catch((err) => {
      const { code, message, stack } = err;
      logger?.error(`Error while initializing worker for ${tracker.job_name}:`, { code, message, stack });
    });
};

export default main;
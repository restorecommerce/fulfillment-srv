import * as fs from 'node:fs';
import { parse as CSV } from 'csv-parse/sync';
import { type CallContext } from 'nice-grpc-common';
import {
  AuthZAction,
  access_controlled_function,
  DefaultACSClientContextFactory,
  Operation,
  DefaultResourceFactory,
  injects_meta_data,
  resolves_subject
} from '@restorecommerce/acs-client';
import { type Logger } from '@restorecommerce/logger';
import { type ServiceConfig } from '@restorecommerce/service-config';
import { type DatabaseProvider } from '@restorecommerce/chassis-srv';
import { Topic } from '@restorecommerce/kafka-client';
import {
  Status,
  StatusListResponse,
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/status.js';
import {
  Client,
  createChannel,
  createClient,
  GrpcClientConfig,
} from '@restorecommerce/grpc-client';
import {
  FulfillmentState,
  FulfillmentListResponse,
  Fulfillment,
  FulfillmentList,
  FulfillmentIdList,
  FulfillmentServiceImplementation,
  FulfillmentInvoiceRequestList,
  FulfillmentResponse,
  FulfillmentId,
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/fulfillment.js';
import { Subject } from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/auth.js';
import { AddressServiceDefinition } from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/address.js';
import {
  CountryServiceDefinition,
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/country.js';
import { TaxServiceDefinition } from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/tax.js';
import { InvoiceListResponse } from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/invoice.js';
import {
  ContactPointServiceDefinition
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/contact_point.js';
import {
  CustomerServiceDefinition
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/customer.js';
import {
  ShopServiceDefinition
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/shop.js';
import {
  NotificationReqServiceDefinition,
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/notification_req.js';
import {
  OrganizationServiceDefinition
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/organization.js';
import {
  Setting,
  SettingServiceDefinition
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/setting.js';
import {
  Template,
  TemplateServiceDefinition,
  TemplateUseCase
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/template.js';
import {
  Payload,
  RenderRequest,
  RenderResponse,
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/rendering.js';
import { UserServiceDefinition } from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/user.js';
import { CurrencyServiceDefinition } from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/currency.js';
import { Product, ProductServiceDefinition } from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/product.js';
import { AccessControlledServiceBase, ACSContextFactory } from '../experimental/AccessControlledServiceBase.js';
import { ClientRegister } from '../experimental/ClientRegister.js';
import { ResourceAggregator } from '../experimental/ResourceAggregator.js';
import { ResourceAwaitQueue } from '../experimental/ResourceAwaitQueue.js';
import { ResourceMap } from '../experimental/ResourceMap.js';
import { Stub } from './../stub.js';
import {
  type AggregatedFulfillmentListResponse,
  type SettingMap,
  DefaultUrns,
  FulfillmentAggregationTemplate,
  mergeFulfillments,
  flatMapAggregatedFulfillmentListResponse,
  StateRank,
  throwStatusCode,
  createStatusCode,
  createOperationStatusCode,
  DefaultSetting,
  resolveCustomerAddress as resolveRecipientAddress,
  resolveShopAddress as resolveSenderAddress,
  mergeFulfillmentProductVariant,
  calcAmount,
  parseSetting,
  marshallProtobufAny,
  calcTotalAmount,
  packRenderData,
} from './../utils.js';
import { FulfillmentCourierService } from './fulfillment_courier.js';
import { FulfillmentProductService } from './fulfillment_product.js';


export class FulfillmentService
  extends AccessControlledServiceBase<FulfillmentListResponse, FulfillmentList>
  implements FulfillmentServiceImplementation
{
  protected readonly status_codes = {
    OK: {
      code: 200,
      message: 'OK',
    },
    NOT_FOUND: {
      code: 404,
      message: '{entity} {id} not found!',
    },
    NO_LEGAL_ADDRESS: {
      code: 404,
      message: '{entity} {id} has no legal address!',
    },
    NO_SHIPPING_ADDRESS: {
      code: 404,
      message: '{entity} {id} has no shipping address!',
    },
    NO_BILLING_ADDRESS: {
      code: 404,
      message: '{entity} {id} has no billing address!',
    },
    NO_LABEL: {
      code: 404,
      message: '{entity} {id} has no label!',
    },
    NOT_SUBMITTED: {
      code: 400,
      message: '{entity} {id} is not submitted!',
    },
    SHOP_ID_NOT_IDENTICAL: {
      code: 400,
      message: '{entity} {id} Fulfillment.shopId must be listed in Courier.shopIds!',
    },
    CONFLICT: {
      code: 409,
      message: 'Resource conflict, ID already in use!'
    },
    CONTENT_NOT_SUPPORTED: {
      code: 400,
      message: '{entity} {id}: Content type {error} is not supported!',
    },
    PROTOCOL_NOT_SUPPORTED: {
      code: 400,
      message: '{entity} {id}: Protocol of {error} is not supported!',
    },
    FETCH_FAILED: {
      code: 500,
      message: '{entity} {id}: {error}!',
    },
  };

  protected readonly operation_status_codes = {
    SUCCESS: {
      code: 200,
      message: 'SUCCESS',
    },
    PARTIAL: {
      code: 207,
      message: 'Patrial executed with errors!',
    },
    LIMIT_EXHAUSTED: {
      code: 500,
      message: 'Query limit 1000 exhausted!',
    },
    TIMEOUT: {
      code: 500,
      message: 'Request timeout, API not responding!',
    },
    NO_ITEM: {
      code: 400,
      message: 'No {entity} in query!',
    },
    NO_TEMPLATES: {
      code: 500,
      message: 'No render templates defined!',
    },
    INVALID: {
      code: 400,
      message: 'Invalid {entity} in query!',
    },
  };

  protected readonly tech_user: Subject;
  protected readonly notification_service: Client<NotificationReqServiceDefinition>;
  protected readonly awaits_render_result = new ResourceAwaitQueue<string[]>;
  protected readonly default_setting: DefaultSetting = DefaultSetting;
  protected readonly default_templates: Template[] = [];
  protected readonly kafka_timeout = 5000;
  protected readonly emitters: Record<string, string>;
  protected readonly urns: DefaultUrns = DefaultUrns;
  protected readonly contact_point_type_ids = {
    legal: 'legal',
    shipping: 'shipping',
    billing: 'billing',
  };

  constructor(
    protected readonly fulfillmentCourierSrv: FulfillmentCourierService,
    protected readonly fulfillmentProductSrv: FulfillmentProductService,
    protected readonly fulfillmentTopic: Topic,
    protected readonly renderingTopic: Topic,
    db: DatabaseProvider,
    protected readonly cfg: ServiceConfig,
    logger?: Logger,
    client_register = new ClientRegister(cfg, logger),
    protected readonly aggregator = new ResourceAggregator(cfg, logger, client_register),
  ) {
    super(
      cfg?.get('database:main:entities:0') ?? 'fulfillment',
      fulfillmentTopic,
      db,
      cfg,
      logger,
      cfg?.get('events:enableEvents')?.toString() === 'true',
      cfg?.get('database:main:collections:0') ?? 'fulfillments',
    );
    this.isEventsEnabled = cfg?.get('events:enableEvents')?.toString() === 'true';
    const notification_cfg = cfg?.get('client:notification_req');
    if (notification_cfg.disabled?.toString() === 'true') {
      logger?.info('Notification-srv disabled!');
    }
    else if (notification_cfg) {
      if (!this.renderingTopic) {
        logger.error('Rendering Topic not defined!');
      } 
      this.notification_service = createClient(
        {
          ...notification_cfg,
          logger
        } as GrpcClientConfig,
        NotificationReqServiceDefinition,
        createChannel(notification_cfg.address)
      );
    }
    else {
      logger?.warn('notification config is missing!');
    }

    this.urns = {
      ...this.urns,
      ...cfg?.get('urns'),
      ...cfg?.get('authentication:urns'),
    };
    this.status_codes = {
      ...this.status_codes,
      ...cfg?.get('statusCodes'),
    };

    this.operation_status_codes = {
      ...this.operation_status_codes,
      ...cfg?.get('operationStatusCodes'),
    };

    this.emitters = cfg?.get('events:emitters');
    this.contact_point_type_ids = {
      ...this.contact_point_type_ids,
      ...cfg?.get('contactPointTypeIds')
    };
    this.default_setting = {
      ...DefaultSetting,
      ...cfg?.get('defaults:Setting'),
    };

    this.default_setting.customer_locales.filter(
      locale => locale === 'fr'
    )

    this.tech_user = cfg?.get('tech_user');
  }

  protected async aggregateProductBundles(
    products: ResourceMap<Product>,
    output?: ResourceMap<Product>,
    subject?: Subject,
  ): Promise<ResourceMap<Product>> {
    output ??= products;
    const ids = products?.all.filter(
      p => p.bundle
    ).flatMap(
      p => p.bundle.products.map(
        p => p.product_id
      )
    ).filter(
      id => !output.has(id)
    );

    if (ids?.length) {
      const bundled_products = await this.aggregator.getByIds<Product>(
        ids,
        ProductServiceDefinition
      );

      bundled_products.forEach(
        p => output.set(p.id, p)
      );

      await this.aggregateProductBundles(
        bundled_products,
        output,
        subject,
      );
    }
    return output;
  }

  private resolveSettings(
    ...settings: Setting[]
  ): DefaultSetting {
    const smap = new Map<string, string>(
      settings?.flatMap(
        s => s?.settings?.map(
          s => [s.id, s.value]
        ) ?? []
      ) ?? []
    );
    const sobj = Object.assign(
      {},
      ...Object.entries(this.urns).filter(
        ([key, value]) => smap.has(value)
      ).map(
        ([key, value]) => ({ [key]: parseSetting(key, smap.get(value)) })
      )
    );
    
    return {
      ...this.default_setting,
      ...sobj,
    };
  }

  private async aggregateSettings(
    aggregation: AggregatedFulfillmentListResponse,
  ): Promise<SettingMap> {
    const resolved_settings: SettingMap = new Map(
      aggregation.items.map(
        (item) => {
          const shop = aggregation.shops.get(item.payload.shop_id);
          const customer = aggregation.customers.get(item.payload.customer_id);
          const settings = [
            aggregation.settings.get(shop.setting_id),
            aggregation.settings.get(customer.setting_id)
          ];
          return [item.payload.id, this.resolveSettings(
            ...settings
          )];
        }
      )
    );
    return resolved_settings;
  }

  protected async loadDefaultTemplates(
    subject?: Subject,
    context?: any
  ) {
    if(this.default_templates.length) {
      return this.default_templates;
    }

    this.default_templates.push(...(this.cfg?.get('defaults:Templates') ?? []));
    const ids = this.default_templates.map(t => t.id);
    if (ids.length) {
      await this.aggregator.getByIds(
        ids,
        TemplateServiceDefinition,
        this.tech_user ?? subject,
        context,
      ).then(
        resp_map => {
          this.default_templates.forEach(
            template => Object.assign(
              template,
              resp_map.get(template.id, null) // null for ignore missing
            )
          )
        }
      );
    }

    return this.default_templates;
  }

  protected async aggregate(
    fulfillments: FulfillmentListResponse,
    subject?: Subject,
    context?: CallContext,
  ): Promise<AggregatedFulfillmentListResponse> {
    const aggregation = await this.aggregator.aggregate(
      fulfillments,
      [
        {
          service: ShopServiceDefinition,
          map_by_ids: (fulfillments) => fulfillments.items?.map(
            i => i.payload.shop_id
          ),
          container: 'shops',
          entity: 'Shop',
        },
        {
          service: CustomerServiceDefinition,
          map_by_ids: (fulfillments) => fulfillments.items?.map(
            i => i.payload.customer_id
          ),
          container: 'customers',
          entity: 'Customer',
        },
        {
          service: ProductServiceDefinition,
          map_by_ids: (fulfillments) => fulfillments.items?.flatMap(
            item => item.payload.packaging?.parcels
          )?.flatMap(
            parcel => parcel?.items
          )?.flatMap(
            item => item?.product_id
          ),
          container: 'products',
          entity: 'Product',
        },
      ],
      FulfillmentAggregationTemplate,
      subject,
      context,
    ).then(
      async aggregation => {
        aggregation.fulfillment_products = await this.fulfillmentProductSrv.get(
          aggregation.items?.flatMap(
            item => item.payload.packaging?.parcels
          )?.flatMap(
            item => item?.product_id
          ),
          subject,
          context,
        ).then(
          response => new ResourceMap(
            response.items.map(item => item.payload),
            'FulfillmentProduct'
          )
        );

        aggregation.fulfillment_couriers= await this.fulfillmentCourierSrv.get(
          aggregation.fulfillment_products.all.map(
            item => item.courier_id
          ),
          subject,
          context,
        ).then(
          response => new ResourceMap(
            response.items.map(item => item.payload),
            'FulfillmentCourier'
          )
        );

        await this.aggregateProductBundles(
          aggregation.products,
          aggregation.products,
          subject,
        );
        return aggregation;
      }
    ).then(
      async aggregation => await this.aggregator.aggregate(
        aggregation,
        [
          {
            service: TaxServiceDefinition,
            map_by_ids: (aggregation) => aggregation.fulfillment_products?.all.flatMap(
              product => product.tax_ids
            ),
            container: 'taxes',
            entity: 'Tax',
          },
          {
            service: TemplateServiceDefinition,
            map_by_ids: (aggregation) => aggregation.shops?.all.flatMap(
              shop => shop?.template_ids
            ),
            container: 'templates',
            entity: 'Template',
          },
          {
            service: SettingServiceDefinition,
            map_by_ids: (aggregation) => aggregation.shops?.all.map(
              shop => shop?.setting_id
            ),
            container: 'settings',
            entity: 'Setting',
          },
          {
            service: CurrencyServiceDefinition,
            map_by_ids: (aggregation) => aggregation.fulfillment_products?.all.flatMap(
              product => product.variants?.map(
                t => t.price?.currency_id
              ),
            ),
            container: 'currencies',
            entity: 'Currency'
          }
        ],
        FulfillmentAggregationTemplate,
        subject,
        context,
      )
    ).then(
      async aggregation => await this.aggregator.aggregate(
        aggregation,
        [
          {
            service: UserServiceDefinition,
            map_by_ids: (aggregation) => [].concat(
              aggregation.items?.map(item => item.payload.user_id),
              aggregation.customers?.all.map(customer => customer.private?.user_id)
            ),
            container: 'users',
            entity: 'User',
          },
          {
            service: OrganizationServiceDefinition,
            map_by_ids: (aggregation) => [].concat(
              aggregation.customers?.all.map(
                customer => customer.public_sector?.organization_id
              ),
              aggregation.customers?.all.map(
                customer => customer.commercial?.organization_id
              ),
              aggregation.shops?.all.map(
                shop => shop?.organization_id
              ),
            ),
            container: 'organizations',
            entity: 'Organization',
          },
        ],
        FulfillmentAggregationTemplate,
        this.tech_user ?? subject,
        context,
      )
    ).then(
      async aggregation => await this.aggregator.aggregate(
        aggregation,
        [
          {
            service: ContactPointServiceDefinition,
            map_by_ids: (aggregation) => [
              aggregation.customers.all.flatMap(
                customer => customer.private?.contact_point_ids
              ),
              aggregation.organizations.all.flatMap(
                organization => organization.contact_point_ids
              )
            ].flatMap(ids => ids),
            container: 'contact_points',
            entity: 'ContactPoint',
          },
        ],
        FulfillmentAggregationTemplate,
        this.tech_user ?? subject,
        context,
      )
    ).then(
      async aggregation => await this.aggregator.aggregate(
        aggregation,
        [
          {
            service: AddressServiceDefinition,
            map_by_ids: (aggregation) => [].concat(
              aggregation.contact_points.all.map(
                cp => cp.physical_address_id
              ),
              aggregation.items.map(
                item => item.payload?.packaging?.sender?.address?.id
              ),
              aggregation.items.map(
                item => item.payload?.packaging?.recipient?.address?.id
              ),
            ),
            container: 'addresses',
            entity: 'Address',
          },
        ],
        FulfillmentAggregationTemplate,
        this.tech_user ?? subject,
        context,
      )
    ).then(
      async aggregation => await this.aggregator.aggregate(
        aggregation,
        [
          {
            service: CountryServiceDefinition,
            map_by_ids: (aggregation) => [].concat(
              aggregation.addresses.all.map(
                a => a.country_id
              ),
              aggregation.taxes.all.map(
                tax => tax.country_id
              ),
              aggregation.currencies.all.flatMap(
                currency => currency.country_ids
              ),
            ),
            container: 'countries',
            entity: 'Country',
          },
        ],
        FulfillmentAggregationTemplate,
        this.tech_user ?? subject,
        context,
      )
    );

    return aggregation;
  }

  protected async validateFulfillmentListResponse(
    aggregation: AggregatedFulfillmentListResponse
  ): Promise<AggregatedFulfillmentListResponse> {
    const promises = aggregation.items.map(async (item): Promise<FulfillmentResponse> => {
      try {
        item.payload.packaging.sender ??= resolveSenderAddress(
          item.payload.shop_id,
          aggregation,
          this.contact_point_type_ids.shipping,
        );
        item.payload.packaging.recipient ??= resolveRecipientAddress(
          item.payload.customer_id,
          aggregation,
          this.contact_point_type_ids.shipping,
        );
        item.payload.packaging.notify ??= item.payload.packaging.sender?.contact?.email

        if (!item.payload.packaging.sender?.address) {
          throwStatusCode(
            'Fulfillment',
            item.payload.id,
            this.status_codes.NO_SHIPPING_ADDRESS,
          );
        }

        if (!item.payload.packaging.recipient?.address) {
          throwStatusCode(
            'Fulfillment',
            item.payload.id,
            this.status_codes.NO_SHIPPING_ADDRESS,
          );
        }
        
        await Promise.all(item.payload.packaging?.parcels?.map(
          async p => {
            const customer = aggregation.customers.get(item.payload.customer_id);
            const origin = aggregation.countries.get(item.payload.packaging.sender.address.country_id);
            const destination = aggregation.countries.get(item.payload.packaging.recipient.address.country_id);
            const product = aggregation.fulfillment_products.get(p.product_id);
            const courier = aggregation.fulfillment_couriers.get(product.courier_id);
            const variant = mergeFulfillmentProductVariant(product, p.variant_id);
            if (!variant) {
              throw createStatusCode(
                'FulfillmentProductVariant',
                p.variant_id,
                this.status_codes.NOT_FOUND,
              );
            }
            const currency = aggregation.currencies.get(variant.price?.currency_id);
            const stub = Stub.getInstance(courier);
            const taxes = aggregation.taxes.getMany(product.tax_ids);
            const gross = await stub.calcGross(variant, p.package);
            p.price = variant.price;
            p.amount = calcAmount(
              gross, taxes, origin, destination,
              currency,
              !!customer?.private?.user_id,
            );
          }
        ));

        item.payload.total_amounts = calcTotalAmount(
          item.payload.packaging?.parcels?.map(
            p => p.amount
          ),
          aggregation.currencies,
        );

        item.status = this.status_codes.OK;
        return item;
      }
      catch (e: any) {
        return this.catchStatusError(e, item);
      }
    });

    const items = await Promise.all(promises);
    const operation_status = items.some(
      a => a.status?.code !== 200
    ) ? createOperationStatusCode(
      this.operation_status_codes.PARTIAL,
      'order',
    ) : createOperationStatusCode(
      this.operation_status_codes.SUCCESS,
      'order',
    );

    aggregation.operation_status = operation_status;
    return aggregation;
  }

  protected override superCreate(
    request: FulfillmentList,
    context?: CallContext
  ) {
    request?.items?.forEach(
      item => {
        if (!item.fulfillment_state || item.fulfillment_state === FulfillmentState.UNRECOGNIZED) {
          item.fulfillment_state = FulfillmentState.PENDING;
        }
      }
    );
    return super.superCreate(request, context);
  }

  @resolves_subject()
  @injects_meta_data()
  @access_controlled_function({
    action: AuthZAction.EXECUTE,
    operation: Operation.isAllowed,
    context: DefaultACSClientContextFactory,
    resource: DefaultResourceFactory('execution.evaluateFulfillments'),
    database: 'arangoDB',
    useCache: true,
  })
  public async evaluate(
    request: FulfillmentList,
    context?: CallContext,
  ): Promise<FulfillmentListResponse> {
    if (!request?.items?.length) {
      return {
        operation_status: createOperationStatusCode(
          this.operation_status_codes.NO_ITEM,
          'fulfillment',
        )
      };
    }

    const response: FulfillmentListResponse = {
      ...request,
      items: request.items.map(
        payload => ({ payload })
      ),
    };

    try {
      const aggregation = await this.aggregate(response, request.subject, context).then(
        aggregation => this.validateFulfillmentListResponse(aggregation)
      );
      const flat_fulfillments = flatMapAggregatedFulfillmentListResponse(aggregation);
      const invalid_fulfillments = flat_fulfillments.filter(f => f.status?.code !== 200);
      const evaluated_fulfillments = await Stub.evaluate(flat_fulfillments.filter(f => f.status?.code === 200));
      const items = mergeFulfillments([
        ...evaluated_fulfillments,
        ...invalid_fulfillments,
      ]);

      return {
        items,
        total_count: items.length,
        operation_status: createOperationStatusCode(
          this.operation_status_codes.SUCCESS,
          this.name,
        )
      };
    }
    catch (e: any) {
      return this.catchOperationError<FulfillmentListResponse>(
        e, response,
      );
    }
  }

  @resolves_subject()
  @injects_meta_data()
  @access_controlled_function({
    action: AuthZAction.EXECUTE,
    operation: Operation.isAllowed,
    context: ACSContextFactory,
    resource: DefaultResourceFactory('execution.submitFulfillments'),
    database: 'arangoDB',
    useCache: true,
  })
  public async submit(
    request: FulfillmentList,
    context?: CallContext
  ): Promise<FulfillmentListResponse> {
    if (!request?.items?.length) {
      return {
        operation_status: createOperationStatusCode(
          this.operation_status_codes.NO_ITEM,
          'fulfillment',
        )
      };
    }

    const response: FulfillmentListResponse = {
      ...request,
      items: request.items.map(
        payload => ({ payload })
      ),
    };

    try {
      const response_map = new Map<string, FulfillmentResponse>(
        request.items.map(
          payload => [payload.id, {payload}]
        )
      );
      await this.get(
        request.items.map(item => item.id),
        request.subject,
        context,
      ).then(
        response => {
          if (response.operation_status?.code !== 200) {
            throw response.operation_status;
          }
          else {
            response.items?.forEach(
              item => {
                const entry = response_map.get(item.payload?.id);
                entry.payload = {
                  ...item.payload,
                  ...entry.payload
                };
                entry.status = item.status;
              }
            )
          }
        }
      );
      const aggregation = await this.aggregate(response, request.subject, context).then(
        aggregation => this.validateFulfillmentListResponse(aggregation)
      );
      const settings = await this.aggregateSettings(
        aggregation
      );
      const flat = flatMapAggregatedFulfillmentListResponse(aggregation);
      const valid = flat.filter(
        f => f.status?.code === 200
          && StateRank[f?.fulfillment_state] < StateRank[FulfillmentState.SUBMITTED]
      );
      const skipped = flat.filter(
        f => f.status?.code !== 200
          || StateRank[f?.fulfillment_state] >= StateRank[FulfillmentState.SUBMITTED]
      );
      if (flat.some(f => f.status?.code !== 200)) {
        throw createOperationStatusCode(
          this.operation_status_codes.INVALID,
          'Fulfillment',
        );
      }
      this.logger?.debug('Submitting:', valid);
      const submitted = await Stub.submit(valid);
      const merged = mergeFulfillments([...submitted, ...skipped]);
      const items = merged.map(
        item => item.payload
      );

      const upserted = await super.upsert({
        items,
        total_count: items.length,
        subject: request.subject
      }, context);

      if (this.isEventsEnabled) {
        upserted.items.forEach(item => {
          if (this.emitters && item.payload.fulfillment_state in this.emitters) {
            switch (item.payload.fulfillment_state) {
              case FulfillmentState.INVALID:
              case FulfillmentState.FAILED:
                this.fulfillmentTopic?.emit(this.emitters[item.payload.fulfillment_state], item);
                break;
              default:
                this.fulfillmentTopic?.emit(this.emitters[item.payload.fulfillment_state], item.payload);
                break;
            }
          }
        });
      }

      if (this.notification_service) {
        this.logger?.debug('Send notifications on submit...');
        const default_templates = await this.loadDefaultTemplates().then(
          df => df.filter(
            template => template.use_case?.toString() === 'FULFILLMENT_CONFIRMATION_EMAIL' // TemplateUseCase.FULFILLMENT_CONFIRMATION_EMAIL
          )
        );
        await Promise.all(upserted.items.filter(
          item => item.status?.code === 200
            && settings.get(item.payload.id)?.shop_fulfillment_send_confirm_enabled
        ).map(
          async (item) => {
            const render_id = `fulfillment/confirm/${item.payload.id}`;
            return await this.emitRenderRequest(
              item.payload,
              aggregation,
              render_id,
              'FULFILLMENT_CONFIRMATION_EMAIL', // TemplateUseCase.ORDER_CONFIRMATION,
              default_templates,
              request.subject,
            ).then(
              () => this.awaits_render_result.await(render_id, this.kafka_timeout)
            ).then(
              async (bodies) => {
                const setting = settings.get(item.payload.id);
                const title = bodies.shift();
                const body = bodies.join('');
  
                return this.sendNotification(
                  item.payload,
                  body,
                  setting,
                  title,
                  'SUBMIT_NOTIFIED' as FulfillmentState,
                  context,
                );
              }
            )
          }
        ));
      }
      upserted.total_count = upserted.items.length;
      if (upserted.items.some(item => item.status?.code !== 200)) {
        upserted.operation_status = this.operation_status_codes.PARTIAL;
      }
      return upserted;
    }
    catch (e: any) {
      return this.catchOperationError<FulfillmentListResponse>(
        e, response
      );
    }
  }

  @resolves_subject()
  @access_controlled_function({
    action: AuthZAction.EXECUTE,
    operation: Operation.isAllowed,
    context: ACSContextFactory,
    resource: DefaultResourceFactory('execution.trackFulfillments'),
    database: 'arangoDB',
    useCache: true,
  })
  public async track(
    request: FulfillmentIdList,
    context?: CallContext
  ): Promise<FulfillmentListResponse> {
    try {
      const request_map: { [id: string]: FulfillmentId } = request.items.reduce(
        (a, b) => {
          a[b.id] = b;
          return a;
        },
        {} as { [id: string]: FulfillmentId },
      );

      const response_map: { [id: string]: FulfillmentResponse } = request.items.reduce(
        (a, b) => {
          a[b.id] = {
            payload: null,
            status: createStatusCode(
              this.name,
              b.id,
              this.status_codes.NOT_FOUND,
            )
          };
          return a;
        },
        {} as { [id: string]: FulfillmentResponse },
      );

      await this.get(
        request.items.map(item => item.id),
        request.subject,
        context,
      ).then(
        response => response.items.filter(
          item => {
            response_map[item.payload?.id ?? item.status?.id] = item;
            return item.status?.code === 200;
          }
        )
      ).then(
        items => this.aggregate(
          { items },
          request.subject,
          context,
        ),
      ).then(
        aggregated => flatMapAggregatedFulfillmentListResponse(
          aggregated
        ).filter(
          f => {
            response_map[f.payload?.id ?? f.status?.id] = f;
            if (f.status?.code !== 200) return false;
            const request = request_map[f.payload?.id];
            if (
              request.shipment_numbers && !request.shipment_numbers.includes(f.label.shipment_number)
            ) {
              return false;
            }

            if (!f.label) {
              f.status = createStatusCode(
                this.name,
                f.payload?.id,
                this.status_codes.NO_LABEL
              );
              return false;
            }

            switch (f.label.state) {
              case FulfillmentState.SUBMITTED:
              case FulfillmentState.IN_TRANSIT:
                return true;
              default:
                f.label.status = createStatusCode(
                  this.name,
                  f.payload?.id,
                  this.status_codes.NOT_SUBMITTED
                );
                f.status = f.label.status;
                return false;
            }
          }
        )
      ).then(
        flat_fulfillments => Stub.track(flat_fulfillments)
      ).then(
        tracked_fulfillments => mergeFulfillments(tracked_fulfillments)
      ).then(
        merged_fulfillments => merged_fulfillments.filter(
          item => {
            response_map[item.payload?.id ?? item.status?.id] = item;
            return item.status.code === 200;
          }
        ).map(
          item => item.payload
        )
      ).then(
        items => super.update(
          {
            items,
            total_count: items.length,
            subject: request.subject
          },
          context
        )
      ).then(
        updates => this.isEventsEnabled && updates.items.forEach(
          item => {
            response_map[item.payload?.id ?? item.status?.id] = item;
            if (this.emitters && item.payload.fulfillment_state in this.emitters) {
              switch (item.payload.fulfillment_state) {
                case FulfillmentState.INVALID:
                case FulfillmentState.FAILED:
                  this.fulfillmentTopic?.emit(this.emitters[item.payload.fulfillment_state], item);
                  break;
                default:
                  this.fulfillmentTopic?.emit(this.emitters[item.payload.fulfillment_state], item.payload);
                  break;
              }
            }
          }
        )
      );

      const items = Object.values(response_map);

      return {
        items,
        total_count: items.length,
        operation_status: createOperationStatusCode(
          this.operation_status_codes.SUCCESS,
          this.name,
        ),
      };
    }
    catch (e: any) {
      return this.catchOperationError<FulfillmentListResponse>(e);
    }
  }

  @resolves_subject()
  @access_controlled_function({
    action: AuthZAction.EXECUTE,
    operation: Operation.isAllowed,
    context: DefaultACSClientContextFactory,
    resource: DefaultResourceFactory('execution.withdrawFulfillments'),
    database: 'arangoDB',
    useCache: true,
  })
  public async withdraw(request: FulfillmentIdList, context?: CallContext): Promise<FulfillmentListResponse> {
    return null;
  }

  @resolves_subject()
  @access_controlled_function({
    action: AuthZAction.EXECUTE,
    operation: Operation.isAllowed,
    context: DefaultACSClientContextFactory,
    resource: DefaultResourceFactory('execution.cancelFulfillments'),
    database: 'arangoDB',
    useCache: true,
  })
  public async cancel(request: FulfillmentIdList, context?: CallContext): Promise<FulfillmentListResponse> {
    try {
      const request_map = request.items!.reduce(
        (a, b) => {
          a[b.id] = b.shipment_numbers;
          return a;
        },
        {} as { [key: string]: string[] }
      );

      const fulfillments = await this.get(
        request.items.map(item => item.id),
        request.subject,
        context
      );

      const agg_fulfillments = await this.aggregate(
        fulfillments,
        request.subject,
        context
      );

      const flat_fulfillments = flatMapAggregatedFulfillmentListResponse(
        agg_fulfillments,
      ).map(
        f => {
          const id = f.status?.id;
          if (!f.payload?.labels?.length) {
            f.status = {
              id,
              code: 400,
              message: `Fulfillment ${id} has no labels!`
            };
          }
          else if (f.payload?.fulfillment_state !== FulfillmentState.SUBMITTED && f.payload?.fulfillment_state !== FulfillmentState.IN_TRANSIT) {
            f.status = {
              id,
              code: 400,
              message: `For canceling Fulfillment ${
                id
              } is expected to be ${
                FulfillmentState.SUBMITTED
              } or ${
                FulfillmentState.IN_TRANSIT
              } but is ${
                f.payload?.fulfillment_state
              }!`
            };
          }

          return f;
        }
      );

      const invalid_fulfillments = flat_fulfillments.filter(
        f => f.status?.code !== 200
      );

      const response = await Stub.track(flat_fulfillments.filter(
        f => {
          const shipment_numbers = request_map[f.payload?.id];
          return f.status?.code === 200 &&
            !shipment_numbers?.length ||
            shipment_numbers.find(
              s => s === f.payload?.labels[0]?.shipment_number
            );
        }
      ));

      const items = mergeFulfillments([
        ...response,
        ...invalid_fulfillments,
      ]);

      const update_results = await super.update({
        items: items.filter(
          f => f.status?.code === 200
        ).map(
          f => f.payload
        ),
        total_count: items.length,
        subject: request.subject
      }, context);

      if (this.isEventsEnabled) {
        update_results.items.forEach(item => {
          if (this.emitters && item.payload.fulfillment_state in this.emitters) {
            switch (item.payload.fulfillment_state) {
              case FulfillmentState.INVALID:
              case FulfillmentState.FAILED:
                this.fulfillmentTopic?.emit(this.emitters[item.payload.fulfillment_state], item);
                break;
              default:
                this.fulfillmentTopic?.emit(this.emitters[item.payload.fulfillment_state], item.payload);
                break;
            }
          }
        });
      }

      update_results.items.push(
        ...items.filter(i => i.status?.code !== 200)
      );
      update_results.total_count = update_results.items.length;
      return update_results;
    }
    catch (e: any) {
      return this.catchOperationError<FulfillmentListResponse>(e);
    }
  }

  @resolves_subject()
  @access_controlled_function({
    action: AuthZAction.CREATE,
    operation: Operation.isAllowed,
    context: DefaultACSClientContextFactory,
    resource: [{ resource: 'invoice' }],
    database: 'arangoDB',
    useCache: true,
  })
  async createInvoice(
    request: FulfillmentInvoiceRequestList,
    context: any
  ): Promise<InvoiceListResponse> {
    return null;
  }

  async triggerInvoice(
    request: FulfillmentInvoiceRequestList,
    context: any
  ): Promise<StatusListResponse> {
    return null;
  }

  protected async fetchFile(url: string, subject?: Subject): Promise<string> {
    if (url?.startsWith('file://')) {
      return fs.readFileSync(url.slice(7)).toString();
    }
    else if (url?.startsWith('http')) {
      return fetch(
        url,
        subject?.token ? {
          headers: {
            Authorization: `Bearer ${subject.token}`
          }
        } : undefined
      ).then(resp => resp.text())
    }
    else {
      throw createStatusCode(
        'Template',
        undefined,
        this.status_codes.PROTOCOL_NOT_SUPPORTED,
        url,
      );
    }
  }

  protected async fetchLocalization(
    template: Template,
    locales: string[],
    subject?: Subject,
  ) {
    const locale = locales?.find(
      a => template.localization?.some(
        b => b.local_codes?.includes(a)
      )
    ) ?? 'en';
    const L = template.localization?.find(
      a => a.local_codes?.includes(locale)
    );
    const url = L?.l10n?.url;
    const l10n = url ? await this.fetchFile(url, subject).then(
      text => {
        if (L.l10n.content_type === 'application/json') {
          return JSON.parse(text);
        }
        else if (L.l10n.content_type === 'text/csv') {
          return CSV(text, {
            columns: true,
            skip_empty_lines: true,
            objname: 'key',
            escape: '\\',
            trim: true,
            delimiter: ',',
            ignore_last_delimiters: true,
          });
        }
        else {
          throw createStatusCode(
            'Template',
            template.id,
            this.status_codes.CONTENT_NOT_SUPPORTED,
            L.l10n.content_type,
          );
        }
      }
    ).then(
      l10n => Object.assign(l10n, { _locale: locale })
    ) : undefined;
  
    return l10n;
  }

  protected async emitRenderRequest(
    item: Fulfillment,
    aggregation: AggregatedFulfillmentListResponse,
    render_id: string,
    use_case: TemplateUseCase | string,
    default_templates?: Template[],
    subject?: Subject,
  ) {
    const shop = aggregation.shops.get(item.shop_id);
    const customer = aggregation.customers.get(item.customer_id);
    const setting = this.resolveSettings(
      aggregation.settings.get(
        customer.setting_id
      ),
      aggregation.settings.get(
        shop.setting_id
      ),
    );
    const locales = [
      ...(setting?.customer_locales ?? []),
      ...(setting?.shop_locales ?? []),
    ];
    const templates = shop.template_ids?.map(
      id => aggregation.templates?.get(id)
    ).filter(
      template => template.use_case === use_case
    ).sort(
      (a, b) => (a.ordinal ?? 0) - (b.ordinal ?? 0)
    ) ?? [];

    if (templates.length === 0 && default_templates.length > 0) {
      templates.push(...default_templates);
    }
    else {
      throw createOperationStatusCode(
        this.operation_status_codes.NO_TEMPLATES
      );
    }

    const bodies = await Promise.all(
      templates.map(
        template => template.body?.url ? this.fetchFile(
          template.body.url, subject
        ) : undefined
      )
    );
    const layouts = await Promise.all(
      templates.map(
        template => template.layout?.url ? this.fetchFile(
          template.layout.url, subject
        ) : undefined
      )
    );
    const l10n = await Promise.all(
      templates.map(
        template => this.fetchLocalization(
          template, locales, subject
        )
      )
    );

    const payloads: Payload[] = templates.map(
      (template, i) => ({
        content_type: 'text/html',
        data: packRenderData(aggregation, item),
        templates: marshallProtobufAny({
          [i]: {
            body: bodies[i],
            layout: layouts[i],
          },
        }),
        style_url: template.styles?.find(s => s.url).url,
        options: l10n[i] ? marshallProtobufAny({
          locale: l10n[i]._locale,
          texts: l10n[i]
        }) : undefined
      })
    );

    return this.renderingTopic.emit(
      'renderRequest',
      {
        id: render_id,
        payloads,
      } as RenderRequest
    );
  }

  public async handleRenderResponse(
    response: RenderResponse,
    context?: any,
  ) {
    try {
      const [entity] = response.id.split('/');
      if (entity !== 'fulfillment') return;
      const content = response.responses.map(
        r => JSON.parse(r.value.toString())
      );
      const errors = content.filter(
        c => c.error
      ).map(
        c => c.error
      );

      if (errors?.length) {
        const status: Status = {
          code: 500,
          message: errors.join('\n'),
        };

        this.awaits_render_result.reject(response.id, status);
      }
      else {
        const bodies = content.map(
          (c, i) => c[i]
        ) as string[];
        this.awaits_render_result.resolve(response.id, bodies);
      }
    }
    catch (e: any) {
      this.logger?.error('Error on handleRenderResponse:', e);
    }
  }

  protected async sendNotification(
    fulfillment: Fulfillment,
    body: string,
    setting: DefaultSetting,
    title?: string,
    state?: FulfillmentState, 
    context?: any,
  ) {
    const status = await this.notification_service.send(
      {
        transport: 'email',
        provider: setting.shop_email_provider,
        email: {
          to: [fulfillment.packaging.notify],
          cc: [
            ...(setting.customer_email_cc ?? []),
            ...(setting.shop_email_cc ?? []),
          ],
          bcc: [
            ...(setting.customer_email_bcc ?? []),
            ...(setting.shop_email_bcc ?? []),
          ],
        },
        subject: title ?? fulfillment.id,
        body,
      },
      context
    );

    if (state && status?.operation_status?.code === 200) {
      fulfillment.fulfillment_state = state;
    }

    return fulfillment;
  }
}
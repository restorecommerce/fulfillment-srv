import {
  Response,
  Response_Decision,
  ReverseQuery,
} from '@restorecommerce/rc-grpc-clients/dist/generated/io/restorecommerce/access_control';
import {
  Effect
} from '@restorecommerce/rc-grpc-clients/dist/generated/io/restorecommerce/rule';
import {
  UserResponse,
  UserType
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/user';
import {
  UserListResponse,
} from '@restorecommerce/rc-grpc-clients/dist/generated/io/restorecommerce/user.js';
import { 
  ProductListResponse,
  ProductResponse
} from '@restorecommerce/rc-grpc-clients/dist/generated/io/restorecommerce/product';
import {
  OrganizationListResponse,
  OrganizationResponse
} from '@restorecommerce/rc-grpc-clients/dist/generated/io/restorecommerce/organization';
import {
  ContactPointListResponse,
  ContactPointResponse
} from '@restorecommerce/rc-grpc-clients/dist/generated/io/restorecommerce/contact_point';
import {
  AddressListResponse,
  BillingAddress,
  ShippingAddress
} from '@restorecommerce/rc-grpc-clients/dist/generated/io/restorecommerce/address';
import {
  CountryListResponse,
  CountryResponse
} from '@restorecommerce/rc-grpc-clients/dist/generated/io/restorecommerce/country';
import {
  TaxListResponse,
  TaxResponse
} from '@restorecommerce/rc-grpc-clients/dist/generated/io/restorecommerce/tax';
import {
  ShopListResponse,
  ShopResponse
} from '@restorecommerce/rc-grpc-clients/dist/generated/io/restorecommerce/shop';
import {
  CustomerListResponse,
  CustomerResponse
} from '@restorecommerce/rc-grpc-clients/dist/generated/io/restorecommerce/customer';
import {
  FulfillmentIdList,
  FulfillmentList,
  FulfillmentState
} from '@restorecommerce/rc-grpc-clients/dist/generated/io/restorecommerce/fulfillment';
import {
  OperationStatus
} from '@restorecommerce/rc-grpc-clients/dist/generated/io/restorecommerce/status';
import { 
  InvoiceListResponse,
  PaymentState
} from '@restorecommerce/rc-grpc-clients/dist/generated/io/restorecommerce/invoice';
import {
  CredentialListResponse
} from '@restorecommerce/rc-grpc-clients/dist/generated/io/restorecommerce/credential';
import {
  FulfillmentProductList,
  FulfillmentSolutionQueryList
} from '@restorecommerce/rc-grpc-clients/dist/generated/io/restorecommerce/fulfillment_product';
import {
  FulfillmentCourierList
} from '@restorecommerce/rc-grpc-clients/dist/generated/io/restorecommerce/fulfillment_courier';
import {
  HierarchicalScope
} from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/auth';
import {
  CurrencyListResponse
} from '@restorecommerce/rc-grpc-clients/dist/generated/io/restorecommerce/currency';
import {
  Subject
} from '@restorecommerce/rc-grpc-clients/dist/generated/io/restorecommerce/auth';
import {
  Status
} from '@restorecommerce/rc-grpc-clients/dist/generated/io/restorecommerce/status';
import {
  getRedisInstance,
  logger
} from './utils';

type Address = ShippingAddress & BillingAddress;

const meta = {
  modifiedBy: 'SYSTEM',
  created: new Date(),
  modified: new Date(),
  owners: [
    {
      id: 'urn:restorecommerce:acs:names:ownerIndicatoryEntity',
      value: 'urn:restorecommerce:acs:model:organization.Organization',
      attributes: [
        {
          id: 'urn:restorecommerce:acs:names:ownerInstance',
          value: 'main',
        }
      ]
    },
    {
      id: 'urn:restorecommerce:acs:names:ownerInstance',
      value: 'main',
    }
  ]
};

const subjects: { [key: string]: Subject } = {
  superadmin: {
    id: 'superadmin',
    scope: 'main',
    token: 'superadmin',
  },
  admin: {
    id: 'admin',
    scope: 'sub',
    token: 'admin',
  },
};

const operationStatus: OperationStatus = {
  code: 200,
  message: 'MOCKED',
};

const status: Status = {
  code: 200,
  message: 'MOCKED',
};

const currencies: CurrencyListResponse = {
  items: [{
    payload: {
      id: 'euro',
      countryIds: ['germany'],
      name: 'Euro',
      precision: 2,
      symbol: 'EUR',
      code: 'EUR',
      meta,
    },
    status,
  }],
  operationStatus,
};

const residentialAddresses: Address[] = [{
  address: {
    id: 'address_1',
    residentialAddress: {
      title: 'Mr.',
      givenName: 'Jack',
      familyName: 'Black',
    },
    street: 'Vegesacker Heerstr.',
    buildingNumber: '111',
    postcode: '28757',
    locality: 'Bremen',
    region: 'Bremen',
    countryId: 'germany',
  },
  contact: {
    email: 'user@test.spec',
    name: 'Jack Black',
    phone: '00000000000'
  },
  comments: 'Drop it at the backdoor',
}];

const businessAddresses: Address[] = [{
  address: {
    id: 'address_2',
    businessAddress: {
      name: 'Restorecommerce GmbH',
    },
    street: 'Vegesacker Heerstr.',
    buildingNumber: '111',
    postcode: '28757',
    locality: 'Bremen',
    region: 'Bremen',
    countryId: 'germany',
  },
  contact: {
    email: 'info@restorecommerce.io'
  }
}];

const countries: CountryResponse[] = [{
  payload: {
    id: 'germany',
    countryCode: 'DEU',
    name: 'Deutschland',
    geographicalName: 'Germany',
    economicAreas: [],
  },
  status: {
    id: 'germany',
    code: 200,
    message: 'OK',
  }
}];

const taxes: TaxResponse[] = [
  {
    payload: {
      id: 'tax_1',
      countryId: 'germany',
      rate: 0.19,
      typeId: 'taxType_1',
      variant: 'MwSt.',
    },
    status: {
      id: 'tax_1',
      code: 200,
      message: 'OK'
    }
  }
]

const products: ProductResponse[] = [
  {
    payload: {
      id: 'physicalProduct_1',
      active: true,
      shopIds: ['shop_1'],
      tags: [],
      associations: [],
      product: {
        name: 'Physical Product 1',
        description: 'This is a physical product',
        manufacturerId: 'manufacturer_1',
        taxIds: [
          taxes[0].payload?.id as string,
        ],
        physical: {
          variants: [
            {
              id: '1',
              name: 'Physical Product 1 Blue',
              description: 'This is a physical product in blue',
              price: {
                currencyId: 'euro',
                regularPrice: 9.99,
                salePrice: 8.99,
                sale: false,
              },
              images: [],
              files: [],
              stockKeepingUnit: '123456789',
              stockLevel: 300,
              package: {
                sizeInCm: {
                  width: 10,
                  height: 5,
                  length: 2,
                },
                weightInKg: 1,
                rotatable: false,
              },
              properties: [
                {
                  id: 'urn:product:property:color:main:name',
                  value: 'blue',
                  unitCode: 'text',
                },
                {
                  id: 'urn:product:property:color:main:value',
                  value: '#0000FF',
                  unitCode: '#RGB',
                }
              ],
            },
            {
              id: '2',
              name: 'Physical Product 1 Red',
              description: 'This is a physical product in red',
              images: [],
              files: [],
              properties: [
                {
                  id: 'urn:product:property:color:main:name',
                  value: 'red',
                  unitCode: 'text',
                },
                {
                  id: 'urn:product:property:color:main:value',
                  value: '#FF0000',
                  unitCode: '#RGB',
                }
              ],
              parentVariantId: '1',
            }
          ]
        }
      },
    },
    status: {
      id: 'physicalProduct_1',
      code: 200,
      message: 'OK',
    }
  },
];

const contactPoints = [
  {
    payload: {
      id: 'contactPoint_1',
      contactPointTypeIds: [
        'legal'
      ],
      name: 'Contact Point 1',
      description: 'A mocked Contact Point for testing',
      email: 'info@shop.com',
      localeId: 'localization_1',
      physicalAddressId: businessAddresses[0].address?.id,
      telephone: '0123456789',
      timezoneId: 'timezone_1',
      website: 'www.shop.com',
    },
    status: {
      id: 'contactPoint_1',
      code: 200,
      message: 'OK',
    }
  }
] as ContactPointResponse[];

const organizations = [
  {
    payload: {
      id: 'organization_1',
      contactPointIds: [
        contactPoints[0].payload?.id,
      ],
      paymentMethodIds: [],
    },
    status: {
      id: 'organization_1',
      code: 200,
      message: 'OK',
    },
  }
] as OrganizationResponse[];

const shops: ShopResponse[] = [
  {
    payload: {
      id: 'shop_1',
      name: 'Shop1',
      description: 'a mocked shop for unit tests',
      domains: ['www.shop.com'],
      organizationId: organizations[0].payload?.id,
      shopNumber: '0000000001',
    },
    status: {
      id: 'shop_1',
      code: 200,
      message: 'OK',
    }
  }
];

const customers: CustomerResponse[] = [
  {
    payload: {
      id: 'customer_1',
      private: {
        userId: 'user_1',
        contactPointIds: [
          contactPoints[0].payload?.id as string,
        ]
      }
    },
    status: {
      id: 'customer_1',
      code: 200,
      message: 'OK',
    }
  }
]

const validCouriers: { [key: string]: FulfillmentCourierList } = {
  dhl: {
    items: [
      {
        id: 'dhl_soap',
        name: 'DHL',
        description: '',
        logo: 'DHL.png',
        website: 'https://www.dhl.com/',
        api: 'DHLSoap',
        shopIds: [
          'shop_1'
        ],
        meta,
      },
      {
        id: 'dhl_rest',
        name: 'DHL',
        description: '',
        logo: 'DHL.png',
        website: 'https://www.dhl.com/',
        api: 'DHLRest',
        shopIds: [
          'shop_1'
        ],
        meta,
      }
    ],
    totalCount: 2,
    subject: subjects.superadmin
  }
};

const validFulfillmentProducts: { [key:string]: FulfillmentProductList } = {
  dhl: {
    items: [
      {
        id: 'dhl-1-national',
        name: 'DHL National (Germany)',
        description: 'Versendungen innerhalb Deutschland',
        courierId: 'dhl_rest',
        startZones: ['DEU'],
        destinationZones: ['DEU'],
        taxIds: [taxes[0].payload?.id as string],
        attributes: [{
          id: 'urn:restorecommerce:fulfillment:product:attribute:dhl:productName',
          value: 'V01PAK',
        },{
          id: 'urn:restorecommerce:fulfillment:attribute:dhl:accountNumber',
          value: '33333333330102',
        }],
        variants: [{
          id: 'dhl-1-national-s',
          name: 'Parcel S up to 2kg',
          description: 'For small parcels up to 2kg',
          price: {
            currencyId: 'euro',
            regularPrice: 3.79,
            salePrice: 3.79,
            sale: false,
          },
          maxSize: {
            height: 35,
            width: 25,
            length: 10,
          },
          maxWeight: 2000,
        },{
          id: 'dhl-1-national-m',
          name: 'Parcel M up to 2kg',
          description: 'For medium sized parcels up to 2kg',
          price: {
            currencyId: 'euro',
            regularPrice: 4.49,
            salePrice: 4.49,
            sale: false,
          },
          maxSize: {
            height: 60,
            width: 30,
            length: 15,
          },
          maxWeight: 2000,
        }],
        meta,
      },{
        id: 'dhl-1-europe',
        name: 'DHL Europe',
        description: 'Versendungen innerhalb Europas',
        courierId: 'dhl_rest',
        taxIds: [taxes[0].payload?.id as string],
        startZones: ['DE'],
        destinationZones: ['DE'],
        attributes: [{
          id: 'urn:restorecommerce:fulfillment:product:attribute:dhl:productName',
          value: 'V01PAK',
        },{
          id: 'urn:restorecommerce:fulfillment:attribute:dhl:accountNumber',
          value: '33333333330102',
        }],
        variants: [{
          id: 'dhl-1-europe-s',
          name: 'Parcel S up to 2kg',
          description: 'For small sized parcels up to 2kg',
          price: {
            currencyId: 'euro',
            regularPrice: 3.79,
            salePrice: 3.79,
            sale: false,
          },
          maxSize: {
            height: 35,
            width: 25,
            length: 10,
          },
          maxWeight: 2000,
        },{
          id: 'dhl-1-europe-m',
          name: 'Parcel M up to 2kg',
          description: 'For medium sized parcels up to 2kg',
          price: {
            currencyId: 'euro',
            regularPrice: 4.49,
            salePrice: 4.49,
            sale: false,
          },
          maxSize: {
            height: 60,
            width: 30,
            length: 15,
          },
          maxWeight: 2000,
        }],
        meta,
      },{
        id: 'dhl-2-national',
        name: 'DHL National (Germany)',
        description: 'Versendungen innerhalb Deutschland',
        courierId: 'dhl_rest',
        startZones: ['DE'],
        destinationZones: ['DE'],
        taxIds: [taxes[0].payload?.id as string],
        attributes: [{
          id: 'urn:restorecommerce:fulfillment:product:attribute:dhl:productName',
          value: 'V01PAK',
        },{
          id: 'urn:restorecommerce:fulfillment:attribute:dhl:accountNumber',
          value: '33333333330102',
        }],
        variants: [{
          id: 'dhl-2-national-s',
          name: 'Parcel S up to 2kg',
          description: 'For small parcels up to 2kg',
          price: {
            currencyId: 'euro',
            regularPrice: 4.79,
            salePrice: 4.79,
            sale: false,
          },
          maxSize: {
            height: 35,
            width: 25,
            length: 10,
          },
          maxWeight: 2000,
        },{
          id: 'dhl-2-national-m',
          name: 'Parcel M up to 2kg',
          description: 'For medium sized parcels up to 2kg',
          price: {
            currencyId: 'euro',
            regularPrice: 5.49,
            salePrice: 5.49,
            sale: false,
          },
          maxSize: {
            height: 60,
            width: 30,
            length: 15,
          },
          maxWeight: 2000,
        }],
        meta,
      },{
        id: 'dhl-2-europe',
        name: 'DHL Europe',
        description: 'Versendungen innerhalb Europas',
        courierId: 'dhl_rest',
        startZones: ['DE', 'FR', 'IT', 'ES'],
        destinationZones: ['DE', 'FR', 'IT', 'ES'],
        taxIds: [taxes[0].payload?.id as string],
        attributes: [{
          id: 'urn:restorecommerce:fulfillment:product:attribute:dhl:productName',
          value: 'V01PAK',
        },{
          id: 'urn:restorecommerce:fulfillment:attribute:dhl:accountNumber',
          value: '33333333330102',
        }],
        variants: [{
          id: 'dhl-2-europe-s',
          name: 'Parcel S up to 2kg',
          description: 'For small sized parcels up to 2kg',
          price: {
            currencyId: 'euro',
            regularPrice: 4.79,
            salePrice: 4.79,
            sale: false,
          },
          maxSize: {
            height: 35,
            width: 25,
            length: 10,
          },
          maxWeight: 2000,
        },{
          id: 'dhl-2-europe-m',
          name: 'Parcel M up to 2kg',
          description: 'For medium sized parcels up to 2kg',
          price: {
            currencyId: 'euro',
            regularPrice: 8.49,
            salePrice: 8.49,
            sale: false,
          },
          maxSize: {
            height: 60,
            width: 30,
            length: 15,
          },
          maxWeight: 2000,
        }],
        meta,
      }
    ],
    totalCount: 4,
    subject: subjects.superadmin
  }
}; 

const validFulfillmentSolutionQueries: { [key: string]: FulfillmentSolutionQueryList } = {
  dhl: {
    items: [
      {
        customerId: customers[0].payload?.id,
        shopId: shops[0].payload?.id,
        reference: {
          instanceType: 'urn:restorecommerce:io:order:Order',
          instanceId: 'order_1',
        },
        sender: businessAddresses[0],
        recipient: residentialAddresses[0],
        preferences: {
          courierIds: [],
          fulfillmentProductIds: [],
          options: [],
        },
        items: [
          {
            productId: products[0].payload?.id,
            variantId: products[0].payload?.product?.physical?.variants?.[0].id,
            package: products[0].payload?.product?.physical?.variants?.[0].package,
            quantity: 5,
          }
        ]
      }
    ],
    subject: subjects.superadmin
  }
};

const validFulfillments: { [key: string]: FulfillmentList } = {
  dhl: {
    items: [
      {
        id: 'validFulfillment_1',
        userId: 'user_1',
        customerId: customers[0].payload?.id,
        shopId: shops[0].payload?.id,
        references: [{
          instanceType: 'urn:restorecommerce:io:order:Order',
          instanceId: 'order_1',
        }],
        packaging: {
          sender: businessAddresses[0],
          recipient: residentialAddresses[0],
          parcels: [
            {
              id: '1',
              productId: validFulfillmentProducts.dhl.items?.[0].id,
              variantId: validFulfillmentProducts.dhl.items?.[0].variants?.[0].id,
              items: [
                {
                  productId: products[0].payload?.id,
                  variantId: products[0].payload?.product?.physical?.variants?.[0].id,
                  package: products[0].payload?.product?.physical?.variants?.[0].package,
                  quantity: 5,
                }
              ],
              price: validFulfillmentProducts.dhl.items?.[0].variants?.[0].price,
              amount: undefined,
              package: {
                sizeInCm: {
                  height: 5.0,
                  length: 5.0,
                  width: 5.0,
                },
                weightInKg: 1.0,
              },
            }
          ],
          notify: 'someone@nowhere.com'
        },
        labels: [],
        trackings: [],
        totalAmounts: [],
        fulfillmentState: FulfillmentState.PENDING,
        meta,
      },
      {
        id: 'validFulfillment_2',
        userId: 'user_2',
        customerId: customers[0].payload?.id,
        shopId: shops[0].payload?.id,
        references: [{
          instanceType: 'urn:restorecommerce:io:order:Order',
          instanceId: 'order_1',
        }],
        packaging: {
          sender: businessAddresses[0],
          recipient: residentialAddresses[0],
          parcels: [
            {
              id: '1',
              productId: validFulfillmentProducts.dhl.items?.[0].id,
              variantId: validFulfillmentProducts.dhl.items?.[0].variants?.[0].id,
              items: [
                {
                  productId: products[0].payload?.id,
                  variantId: products[0].payload?.product?.physical?.variants?.[0].id,
                  package: products[0].payload?.product?.physical?.variants?.[0].package,
                  quantity: 5,
                }
              ],
              price: validFulfillmentProducts.dhl.items?.[0].variants?.[0].price,
              amount: undefined,
              package: {
                sizeInCm: {
                  height: 5.0,
                  length: 5.0,
                  width: 5.0,
                },
                weightInKg: 1.0,
              },
            },
            {
              id: '2',
              productId: validFulfillmentProducts.dhl.items?.[0].id,
              variantId: validFulfillmentProducts.dhl.items?.[0].variants?.[0].id,
              items: [
                {
                  productId: products[0].payload?.id,
                  variantId: products[0].payload?.product?.physical?.variants?.[0].id,
                  package: products[0].payload?.product?.physical?.variants?.[0].package,
                  quantity: 5,
                }
              ],
              price: validFulfillmentProducts.dhl.items?.[0].variants?.[0].price,
              amount: undefined,
              package: {
                sizeInCm: {
                  height: 5.0,
                  length: 5.0,
                  width: 5.0,
                },
                weightInKg: 1.0,
              },
            }
          ],
          notify: 'someone@nowhere.com'
        },
        labels: [
          {
            parcelId: '2',
            shipmentNumber: '00340434161094015902',
            state: FulfillmentState.SUBMITTED,
            status: {
              id: 'validFulfillment_2',
              code: 200,
              message: 'OK',
            }
          }
        ],
        fulfillmentState: FulfillmentState.SUBMITTED,
        meta,
      },
    ],
    totalCount: 2,
    subject: subjects.superadmin
  }
};

const validTrackingRequests: { [key: string]: FulfillmentIdList } = {
  dhl: {
    items: [
      {
        id: validFulfillments.dhl.items?.[1].id,
        shipmentNumbers: [
          '00340434161094015902'
        ],
      }
    ],
    totalCount: 1,
    subject: subjects.superadmin
  }
};

export const samples = {
  residentialAddresses,
  businessAddresses,
  couriers: {
    valid: validCouriers,
    invalid: [],
  },
  fulfillmentProducts: {
    valid: validFulfillmentProducts,
    invalid: [],
  },
  FulfillmentSolutionQueries: {
    valid: validFulfillmentSolutionQueries,
    invalid: [],
  },
  fulfillments: {
    valid: validFulfillments,
    invalid: [],
  },
  trackingRequests: {
    valid: validTrackingRequests,
    invalid: [],
  },
};

const users: Record<string, UserResponse> = {
  root_tech_user: {
    payload: {
      id: 'root_tech_user',
      role_associations: [
        {
          id: 'root_tech_user-1-super-administrator-r-id',
          role: 'superadministrator-r-id',
        },
      ],
      active: true,
      user_type: UserType.TECHNICAL_USER,
      tokens: [
        {
          token: '1a4c6789-6435-487a-9308-64d06384acf9',
        }
      ],
    },
    status,
  },
  superadmin: {
    payload: {
      id: 'superadmin',
      name: 'manuel.mustersuperadmin',
      first_name: 'Manuel',
      last_name: 'Mustersuperadmin',
      email: 'manuel.mustersuperadmin@restorecommerce.io',
      password: 'A$1rcadminpw',
      default_scope: 'r-ug',
      role_associations: [
        {
          id: 'superadmin-1-administrator-r-id',
          role: 'superadministrator-r-id',
        },
      ],
      locale_id: 'de-de',
      timezone_id: 'europe-berlin',
      active: true,
      user_type: UserType.ORG_USER,
      tokens: [
        {
          token: 'superadmin',
        }
      ],
      meta,
    },
    status,
  },
  admin: {
    payload: {
      id: 'admin',
      name: 'manuel.musteradmin',
      first_name: 'Manuel',
      last_name: 'Musteradmin',
      email: 'manuel.musteradmin@restorecommerce.io',
      password: 'A$1rcadminpw',
      default_scope: 'sub',
      role_associations: [
        {
          id: 'admin-1-administrator-r-id',
          role: 'administrator-r-id',
          attributes: [
            {
              id: 'urn:restorecommerce:acs:names:roleScopingEntity',
              value: 'urn:restorecommerce:acs:model:organization.Organization',
              attributes: [
                {
                  id: 'urn:restorecommerce:acs:names:roleScopingInstance',
                  value: 'sub',
                }
              ],
            }
          ],
        },
      ],
      locale_id: 'de-de',
      timezone_id: 'europe-berlin',
      active: true,
      user_type: UserType.ORG_USER,
      tokens: [
        {
          token: 'admin',
        }
      ],
      meta,
    },
    status,
  },
  user_1: {
    payload: {
      id: 'user_1'
    },
    status: {
      id: 'user_1',
      code: 200,
      message: 'OK',
    }
  },
  user_2: {
    payload: {
      id: 'user_2'
    },
    status: {
      id: 'user_2',
      code: 200,
      message: 'OK',
    }
  }
};

const hierarchicalScopes: { [key: string]: HierarchicalScope[] } = {
  superadmin: [
    {
      id: 'main',
      role: 'superadministrator-r-id',
      children: [
        {
          id: 'sub',
        }
      ]
    }
  ],
  admin: [
    {
      id: 'sub',
      role: 'administrator-r-id',
    }
  ]
};

const whatIsAllowed: ReverseQuery = {
  policySets: [
    {
      id: 'policy_set',
      combiningAlgorithm: 'urn:oasis:names:tc:xacml:3.0:rule-combining-algorithm:permit-overrides',
      effect: Effect.DENY,
      policies: [
        {
          id: 'policy_superadmin_permit_all',
          combiningAlgorithm: 'urn:oasis:names:tc:xacml:3.0:rule-combining-algorithm:permit-overrides',
          effect: Effect.DENY,
          target: {
            subjects: [
              {
                id: 'urn:restorecommerce:acs:names:role',
                value: 'superadministrator-r-id',
              },
            ],
          },
          rules: [{
            effect: Effect.PERMIT,
            target: {
              subjects: [
                {
                  id: 'urn:restorecommerce:acs:names:role',
                  value: 'superadministrator-r-id',
                },
              ],
            },
          }],
          hasRules: true,
        },{
          id: 'policy_admin_permit_all_by_scope',
          combiningAlgorithm: 'urn:oasis:names:tc:xacml:3.0:rule-combining-algorithm:permit-overrides',
          effect: Effect.DENY,
          target: {
            subjects: [
              {
                id: 'urn:restorecommerce:acs:names:role',
                value: 'administrator-r-id',
              },
            ],
          },
          rules: [{
            id: 'admin_can_do_all_by_scope',
            effect: Effect.PERMIT,
            target: {
              subjects: [
                {
                  id: 'urn:restorecommerce:acs:names:role',
                  value: 'administrator-r-id',
                },
                {
                  id: 'urn:restorecommerce:acs:names:roleScopingEntity',
                  value: 'urn:restorecommerce:acs:model:organization.Organization',
                },
              ],
            },
          }],
          hasRules: true
        },
      ]
    },
  ],
  operationStatus,
};

export const rules = {
  'acs-srv': {
    isAllowed: (
      call: any,
      callback: (error: any, response: Response) => void,
    ) => callback(null, {
      decision: Response_Decision.PERMIT,
    }),
    whatIsAllowed: (
      call: any,
      callback: (error: any, response: ReverseQuery) => void,
    ) => callback(null, whatIsAllowed),
  },
  user: {
    read: (
      call: any,
      callback: (error: any, response: UserListResponse) => void,
    ) => callback(null, {
      items: Object.values(users),
      totalCount: Object.values(users).length,
      operationStatus,
    }),
    findByToken: (
      call: any,
      callback: (error: any, response: UserResponse) => void,
    ) => {
      getRedisInstance().then(
        async client => {
          const subject = users[call.request.token];
          await client.set(
            `cache:${ subject.payload?.id }:subject`,
            JSON.stringify(subject.payload),
          );
          await client.set(
            `cache:${ subject.payload?.id }:hrScopes`,
            JSON.stringify(hierarchicalScopes[call.request.token]),
          );
          return subject;
        },
      ).then(
        subject => callback(null, subject),
        error => logger.error(error),
      );
    }
  },
  shop: {
    read: (
      call: any,
      callback: (error: any, response: ShopListResponse) => void,
    ) => callback(null, {
      items: shops,
      totalCount: shops.length,
      operationStatus
    }),
  },
  organization: {
    read: (
      call: any,
      callback: (error: any, response: OrganizationListResponse) => void,
    ) => callback(null, {
      items: organizations,
      totalCount: organizations.length,
      operationStatus,
    })
  },
  customer: {
    read: (
      call: any,
      callback: (error: any, response: CustomerListResponse) => void,
    ) => callback(null, {
      items: customers,
      totalCount: 1,
      operationStatus
    }),
  },
  contact_point: {
    read: (
      call: any,
      callback: (error: any, response: ContactPointListResponse) => void,
    ) => callback(null, {
      items: contactPoints,
      totalCount: contactPoints.length,
      operationStatus,
    })
  },
  address: {
    read: (
      call: any,
      callback: (error: any, response: AddressListResponse) => void,
    ) => callback(null, {
      items: [
        ...residentialAddresses,
        ...businessAddresses,
      ].map(item => ({
        payload: item.address,
        status: {
          id: item.address?.id,
          code: 200,
          message: 'OK',
        }
      })),
      totalCount: residentialAddresses.length + businessAddresses.length,
      operationStatus,
    })
  },
  country: {
    read: (
      call: any,
      callback: (error: any, response: CountryListResponse) => void,
    ) => callback(null, {
      items: countries,
      totalCount: countries.length,
      operationStatus,
    }),
  },
  product: {
    read: (
      call: any,
      callback: (error: any, response: ProductListResponse) => void,
    ) => callback(null, {
      items: products,
      totalCount: products.length,
      operationStatus,
    }),
  },
  tax: {
    read: (
      call: any,
      callback: (error: any, response: TaxListResponse) => void,
    )=> callback(null, {
      items: taxes,
      totalCount: 1,
      operationStatus
    }),
  },
  invoice: {
    create: (
      call: any,
      callback: (error: any, response: InvoiceListResponse) => void,
    ) => callback(null, {
      items: [{
        payload: {
          id: 'invoice_1',
          documents: [],
          paymentHints: [],
          references: [
            {
              instanceType: 'urn:restorecommerce:io:Order',
              instanceId: 'order_1',
            },
          ],
          sections: [],
          totalAmounts: [],
          customerId: customers[0].payload?.id,
          shopId: 'shop_1',
          userId: 'user_1',
          invoiceNumber: '00000001',
          paymentState: PaymentState.UNPAYED,
        },
        status: {
          id: 'invoice_1',
          code: 200,
          message: 'OK',
        }
      }],
      totalCount: 1,
      operationStatus,
    })
  },
  credential: {
    read: (
      call: any,
      callback: (error: any, response: CredentialListResponse) => void,
    )=> callback(null, {
      items: [],
      totalCount: 0,
      operationStatus
    }),
  },
  currency: {
    read: (
      call: any,
      callback: (error: any, response: CurrencyListResponse) => void,
    )=> callback(null, currencies),
  },
};
import { 
  ProductListResponse, ProductResponse
} from '@restorecommerce/rc-grpc-clients/dist/generated/io/restorecommerce/product';
import {
  OrganizationListResponse, OrganizationResponse
} from '@restorecommerce/rc-grpc-clients/dist/generated/io/restorecommerce/organization';
import {
  ContactPointListResponse, ContactPointResponse
} from '@restorecommerce/rc-grpc-clients/dist/generated/io/restorecommerce/contact_point';
import {
  AddressListResponse, BillingAddress, ShippingAddress
} from '@restorecommerce/rc-grpc-clients/dist/generated/io/restorecommerce/address';
import {
  CountryListResponse,
  CountryResponse
} from '@restorecommerce/rc-grpc-clients/dist/generated/io/restorecommerce/country';
import {
  TaxListResponse, TaxResponse
} from '@restorecommerce/rc-grpc-clients/dist/generated/io/restorecommerce/tax';
import {
  ShopListResponse, ShopResponse
} from '@restorecommerce/rc-grpc-clients/dist/generated/io/restorecommerce/shop';
import {
  CustomerListResponse, CustomerResponse
} from '@restorecommerce/rc-grpc-clients/dist/generated/io/restorecommerce/customer';
import {
  FulfillmentIdList,
  FulfillmentList,
  State as FulfillmentState
} from '@restorecommerce/rc-grpc-clients/dist/generated/io/restorecommerce/fulfillment';
import { OperationStatus } from '@restorecommerce/rc-grpc-clients/dist/generated/io/restorecommerce/status';
import { InvoiceListResponse, PaymentState } from '@restorecommerce/rc-grpc-clients/dist/generated/io/restorecommerce/invoice';
import { DeepPartial } from '@restorecommerce/rc-grpc-clients/dist/generated/io/restorecommerce/resource_base';
import { FulfillmentProductList, PackingSolutionQueryList } from '@restorecommerce/rc-grpc-clients/dist/generated/io/restorecommerce/fulfillment_product';
import { FulfillmentCourierList } from '@restorecommerce/rc-grpc-clients/dist/generated/io/restorecommerce/fulfillment_courier';
import { State } from '@restorecommerce/rc-grpc-clients/dist/generated-server/io/restorecommerce/fulfillment';

type Address = ShippingAddress & BillingAddress;

const operationStatus: OperationStatus = {
  code: 200,
  message: 'OK',
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
    countryCode: 'DE',
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
      shopId: 'shop_1',
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
                currencyId: 'currency_1',
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
        'legal_address'
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
      domain: 'www.shop.com',
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
  dhl_1: {
    items: [
      {
        id: 'dhl_1',
        name: 'DHL',
        description: '',
        logo: 'DHL.png',
        website: 'https://www.dhl.com/',
        stubType: 'DHLSoapStub',
        shopIds: [
          'shop_1'
        ],
        meta: {
          created: new Date(),
          modified: new Date(),
          modifiedBy: 'SYSTEM',
          acls: [],
          owners: [
            {
              id: 'urn:restorecommerce:acs:names:ownerIndicatoryEntity',
              value: 'urn:restorecommerce:acs:model:user.User',
              attributes: []
            },
            {
              id: 'urn:restorecommerce:acs:names:ownerInstance',
              value: 'UserID',
              attributes: []
            }
          ]
        }
      },
      {
        id: 'dhl_2',
        name: 'DHL',
        description: '',
        logo: 'DHL.png',
        website: 'https://www.dhl.com/',
        stubType: 'DHLSoapStub',
        shopIds: [
          'shop_1'
        ],
        meta: {
          created: new Date(),
          modified: new Date(),
          modifiedBy: 'SYSTEM',
          acls: [],
          owners: [
            {
              id: 'urn:restorecommerce:acs:names:ownerIndicatoryEntity',
              value: 'urn:restorecommerce:acs:model:user.User',
              attributes: []
            },
            {
              id: 'urn:restorecommerce:acs:names:ownerInstance',
              value: 'UserID',
              attributes: []
            }
          ]
        }
      }
    ],
    totalCount: 2,
    subject: {
      unauthenticated: true
    }
  }
};

const validFulfillmentProducts: { [key:string]: FulfillmentProductList } = {
  dhl_1: {
    items: [
      {
        id: 'dhl-1-national',
        name: 'DHL National (Germany)',
        description: 'Versendungen innerhalb Deutschland',
        courierId: validCouriers.dhl_1.items[0].id,
        startZones: ['DE'],
        destinationZones: ['DE'],
        taxIds: [taxes[0].payload?.id as string],
        attributes: [{
          id: 'urn:restorecommerce:fulfillment:product:attribute:dhl:productName',
          value: 'V01PAK',
          attributes: [],
        },{
          id: 'urn:restorecommerce:fulfillment:product:attribute:dhl:accountNumber',
          value: '22222222220104',
          attributes: [],
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
        meta: {
          created: new Date(),
          modified: new Date(),
          modifiedBy: 'SYSTEM',
          acls: [],
          owners: [{
            id: 'urn:restorecommerce:acs:names:ownerIndicatoryEntity',
            value: 'urn:restorecommerce:acs:model:user.User',
            attributes: [],
          },
          {
            id: 'urn:restorecommerce:acs:names:ownerInstance',
            value: 'UserID',
            attributes: [],
          }]
        }
      },{
        id: 'dhl-1-europe',
        name: 'DHL Europe',
        description: 'Versendungen innerhalb Europas',
        courierId: validCouriers.dhl_1.items[0].id,
        taxIds: [taxes[0].payload?.id as string],
        startZones: ['DE'],
        destinationZones: ['DE'],
        attributes: [{
          id: 'urn:restorecommerce:fulfillment:product:attribute:dhl:productName',
          value: 'V01PAK',
          attributes: [],
        },{
          id: 'urn:restorecommerce:fulfillment:product:attribute:dhl:accountNumber',
          value: '22222222220104',
          attributes: [],
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
        meta: {
          created: new Date(),
          modified: new Date(),
          modifiedBy: 'SYSTEM',
          acls: [],
          owners: [{
            id: 'urn:restorecommerce:acs:names:ownerIndicatoryEntity',
            value: 'urn:restorecommerce:acs:model:user.User',
            attributes: [],
          },
          {
            id: 'urn:restorecommerce:acs:names:ownerInstance',
            value: 'UserID',
            attributes: [],
          }]
        }
      },{
        id: 'dhl-2-national',
        name: 'DHL National (Germany)',
        description: 'Versendungen innerhalb Deutschland',
        courierId: validCouriers.dhl_1.items[1].id,
        startZones: ['DE'],
        destinationZones: ['DE'],
        taxIds: [taxes[0].payload?.id as string],
        attributes: [{
          id: 'urn:restorecommerce:fulfillment:product:attribute:dhl:productName',
          value: 'V01PAK',
          attributes: [],
        },{
          id: 'urn:restorecommerce:fulfillment:product:attribute:dhl:accountNumber',
          value: '22222222220104',
          attributes: [],
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
        meta: {
          created: new Date(),
          modified: new Date(),
          modifiedBy: 'SYSTEM',
          acls: [],
          owners: [{
            id: 'urn:restorecommerce:acs:names:ownerIndicatoryEntity',
            value: 'urn:restorecommerce:acs:model:user.User',
            attributes: [],
          },
          {
            id: 'urn:restorecommerce:acs:names:ownerInstance',
            value: 'UserID',
            attributes: [],
          }]
        }
      },{
        id: 'dhl-2-europe',
        name: 'DHL Europe',
        description: 'Versendungen innerhalb Europas',
        courierId: validCouriers.dhl_1.items[1].id,
        startZones: ['DE', 'FR', 'IT', 'ES'],
        destinationZones: ['DE', 'FR', 'IT', 'ES'],
        taxIds: [taxes[0].payload?.id as string],
        attributes: [{
          id: 'urn:restorecommerce:fulfillment:product:attribute:dhl:productName',
          value: 'V01PAK',
          attributes: [],
        },{
          id: 'urn:restorecommerce:fulfillment:product:attribute:dhl:accountNumber',
          value: '22222222220104',
          attributes: [],
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
        meta: {
          created: new Date(),
          modified: new Date(),
          modifiedBy: 'SYSTEM',
          acls: [],
          owners: [{
            id: 'urn:restorecommerce:acs:names:ownerIndicatoryEntity',
            value: 'urn:restorecommerce:acs:model:user.User',
            attributes: [],
          },
          {
            id: 'urn:restorecommerce:acs:names:ownerInstance',
            value: 'UserID',
            attributes: [],
          }]
        }
      }
    ],
    totalCount: 4,
    subject: {
      unauthenticated: true
    }
  }
}; 

const validPackingSolutionQueries: { [key: string]: PackingSolutionQueryList } = {
  dhl_1: {
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
          couriers: [],
          options: [],
        },
        items: [
          {
            productId: products[0].payload?.id,
            variantId: products[0].payload?.product?.physical?.variants[0].id,
            package: products[0].payload?.product?.physical?.variants[0].package,
            quantity: 5,
          }
        ]
      }
    ],
    subject: {
      unauthenticated: true
    }
  }
};

const validFulfillments: { [key: string]: FulfillmentList } = {
  dhl_1: {
    items: [
      {
        id: 'validFulfillment_1',
        userId: 'user_1',
        customerId: customers[0].payload?.id,
        shopId: shops[0].payload?.id,
        reference: {
          instanceType: 'urn:restorecommerce:io:order:Order',
          instanceId: 'order_1',
        },
        packaging: {
          sender: businessAddresses[0],
          recipient: residentialAddresses[0],
          parcels: [
            {
              id: '1',
              productId: validFulfillmentProducts.dhl_1.items[0].id,
              variantId: validFulfillmentProducts.dhl_1.items[0].variants[0].id,
              items: [
                {
                  productId: products[0].payload?.id,
                  variantId: products[0].payload?.product?.physical?.variants[0].id,
                  package: products[0].payload?.product?.physical?.variants[0].package,
                  quantity: 5,
                }
              ],
              price: validFulfillmentProducts.dhl_1.items[0].variants[0].price,
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
          exportDescription: '',
          exportType: '',
          invoiceNumber: '',
          notify: 'someone@nowhere.com'
        },
        labels: [],
        trackings: [],
        totalAmounts: [],
        state: FulfillmentState.CREATED,
        meta: {
          created: new Date(),
          modified: new Date(),
          modifiedBy: 'SYSTEM',
          acls: [],
          owners: [
            {
              id: 'urn:restorecommerce:acs:names:ownerIndicatoryEntity',
              value: 'urn:restorecommerce:acs:model:user.User',
              attributes: []
            },
            {
              id: 'urn:restorecommerce:acs:names:ownerInstance',
              value: 'UserID',
              attributes: []
            }
          ]
        }
      },
      {
        id: 'validFulfillment_2',
        userId: 'user_2',
        customerId: customers[0].payload?.id,
        shopId: shops[0].payload?.id,
        reference: {
          instanceType: 'urn:restorecommerce:io:order:Order',
          instanceId: 'order_1',
        },
        packaging: {
          sender: businessAddresses[0],
          recipient: residentialAddresses[0],
          parcels: [
            {
              id: '1',
              productId: validFulfillmentProducts.dhl_1.items[0].id,
              variantId: validFulfillmentProducts.dhl_1.items[0].variants[0].id,
              items: [
                {
                  productId: products[0].payload?.id,
                  variantId: products[0].payload?.product?.physical?.variants[0].id,
                  package: products[0].payload?.product?.physical?.variants[0].package,
                  quantity: 5,
                }
              ],
              price: validFulfillmentProducts.dhl_1.items[0].variants[0].price,
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
              productId: validFulfillmentProducts.dhl_1.items[0].id,
              variantId: validFulfillmentProducts.dhl_1.items[0].variants[0].id,
              items: [
                {
                  productId: products[0].payload?.id,
                  variantId: products[0].payload?.product?.physical?.variants[0].id,
                  package: products[0].payload?.product?.physical?.variants[0].package,
                  quantity: 5,
                }
              ],
              price: validFulfillmentProducts.dhl_1.items[0].variants[0].price,
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
          exportDescription: '',
          exportType: '',
          invoiceNumber: '',
          notify: 'someone@nowhere.com'
        },
        labels: [
          {
            parcelId: '1',
            shipmentNumber: '00340434161094015902',
            state: State.SUBMITTED,
            status: {
              id: 'validFulfillment_2',
              code: 200,
              message: 'OK',
            }
          }
        ],
        trackings: [],
        totalAmounts: [],
        state: FulfillmentState.CREATED,
        meta: {
          created: new Date(),
          modified: new Date(),
          modifiedBy: 'SYSTEM',
          acls: [],
          owners: [
            {
              id: 'urn:restorecommerce:acs:names:ownerIndicatoryEntity',
              value: 'urn:restorecommerce:acs:model:user.User',
              attributes: []
            },
            {
              id: 'urn:restorecommerce:acs:names:ownerInstance',
              value: 'UserID',
              attributes: []
            }
          ]
        }
      },
    ],
    totalCount: 2,
    subject: {
      unauthenticated: true
    }
  }
};

const validTrackingRequests: { [key: string]: FulfillmentIdList } = {
  dhl_1: {
    items: [
      {
        id: validFulfillments.dhl_1.items[1].id,
        shipmentNumbers: [
          '00340434161094015902'
        ],
        subject: {},
      }
    ],
    totalCount: 1,
    subject: {
      unauthenticated: true
    }
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
  packingSolutionQueries: {
    valid: validPackingSolutionQueries,
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

export const rules = {
  shop: {
    read: (
      call: any,
      callback: (error: any, response: DeepPartial<ShopListResponse>) => void,
    ) => callback(null, {
      items: shops,
      totalCount: shops.length,
      operationStatus
    }),
  },
  organization: {
    read: (
      call: any,
      callback: (error: any, response: DeepPartial<OrganizationListResponse>) => void,
    ) => callback(null, {
      items: organizations,
      totalCount: organizations.length,
      operationStatus,
    })
  },
  customer: {
    read: (
      call: any,
      callback: (error: any, response: DeepPartial<CustomerListResponse>) => void,
    ) => callback(null, {
      items: customers,
      totalCount: 1,
      operationStatus
    }),
  },
  contact_point: {
    read: (
      call: any,
      callback: (error: any, response: DeepPartial<ContactPointListResponse>) => void,
    ) => callback(null, {
      items: contactPoints,
      totalCount: contactPoints.length,
      operationStatus,
    })
  },
  address: {
    read: (
      call: any,
      callback: (error: any, response: DeepPartial<AddressListResponse>) => void,
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
      callback: (error: any, response: DeepPartial<CountryListResponse>) => void,
    ) => callback(null, {
      items: countries,
      totalCount: countries.length,
      operationStatus,
    }),
  },
  product: {
    read: (
      call: any,
      callback: (error: any, response: DeepPartial<ProductListResponse>) => void,
    ) => callback(null, {
      items: products,
      totalCount: products.length,
      operationStatus,
    }),
  },
  tax: {
    read: (
      call: any,
      callback: (error: any, response: DeepPartial<TaxListResponse>) => void,
    )=> callback(null, {
      items: taxes,
      totalCount: 1,
      operationStatus
    }),
  },
  invoice: {
    create: (
      call: any,
      callback: (error: any, response: DeepPartial<InvoiceListResponse>) => void,
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
};
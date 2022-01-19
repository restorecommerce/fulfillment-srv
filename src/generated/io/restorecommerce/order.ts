/* eslint-disable */
import { FileDescriptorProto } from "ts-proto-descriptors/google/protobuf/descriptor";
import {
  Subject,
  protoMetadata as protoMetadata3,
} from "./auth";
import {
  OperationStatus,
  Status,
  protoMetadata as protoMetadata4,
} from "./status";
import {
  Meta,
  protoMetadata as protoMetadata2,
} from "./meta";
import {
  protoMetadata as protoMetadata1,
  DeleteResponse,
  ReadRequest,
  DeleteRequest,
} from "./resource_base";
import { Writer, Reader } from "protobufjs/minimal";

export const protobufPackage = "io.restorecommerce.order";

export interface OrderList {
  items: Order[];
  total_count: number;
  subject?: Subject;
}

export interface OrderListResponse {
  items: OrderResponse[];
  total_count: number;
  operation_status?: OperationStatus;
}

export interface OrderResponse {
  payload?: Order;
  status?: Status;
}

export interface Order {
  id: string;
  meta?: Meta;
  name: string;
  description: string;
  status: string;
  items: Items[];
  /** sum of all the quantity_price will be total_price */
  total_price: number;
  /** shipping address */
  shipping_contact_point_id: string;
  billing_contact_point_id: string;
  total_weight_in_kg: number;
}

export interface Items {
  quantity_price: number;
  item?: Item;
}

export interface Item {
  /** below identifier is id of product, variant or bundle */
  product_variant_bundle_id: string;
  product_name: string;
  product_description: string;
  manufacturer_name: string;
  manufacturer_description: string;
  prototype_name: string;
  prototype_description: string;
  quantity: number;
  vat: number;
  price: number;
  item_type: string;
  taric_code: number;
  stock_keeping_unit: string;
  weight_in_kg: number;
  length_in_cm: number;
  width_in_cm: number;
  height_in_cm: number;
}

export interface Deleted {
  id: string;
}

export interface OrderDataList {
  order_data: OrderData[];
  meta?: Meta;
}

export interface OrderData {
  order_id: string;
  shipments: Shipments[];
}

export interface Shipments {
  total_weight_in_kg: number;
  /** below properties are used for international packaging */
  individual_weight_in_kg: number;
  /** number of items */
  amount: number;
  export_type: string;
  export_description: string;
  customs_tariff_number: string;
  invoice_number: string;
  customs_value: number;
}

export interface FulfillmentResults {
  fulfillmentResults: ResponseDetailsList[];
}

export interface ResponseDetailsList {
  Status?: OrderStatus;
  error?: ErrorList;
}

export interface OrderStatus {
  OrderId: string;
  OrderStatus: string;
}

export interface ErrorList {
  code: string[];
  message: string[];
}

const baseOrderList: object = { total_count: 0 };

export const OrderList = {
  encode(message: OrderList, writer: Writer = Writer.create()): Writer {
    for (const v of message.items) {
      Order.encode(v!, writer.uint32(10).fork()).ldelim();
    }
    if (message.total_count !== 0) {
      writer.uint32(16).uint32(message.total_count);
    }
    if (message.subject !== undefined) {
      Subject.encode(message.subject, writer.uint32(26).fork()).ldelim();
    }
    return writer;
  },

  decode(input: Reader | Uint8Array, length?: number): OrderList {
    const reader = input instanceof Uint8Array ? new Reader(input) : input;
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = globalThis.Object.create(baseOrderList) as OrderList;
    message.items = [];
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.items.push(Order.decode(reader, reader.uint32()));
          break;
        case 2:
          message.total_count = reader.uint32();
          break;
        case 3:
          message.subject = Subject.decode(reader, reader.uint32());
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): OrderList {
    const message = globalThis.Object.create(baseOrderList) as OrderList;
    message.items = [];
    if (object.items !== undefined && object.items !== null) {
      for (const e of object.items) {
        message.items.push(Order.fromJSON(e));
      }
    }
    if (object.total_count !== undefined && object.total_count !== null) {
      message.total_count = Number(object.total_count);
    } else {
      message.total_count = 0;
    }
    if (object.subject !== undefined && object.subject !== null) {
      message.subject = Subject.fromJSON(object.subject);
    } else {
      message.subject = undefined;
    }
    return message;
  },

  fromPartial(object: DeepPartial<OrderList>): OrderList {
    const message = { ...baseOrderList } as OrderList;
    message.items = [];
    if (object.items !== undefined && object.items !== null) {
      for (const e of object.items) {
        message.items.push(Order.fromPartial(e));
      }
    }
    if (object.total_count !== undefined && object.total_count !== null) {
      message.total_count = object.total_count;
    } else {
      message.total_count = 0;
    }
    if (object.subject !== undefined && object.subject !== null) {
      message.subject = Subject.fromPartial(object.subject);
    } else {
      message.subject = undefined;
    }
    return message;
  },

  toJSON(message: OrderList): unknown {
    const obj: any = {};
    if (message.items) {
      obj.items = message.items.map((e) => (e ? Order.toJSON(e) : undefined));
    } else {
      obj.items = [];
    }
    message.total_count !== undefined &&
      (obj.total_count = message.total_count);
    message.subject !== undefined &&
      (obj.subject = message.subject
        ? Subject.toJSON(message.subject)
        : undefined);
    return obj;
  },
};

const baseOrderListResponse: object = { total_count: 0 };

export const OrderListResponse = {
  encode(message: OrderListResponse, writer: Writer = Writer.create()): Writer {
    for (const v of message.items) {
      OrderResponse.encode(v!, writer.uint32(10).fork()).ldelim();
    }
    if (message.total_count !== 0) {
      writer.uint32(16).uint32(message.total_count);
    }
    if (message.operation_status !== undefined) {
      OperationStatus.encode(
        message.operation_status,
        writer.uint32(26).fork()
      ).ldelim();
    }
    return writer;
  },

  decode(input: Reader | Uint8Array, length?: number): OrderListResponse {
    const reader = input instanceof Uint8Array ? new Reader(input) : input;
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = globalThis.Object.create(
      baseOrderListResponse
    ) as OrderListResponse;
    message.items = [];
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.items.push(OrderResponse.decode(reader, reader.uint32()));
          break;
        case 2:
          message.total_count = reader.uint32();
          break;
        case 3:
          message.operation_status = OperationStatus.decode(
            reader,
            reader.uint32()
          );
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): OrderListResponse {
    const message = globalThis.Object.create(
      baseOrderListResponse
    ) as OrderListResponse;
    message.items = [];
    if (object.items !== undefined && object.items !== null) {
      for (const e of object.items) {
        message.items.push(OrderResponse.fromJSON(e));
      }
    }
    if (object.total_count !== undefined && object.total_count !== null) {
      message.total_count = Number(object.total_count);
    } else {
      message.total_count = 0;
    }
    if (
      object.operation_status !== undefined &&
      object.operation_status !== null
    ) {
      message.operation_status = OperationStatus.fromJSON(
        object.operation_status
      );
    } else {
      message.operation_status = undefined;
    }
    return message;
  },

  fromPartial(object: DeepPartial<OrderListResponse>): OrderListResponse {
    const message = { ...baseOrderListResponse } as OrderListResponse;
    message.items = [];
    if (object.items !== undefined && object.items !== null) {
      for (const e of object.items) {
        message.items.push(OrderResponse.fromPartial(e));
      }
    }
    if (object.total_count !== undefined && object.total_count !== null) {
      message.total_count = object.total_count;
    } else {
      message.total_count = 0;
    }
    if (
      object.operation_status !== undefined &&
      object.operation_status !== null
    ) {
      message.operation_status = OperationStatus.fromPartial(
        object.operation_status
      );
    } else {
      message.operation_status = undefined;
    }
    return message;
  },

  toJSON(message: OrderListResponse): unknown {
    const obj: any = {};
    if (message.items) {
      obj.items = message.items.map((e) =>
        e ? OrderResponse.toJSON(e) : undefined
      );
    } else {
      obj.items = [];
    }
    message.total_count !== undefined &&
      (obj.total_count = message.total_count);
    message.operation_status !== undefined &&
      (obj.operation_status = message.operation_status
        ? OperationStatus.toJSON(message.operation_status)
        : undefined);
    return obj;
  },
};

const baseOrderResponse: object = {};

export const OrderResponse = {
  encode(message: OrderResponse, writer: Writer = Writer.create()): Writer {
    if (message.payload !== undefined) {
      Order.encode(message.payload, writer.uint32(10).fork()).ldelim();
    }
    if (message.status !== undefined) {
      Status.encode(message.status, writer.uint32(18).fork()).ldelim();
    }
    return writer;
  },

  decode(input: Reader | Uint8Array, length?: number): OrderResponse {
    const reader = input instanceof Uint8Array ? new Reader(input) : input;
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = globalThis.Object.create(
      baseOrderResponse
    ) as OrderResponse;
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.payload = Order.decode(reader, reader.uint32());
          break;
        case 2:
          message.status = Status.decode(reader, reader.uint32());
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): OrderResponse {
    const message = globalThis.Object.create(
      baseOrderResponse
    ) as OrderResponse;
    if (object.payload !== undefined && object.payload !== null) {
      message.payload = Order.fromJSON(object.payload);
    } else {
      message.payload = undefined;
    }
    if (object.status !== undefined && object.status !== null) {
      message.status = Status.fromJSON(object.status);
    } else {
      message.status = undefined;
    }
    return message;
  },

  fromPartial(object: DeepPartial<OrderResponse>): OrderResponse {
    const message = { ...baseOrderResponse } as OrderResponse;
    if (object.payload !== undefined && object.payload !== null) {
      message.payload = Order.fromPartial(object.payload);
    } else {
      message.payload = undefined;
    }
    if (object.status !== undefined && object.status !== null) {
      message.status = Status.fromPartial(object.status);
    } else {
      message.status = undefined;
    }
    return message;
  },

  toJSON(message: OrderResponse): unknown {
    const obj: any = {};
    message.payload !== undefined &&
      (obj.payload = message.payload
        ? Order.toJSON(message.payload)
        : undefined);
    message.status !== undefined &&
      (obj.status = message.status ? Status.toJSON(message.status) : undefined);
    return obj;
  },
};

const baseOrder: object = {
  id: "",
  name: "",
  description: "",
  status: "",
  total_price: 0,
  shipping_contact_point_id: "",
  billing_contact_point_id: "",
  total_weight_in_kg: 0,
};

export const Order = {
  encode(message: Order, writer: Writer = Writer.create()): Writer {
    if (message.id !== "") {
      writer.uint32(10).string(message.id);
    }
    if (message.meta !== undefined) {
      Meta.encode(message.meta, writer.uint32(18).fork()).ldelim();
    }
    if (message.name !== "") {
      writer.uint32(26).string(message.name);
    }
    if (message.description !== "") {
      writer.uint32(34).string(message.description);
    }
    if (message.status !== "") {
      writer.uint32(42).string(message.status);
    }
    for (const v of message.items) {
      Items.encode(v!, writer.uint32(50).fork()).ldelim();
    }
    if (message.total_price !== 0) {
      writer.uint32(57).double(message.total_price);
    }
    if (message.shipping_contact_point_id !== "") {
      writer.uint32(66).string(message.shipping_contact_point_id);
    }
    if (message.billing_contact_point_id !== "") {
      writer.uint32(74).string(message.billing_contact_point_id);
    }
    if (message.total_weight_in_kg !== 0) {
      writer.uint32(81).double(message.total_weight_in_kg);
    }
    return writer;
  },

  decode(input: Reader | Uint8Array, length?: number): Order {
    const reader = input instanceof Uint8Array ? new Reader(input) : input;
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = globalThis.Object.create(baseOrder) as Order;
    message.items = [];
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.id = reader.string();
          break;
        case 2:
          message.meta = Meta.decode(reader, reader.uint32());
          break;
        case 3:
          message.name = reader.string();
          break;
        case 4:
          message.description = reader.string();
          break;
        case 5:
          message.status = reader.string();
          break;
        case 6:
          message.items.push(Items.decode(reader, reader.uint32()));
          break;
        case 7:
          message.total_price = reader.double();
          break;
        case 8:
          message.shipping_contact_point_id = reader.string();
          break;
        case 9:
          message.billing_contact_point_id = reader.string();
          break;
        case 10:
          message.total_weight_in_kg = reader.double();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): Order {
    const message = globalThis.Object.create(baseOrder) as Order;
    message.items = [];
    if (object.id !== undefined && object.id !== null) {
      message.id = String(object.id);
    } else {
      message.id = "";
    }
    if (object.meta !== undefined && object.meta !== null) {
      message.meta = Meta.fromJSON(object.meta);
    } else {
      message.meta = undefined;
    }
    if (object.name !== undefined && object.name !== null) {
      message.name = String(object.name);
    } else {
      message.name = "";
    }
    if (object.description !== undefined && object.description !== null) {
      message.description = String(object.description);
    } else {
      message.description = "";
    }
    if (object.status !== undefined && object.status !== null) {
      message.status = String(object.status);
    } else {
      message.status = "";
    }
    if (object.items !== undefined && object.items !== null) {
      for (const e of object.items) {
        message.items.push(Items.fromJSON(e));
      }
    }
    if (object.total_price !== undefined && object.total_price !== null) {
      message.total_price = Number(object.total_price);
    } else {
      message.total_price = 0;
    }
    if (
      object.shipping_contact_point_id !== undefined &&
      object.shipping_contact_point_id !== null
    ) {
      message.shipping_contact_point_id = String(
        object.shipping_contact_point_id
      );
    } else {
      message.shipping_contact_point_id = "";
    }
    if (
      object.billing_contact_point_id !== undefined &&
      object.billing_contact_point_id !== null
    ) {
      message.billing_contact_point_id = String(
        object.billing_contact_point_id
      );
    } else {
      message.billing_contact_point_id = "";
    }
    if (
      object.total_weight_in_kg !== undefined &&
      object.total_weight_in_kg !== null
    ) {
      message.total_weight_in_kg = Number(object.total_weight_in_kg);
    } else {
      message.total_weight_in_kg = 0;
    }
    return message;
  },

  fromPartial(object: DeepPartial<Order>): Order {
    const message = { ...baseOrder } as Order;
    message.items = [];
    if (object.id !== undefined && object.id !== null) {
      message.id = object.id;
    } else {
      message.id = "";
    }
    if (object.meta !== undefined && object.meta !== null) {
      message.meta = Meta.fromPartial(object.meta);
    } else {
      message.meta = undefined;
    }
    if (object.name !== undefined && object.name !== null) {
      message.name = object.name;
    } else {
      message.name = "";
    }
    if (object.description !== undefined && object.description !== null) {
      message.description = object.description;
    } else {
      message.description = "";
    }
    if (object.status !== undefined && object.status !== null) {
      message.status = object.status;
    } else {
      message.status = "";
    }
    if (object.items !== undefined && object.items !== null) {
      for (const e of object.items) {
        message.items.push(Items.fromPartial(e));
      }
    }
    if (object.total_price !== undefined && object.total_price !== null) {
      message.total_price = object.total_price;
    } else {
      message.total_price = 0;
    }
    if (
      object.shipping_contact_point_id !== undefined &&
      object.shipping_contact_point_id !== null
    ) {
      message.shipping_contact_point_id = object.shipping_contact_point_id;
    } else {
      message.shipping_contact_point_id = "";
    }
    if (
      object.billing_contact_point_id !== undefined &&
      object.billing_contact_point_id !== null
    ) {
      message.billing_contact_point_id = object.billing_contact_point_id;
    } else {
      message.billing_contact_point_id = "";
    }
    if (
      object.total_weight_in_kg !== undefined &&
      object.total_weight_in_kg !== null
    ) {
      message.total_weight_in_kg = object.total_weight_in_kg;
    } else {
      message.total_weight_in_kg = 0;
    }
    return message;
  },

  toJSON(message: Order): unknown {
    const obj: any = {};
    message.id !== undefined && (obj.id = message.id);
    message.meta !== undefined &&
      (obj.meta = message.meta ? Meta.toJSON(message.meta) : undefined);
    message.name !== undefined && (obj.name = message.name);
    message.description !== undefined &&
      (obj.description = message.description);
    message.status !== undefined && (obj.status = message.status);
    if (message.items) {
      obj.items = message.items.map((e) => (e ? Items.toJSON(e) : undefined));
    } else {
      obj.items = [];
    }
    message.total_price !== undefined &&
      (obj.total_price = message.total_price);
    message.shipping_contact_point_id !== undefined &&
      (obj.shipping_contact_point_id = message.shipping_contact_point_id);
    message.billing_contact_point_id !== undefined &&
      (obj.billing_contact_point_id = message.billing_contact_point_id);
    message.total_weight_in_kg !== undefined &&
      (obj.total_weight_in_kg = message.total_weight_in_kg);
    return obj;
  },
};

const baseItems: object = { quantity_price: 0 };

export const Items = {
  encode(message: Items, writer: Writer = Writer.create()): Writer {
    if (message.quantity_price !== 0) {
      writer.uint32(9).double(message.quantity_price);
    }
    if (message.item !== undefined) {
      Item.encode(message.item, writer.uint32(18).fork()).ldelim();
    }
    return writer;
  },

  decode(input: Reader | Uint8Array, length?: number): Items {
    const reader = input instanceof Uint8Array ? new Reader(input) : input;
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = globalThis.Object.create(baseItems) as Items;
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.quantity_price = reader.double();
          break;
        case 2:
          message.item = Item.decode(reader, reader.uint32());
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): Items {
    const message = globalThis.Object.create(baseItems) as Items;
    if (object.quantity_price !== undefined && object.quantity_price !== null) {
      message.quantity_price = Number(object.quantity_price);
    } else {
      message.quantity_price = 0;
    }
    if (object.item !== undefined && object.item !== null) {
      message.item = Item.fromJSON(object.item);
    } else {
      message.item = undefined;
    }
    return message;
  },

  fromPartial(object: DeepPartial<Items>): Items {
    const message = { ...baseItems } as Items;
    if (object.quantity_price !== undefined && object.quantity_price !== null) {
      message.quantity_price = object.quantity_price;
    } else {
      message.quantity_price = 0;
    }
    if (object.item !== undefined && object.item !== null) {
      message.item = Item.fromPartial(object.item);
    } else {
      message.item = undefined;
    }
    return message;
  },

  toJSON(message: Items): unknown {
    const obj: any = {};
    message.quantity_price !== undefined &&
      (obj.quantity_price = message.quantity_price);
    message.item !== undefined &&
      (obj.item = message.item ? Item.toJSON(message.item) : undefined);
    return obj;
  },
};

const baseItem: object = {
  product_variant_bundle_id: "",
  product_name: "",
  product_description: "",
  manufacturer_name: "",
  manufacturer_description: "",
  prototype_name: "",
  prototype_description: "",
  quantity: 0,
  vat: 0,
  price: 0,
  item_type: "",
  taric_code: 0,
  stock_keeping_unit: "",
  weight_in_kg: 0,
  length_in_cm: 0,
  width_in_cm: 0,
  height_in_cm: 0,
};

export const Item = {
  encode(message: Item, writer: Writer = Writer.create()): Writer {
    if (message.product_variant_bundle_id !== "") {
      writer.uint32(10).string(message.product_variant_bundle_id);
    }
    if (message.product_name !== "") {
      writer.uint32(18).string(message.product_name);
    }
    if (message.product_description !== "") {
      writer.uint32(26).string(message.product_description);
    }
    if (message.manufacturer_name !== "") {
      writer.uint32(34).string(message.manufacturer_name);
    }
    if (message.manufacturer_description !== "") {
      writer.uint32(42).string(message.manufacturer_description);
    }
    if (message.prototype_name !== "") {
      writer.uint32(50).string(message.prototype_name);
    }
    if (message.prototype_description !== "") {
      writer.uint32(58).string(message.prototype_description);
    }
    if (message.quantity !== 0) {
      writer.uint32(64).int32(message.quantity);
    }
    if (message.vat !== 0) {
      writer.uint32(72).int32(message.vat);
    }
    if (message.price !== 0) {
      writer.uint32(81).double(message.price);
    }
    if (message.item_type !== "") {
      writer.uint32(90).string(message.item_type);
    }
    if (message.taric_code !== 0) {
      writer.uint32(97).double(message.taric_code);
    }
    if (message.stock_keeping_unit !== "") {
      writer.uint32(106).string(message.stock_keeping_unit);
    }
    if (message.weight_in_kg !== 0) {
      writer.uint32(113).double(message.weight_in_kg);
    }
    if (message.length_in_cm !== 0) {
      writer.uint32(120).int32(message.length_in_cm);
    }
    if (message.width_in_cm !== 0) {
      writer.uint32(128).int32(message.width_in_cm);
    }
    if (message.height_in_cm !== 0) {
      writer.uint32(136).int32(message.height_in_cm);
    }
    return writer;
  },

  decode(input: Reader | Uint8Array, length?: number): Item {
    const reader = input instanceof Uint8Array ? new Reader(input) : input;
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = globalThis.Object.create(baseItem) as Item;
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.product_variant_bundle_id = reader.string();
          break;
        case 2:
          message.product_name = reader.string();
          break;
        case 3:
          message.product_description = reader.string();
          break;
        case 4:
          message.manufacturer_name = reader.string();
          break;
        case 5:
          message.manufacturer_description = reader.string();
          break;
        case 6:
          message.prototype_name = reader.string();
          break;
        case 7:
          message.prototype_description = reader.string();
          break;
        case 8:
          message.quantity = reader.int32();
          break;
        case 9:
          message.vat = reader.int32();
          break;
        case 10:
          message.price = reader.double();
          break;
        case 11:
          message.item_type = reader.string();
          break;
        case 12:
          message.taric_code = reader.double();
          break;
        case 13:
          message.stock_keeping_unit = reader.string();
          break;
        case 14:
          message.weight_in_kg = reader.double();
          break;
        case 15:
          message.length_in_cm = reader.int32();
          break;
        case 16:
          message.width_in_cm = reader.int32();
          break;
        case 17:
          message.height_in_cm = reader.int32();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): Item {
    const message = globalThis.Object.create(baseItem) as Item;
    if (
      object.product_variant_bundle_id !== undefined &&
      object.product_variant_bundle_id !== null
    ) {
      message.product_variant_bundle_id = String(
        object.product_variant_bundle_id
      );
    } else {
      message.product_variant_bundle_id = "";
    }
    if (object.product_name !== undefined && object.product_name !== null) {
      message.product_name = String(object.product_name);
    } else {
      message.product_name = "";
    }
    if (
      object.product_description !== undefined &&
      object.product_description !== null
    ) {
      message.product_description = String(object.product_description);
    } else {
      message.product_description = "";
    }
    if (
      object.manufacturer_name !== undefined &&
      object.manufacturer_name !== null
    ) {
      message.manufacturer_name = String(object.manufacturer_name);
    } else {
      message.manufacturer_name = "";
    }
    if (
      object.manufacturer_description !== undefined &&
      object.manufacturer_description !== null
    ) {
      message.manufacturer_description = String(
        object.manufacturer_description
      );
    } else {
      message.manufacturer_description = "";
    }
    if (object.prototype_name !== undefined && object.prototype_name !== null) {
      message.prototype_name = String(object.prototype_name);
    } else {
      message.prototype_name = "";
    }
    if (
      object.prototype_description !== undefined &&
      object.prototype_description !== null
    ) {
      message.prototype_description = String(object.prototype_description);
    } else {
      message.prototype_description = "";
    }
    if (object.quantity !== undefined && object.quantity !== null) {
      message.quantity = Number(object.quantity);
    } else {
      message.quantity = 0;
    }
    if (object.vat !== undefined && object.vat !== null) {
      message.vat = Number(object.vat);
    } else {
      message.vat = 0;
    }
    if (object.price !== undefined && object.price !== null) {
      message.price = Number(object.price);
    } else {
      message.price = 0;
    }
    if (object.item_type !== undefined && object.item_type !== null) {
      message.item_type = String(object.item_type);
    } else {
      message.item_type = "";
    }
    if (object.taric_code !== undefined && object.taric_code !== null) {
      message.taric_code = Number(object.taric_code);
    } else {
      message.taric_code = 0;
    }
    if (
      object.stock_keeping_unit !== undefined &&
      object.stock_keeping_unit !== null
    ) {
      message.stock_keeping_unit = String(object.stock_keeping_unit);
    } else {
      message.stock_keeping_unit = "";
    }
    if (object.weight_in_kg !== undefined && object.weight_in_kg !== null) {
      message.weight_in_kg = Number(object.weight_in_kg);
    } else {
      message.weight_in_kg = 0;
    }
    if (object.length_in_cm !== undefined && object.length_in_cm !== null) {
      message.length_in_cm = Number(object.length_in_cm);
    } else {
      message.length_in_cm = 0;
    }
    if (object.width_in_cm !== undefined && object.width_in_cm !== null) {
      message.width_in_cm = Number(object.width_in_cm);
    } else {
      message.width_in_cm = 0;
    }
    if (object.height_in_cm !== undefined && object.height_in_cm !== null) {
      message.height_in_cm = Number(object.height_in_cm);
    } else {
      message.height_in_cm = 0;
    }
    return message;
  },

  fromPartial(object: DeepPartial<Item>): Item {
    const message = { ...baseItem } as Item;
    if (
      object.product_variant_bundle_id !== undefined &&
      object.product_variant_bundle_id !== null
    ) {
      message.product_variant_bundle_id = object.product_variant_bundle_id;
    } else {
      message.product_variant_bundle_id = "";
    }
    if (object.product_name !== undefined && object.product_name !== null) {
      message.product_name = object.product_name;
    } else {
      message.product_name = "";
    }
    if (
      object.product_description !== undefined &&
      object.product_description !== null
    ) {
      message.product_description = object.product_description;
    } else {
      message.product_description = "";
    }
    if (
      object.manufacturer_name !== undefined &&
      object.manufacturer_name !== null
    ) {
      message.manufacturer_name = object.manufacturer_name;
    } else {
      message.manufacturer_name = "";
    }
    if (
      object.manufacturer_description !== undefined &&
      object.manufacturer_description !== null
    ) {
      message.manufacturer_description = object.manufacturer_description;
    } else {
      message.manufacturer_description = "";
    }
    if (object.prototype_name !== undefined && object.prototype_name !== null) {
      message.prototype_name = object.prototype_name;
    } else {
      message.prototype_name = "";
    }
    if (
      object.prototype_description !== undefined &&
      object.prototype_description !== null
    ) {
      message.prototype_description = object.prototype_description;
    } else {
      message.prototype_description = "";
    }
    if (object.quantity !== undefined && object.quantity !== null) {
      message.quantity = object.quantity;
    } else {
      message.quantity = 0;
    }
    if (object.vat !== undefined && object.vat !== null) {
      message.vat = object.vat;
    } else {
      message.vat = 0;
    }
    if (object.price !== undefined && object.price !== null) {
      message.price = object.price;
    } else {
      message.price = 0;
    }
    if (object.item_type !== undefined && object.item_type !== null) {
      message.item_type = object.item_type;
    } else {
      message.item_type = "";
    }
    if (object.taric_code !== undefined && object.taric_code !== null) {
      message.taric_code = object.taric_code;
    } else {
      message.taric_code = 0;
    }
    if (
      object.stock_keeping_unit !== undefined &&
      object.stock_keeping_unit !== null
    ) {
      message.stock_keeping_unit = object.stock_keeping_unit;
    } else {
      message.stock_keeping_unit = "";
    }
    if (object.weight_in_kg !== undefined && object.weight_in_kg !== null) {
      message.weight_in_kg = object.weight_in_kg;
    } else {
      message.weight_in_kg = 0;
    }
    if (object.length_in_cm !== undefined && object.length_in_cm !== null) {
      message.length_in_cm = object.length_in_cm;
    } else {
      message.length_in_cm = 0;
    }
    if (object.width_in_cm !== undefined && object.width_in_cm !== null) {
      message.width_in_cm = object.width_in_cm;
    } else {
      message.width_in_cm = 0;
    }
    if (object.height_in_cm !== undefined && object.height_in_cm !== null) {
      message.height_in_cm = object.height_in_cm;
    } else {
      message.height_in_cm = 0;
    }
    return message;
  },

  toJSON(message: Item): unknown {
    const obj: any = {};
    message.product_variant_bundle_id !== undefined &&
      (obj.product_variant_bundle_id = message.product_variant_bundle_id);
    message.product_name !== undefined &&
      (obj.product_name = message.product_name);
    message.product_description !== undefined &&
      (obj.product_description = message.product_description);
    message.manufacturer_name !== undefined &&
      (obj.manufacturer_name = message.manufacturer_name);
    message.manufacturer_description !== undefined &&
      (obj.manufacturer_description = message.manufacturer_description);
    message.prototype_name !== undefined &&
      (obj.prototype_name = message.prototype_name);
    message.prototype_description !== undefined &&
      (obj.prototype_description = message.prototype_description);
    message.quantity !== undefined && (obj.quantity = message.quantity);
    message.vat !== undefined && (obj.vat = message.vat);
    message.price !== undefined && (obj.price = message.price);
    message.item_type !== undefined && (obj.item_type = message.item_type);
    message.taric_code !== undefined && (obj.taric_code = message.taric_code);
    message.stock_keeping_unit !== undefined &&
      (obj.stock_keeping_unit = message.stock_keeping_unit);
    message.weight_in_kg !== undefined &&
      (obj.weight_in_kg = message.weight_in_kg);
    message.length_in_cm !== undefined &&
      (obj.length_in_cm = message.length_in_cm);
    message.width_in_cm !== undefined &&
      (obj.width_in_cm = message.width_in_cm);
    message.height_in_cm !== undefined &&
      (obj.height_in_cm = message.height_in_cm);
    return obj;
  },
};

const baseDeleted: object = { id: "" };

export const Deleted = {
  encode(message: Deleted, writer: Writer = Writer.create()): Writer {
    if (message.id !== "") {
      writer.uint32(10).string(message.id);
    }
    return writer;
  },

  decode(input: Reader | Uint8Array, length?: number): Deleted {
    const reader = input instanceof Uint8Array ? new Reader(input) : input;
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = globalThis.Object.create(baseDeleted) as Deleted;
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.id = reader.string();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): Deleted {
    const message = globalThis.Object.create(baseDeleted) as Deleted;
    if (object.id !== undefined && object.id !== null) {
      message.id = String(object.id);
    } else {
      message.id = "";
    }
    return message;
  },

  fromPartial(object: DeepPartial<Deleted>): Deleted {
    const message = { ...baseDeleted } as Deleted;
    if (object.id !== undefined && object.id !== null) {
      message.id = object.id;
    } else {
      message.id = "";
    }
    return message;
  },

  toJSON(message: Deleted): unknown {
    const obj: any = {};
    message.id !== undefined && (obj.id = message.id);
    return obj;
  },
};

const baseOrderDataList: object = {};

export const OrderDataList = {
  encode(message: OrderDataList, writer: Writer = Writer.create()): Writer {
    for (const v of message.order_data) {
      OrderData.encode(v!, writer.uint32(10).fork()).ldelim();
    }
    if (message.meta !== undefined) {
      Meta.encode(message.meta, writer.uint32(18).fork()).ldelim();
    }
    return writer;
  },

  decode(input: Reader | Uint8Array, length?: number): OrderDataList {
    const reader = input instanceof Uint8Array ? new Reader(input) : input;
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = globalThis.Object.create(
      baseOrderDataList
    ) as OrderDataList;
    message.order_data = [];
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.order_data.push(OrderData.decode(reader, reader.uint32()));
          break;
        case 2:
          message.meta = Meta.decode(reader, reader.uint32());
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): OrderDataList {
    const message = globalThis.Object.create(
      baseOrderDataList
    ) as OrderDataList;
    message.order_data = [];
    if (object.order_data !== undefined && object.order_data !== null) {
      for (const e of object.order_data) {
        message.order_data.push(OrderData.fromJSON(e));
      }
    }
    if (object.meta !== undefined && object.meta !== null) {
      message.meta = Meta.fromJSON(object.meta);
    } else {
      message.meta = undefined;
    }
    return message;
  },

  fromPartial(object: DeepPartial<OrderDataList>): OrderDataList {
    const message = { ...baseOrderDataList } as OrderDataList;
    message.order_data = [];
    if (object.order_data !== undefined && object.order_data !== null) {
      for (const e of object.order_data) {
        message.order_data.push(OrderData.fromPartial(e));
      }
    }
    if (object.meta !== undefined && object.meta !== null) {
      message.meta = Meta.fromPartial(object.meta);
    } else {
      message.meta = undefined;
    }
    return message;
  },

  toJSON(message: OrderDataList): unknown {
    const obj: any = {};
    if (message.order_data) {
      obj.order_data = message.order_data.map((e) =>
        e ? OrderData.toJSON(e) : undefined
      );
    } else {
      obj.order_data = [];
    }
    message.meta !== undefined &&
      (obj.meta = message.meta ? Meta.toJSON(message.meta) : undefined);
    return obj;
  },
};

const baseOrderData: object = { order_id: "" };

export const OrderData = {
  encode(message: OrderData, writer: Writer = Writer.create()): Writer {
    if (message.order_id !== "") {
      writer.uint32(10).string(message.order_id);
    }
    for (const v of message.shipments) {
      Shipments.encode(v!, writer.uint32(18).fork()).ldelim();
    }
    return writer;
  },

  decode(input: Reader | Uint8Array, length?: number): OrderData {
    const reader = input instanceof Uint8Array ? new Reader(input) : input;
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = globalThis.Object.create(baseOrderData) as OrderData;
    message.shipments = [];
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.order_id = reader.string();
          break;
        case 2:
          message.shipments.push(Shipments.decode(reader, reader.uint32()));
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): OrderData {
    const message = globalThis.Object.create(baseOrderData) as OrderData;
    message.shipments = [];
    if (object.order_id !== undefined && object.order_id !== null) {
      message.order_id = String(object.order_id);
    } else {
      message.order_id = "";
    }
    if (object.shipments !== undefined && object.shipments !== null) {
      for (const e of object.shipments) {
        message.shipments.push(Shipments.fromJSON(e));
      }
    }
    return message;
  },

  fromPartial(object: DeepPartial<OrderData>): OrderData {
    const message = { ...baseOrderData } as OrderData;
    message.shipments = [];
    if (object.order_id !== undefined && object.order_id !== null) {
      message.order_id = object.order_id;
    } else {
      message.order_id = "";
    }
    if (object.shipments !== undefined && object.shipments !== null) {
      for (const e of object.shipments) {
        message.shipments.push(Shipments.fromPartial(e));
      }
    }
    return message;
  },

  toJSON(message: OrderData): unknown {
    const obj: any = {};
    message.order_id !== undefined && (obj.order_id = message.order_id);
    if (message.shipments) {
      obj.shipments = message.shipments.map((e) =>
        e ? Shipments.toJSON(e) : undefined
      );
    } else {
      obj.shipments = [];
    }
    return obj;
  },
};

const baseShipments: object = {
  total_weight_in_kg: 0,
  individual_weight_in_kg: 0,
  amount: 0,
  export_type: "",
  export_description: "",
  customs_tariff_number: "",
  invoice_number: "",
  customs_value: 0,
};

export const Shipments = {
  encode(message: Shipments, writer: Writer = Writer.create()): Writer {
    if (message.total_weight_in_kg !== 0) {
      writer.uint32(9).double(message.total_weight_in_kg);
    }
    if (message.individual_weight_in_kg !== 0) {
      writer.uint32(17).double(message.individual_weight_in_kg);
    }
    if (message.amount !== 0) {
      writer.uint32(24).int32(message.amount);
    }
    if (message.export_type !== "") {
      writer.uint32(34).string(message.export_type);
    }
    if (message.export_description !== "") {
      writer.uint32(42).string(message.export_description);
    }
    if (message.customs_tariff_number !== "") {
      writer.uint32(50).string(message.customs_tariff_number);
    }
    if (message.invoice_number !== "") {
      writer.uint32(58).string(message.invoice_number);
    }
    if (message.customs_value !== 0) {
      writer.uint32(65).double(message.customs_value);
    }
    return writer;
  },

  decode(input: Reader | Uint8Array, length?: number): Shipments {
    const reader = input instanceof Uint8Array ? new Reader(input) : input;
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = globalThis.Object.create(baseShipments) as Shipments;
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.total_weight_in_kg = reader.double();
          break;
        case 2:
          message.individual_weight_in_kg = reader.double();
          break;
        case 3:
          message.amount = reader.int32();
          break;
        case 4:
          message.export_type = reader.string();
          break;
        case 5:
          message.export_description = reader.string();
          break;
        case 6:
          message.customs_tariff_number = reader.string();
          break;
        case 7:
          message.invoice_number = reader.string();
          break;
        case 8:
          message.customs_value = reader.double();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): Shipments {
    const message = globalThis.Object.create(baseShipments) as Shipments;
    if (
      object.total_weight_in_kg !== undefined &&
      object.total_weight_in_kg !== null
    ) {
      message.total_weight_in_kg = Number(object.total_weight_in_kg);
    } else {
      message.total_weight_in_kg = 0;
    }
    if (
      object.individual_weight_in_kg !== undefined &&
      object.individual_weight_in_kg !== null
    ) {
      message.individual_weight_in_kg = Number(object.individual_weight_in_kg);
    } else {
      message.individual_weight_in_kg = 0;
    }
    if (object.amount !== undefined && object.amount !== null) {
      message.amount = Number(object.amount);
    } else {
      message.amount = 0;
    }
    if (object.export_type !== undefined && object.export_type !== null) {
      message.export_type = String(object.export_type);
    } else {
      message.export_type = "";
    }
    if (
      object.export_description !== undefined &&
      object.export_description !== null
    ) {
      message.export_description = String(object.export_description);
    } else {
      message.export_description = "";
    }
    if (
      object.customs_tariff_number !== undefined &&
      object.customs_tariff_number !== null
    ) {
      message.customs_tariff_number = String(object.customs_tariff_number);
    } else {
      message.customs_tariff_number = "";
    }
    if (object.invoice_number !== undefined && object.invoice_number !== null) {
      message.invoice_number = String(object.invoice_number);
    } else {
      message.invoice_number = "";
    }
    if (object.customs_value !== undefined && object.customs_value !== null) {
      message.customs_value = Number(object.customs_value);
    } else {
      message.customs_value = 0;
    }
    return message;
  },

  fromPartial(object: DeepPartial<Shipments>): Shipments {
    const message = { ...baseShipments } as Shipments;
    if (
      object.total_weight_in_kg !== undefined &&
      object.total_weight_in_kg !== null
    ) {
      message.total_weight_in_kg = object.total_weight_in_kg;
    } else {
      message.total_weight_in_kg = 0;
    }
    if (
      object.individual_weight_in_kg !== undefined &&
      object.individual_weight_in_kg !== null
    ) {
      message.individual_weight_in_kg = object.individual_weight_in_kg;
    } else {
      message.individual_weight_in_kg = 0;
    }
    if (object.amount !== undefined && object.amount !== null) {
      message.amount = object.amount;
    } else {
      message.amount = 0;
    }
    if (object.export_type !== undefined && object.export_type !== null) {
      message.export_type = object.export_type;
    } else {
      message.export_type = "";
    }
    if (
      object.export_description !== undefined &&
      object.export_description !== null
    ) {
      message.export_description = object.export_description;
    } else {
      message.export_description = "";
    }
    if (
      object.customs_tariff_number !== undefined &&
      object.customs_tariff_number !== null
    ) {
      message.customs_tariff_number = object.customs_tariff_number;
    } else {
      message.customs_tariff_number = "";
    }
    if (object.invoice_number !== undefined && object.invoice_number !== null) {
      message.invoice_number = object.invoice_number;
    } else {
      message.invoice_number = "";
    }
    if (object.customs_value !== undefined && object.customs_value !== null) {
      message.customs_value = object.customs_value;
    } else {
      message.customs_value = 0;
    }
    return message;
  },

  toJSON(message: Shipments): unknown {
    const obj: any = {};
    message.total_weight_in_kg !== undefined &&
      (obj.total_weight_in_kg = message.total_weight_in_kg);
    message.individual_weight_in_kg !== undefined &&
      (obj.individual_weight_in_kg = message.individual_weight_in_kg);
    message.amount !== undefined && (obj.amount = message.amount);
    message.export_type !== undefined &&
      (obj.export_type = message.export_type);
    message.export_description !== undefined &&
      (obj.export_description = message.export_description);
    message.customs_tariff_number !== undefined &&
      (obj.customs_tariff_number = message.customs_tariff_number);
    message.invoice_number !== undefined &&
      (obj.invoice_number = message.invoice_number);
    message.customs_value !== undefined &&
      (obj.customs_value = message.customs_value);
    return obj;
  },
};

const baseFulfillmentResults: object = {};

export const FulfillmentResults = {
  encode(
    message: FulfillmentResults,
    writer: Writer = Writer.create()
  ): Writer {
    for (const v of message.fulfillmentResults) {
      ResponseDetailsList.encode(v!, writer.uint32(10).fork()).ldelim();
    }
    return writer;
  },

  decode(input: Reader | Uint8Array, length?: number): FulfillmentResults {
    const reader = input instanceof Uint8Array ? new Reader(input) : input;
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = globalThis.Object.create(
      baseFulfillmentResults
    ) as FulfillmentResults;
    message.fulfillmentResults = [];
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.fulfillmentResults.push(
            ResponseDetailsList.decode(reader, reader.uint32())
          );
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): FulfillmentResults {
    const message = globalThis.Object.create(
      baseFulfillmentResults
    ) as FulfillmentResults;
    message.fulfillmentResults = [];
    if (
      object.fulfillmentResults !== undefined &&
      object.fulfillmentResults !== null
    ) {
      for (const e of object.fulfillmentResults) {
        message.fulfillmentResults.push(ResponseDetailsList.fromJSON(e));
      }
    }
    return message;
  },

  fromPartial(object: DeepPartial<FulfillmentResults>): FulfillmentResults {
    const message = { ...baseFulfillmentResults } as FulfillmentResults;
    message.fulfillmentResults = [];
    if (
      object.fulfillmentResults !== undefined &&
      object.fulfillmentResults !== null
    ) {
      for (const e of object.fulfillmentResults) {
        message.fulfillmentResults.push(ResponseDetailsList.fromPartial(e));
      }
    }
    return message;
  },

  toJSON(message: FulfillmentResults): unknown {
    const obj: any = {};
    if (message.fulfillmentResults) {
      obj.fulfillmentResults = message.fulfillmentResults.map((e) =>
        e ? ResponseDetailsList.toJSON(e) : undefined
      );
    } else {
      obj.fulfillmentResults = [];
    }
    return obj;
  },
};

const baseResponseDetailsList: object = {};

export const ResponseDetailsList = {
  encode(
    message: ResponseDetailsList,
    writer: Writer = Writer.create()
  ): Writer {
    if (message.Status !== undefined) {
      OrderStatus.encode(message.Status, writer.uint32(10).fork()).ldelim();
    }
    if (message.error !== undefined) {
      ErrorList.encode(message.error, writer.uint32(18).fork()).ldelim();
    }
    return writer;
  },

  decode(input: Reader | Uint8Array, length?: number): ResponseDetailsList {
    const reader = input instanceof Uint8Array ? new Reader(input) : input;
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = globalThis.Object.create(
      baseResponseDetailsList
    ) as ResponseDetailsList;
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.Status = OrderStatus.decode(reader, reader.uint32());
          break;
        case 2:
          message.error = ErrorList.decode(reader, reader.uint32());
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): ResponseDetailsList {
    const message = globalThis.Object.create(
      baseResponseDetailsList
    ) as ResponseDetailsList;
    if (object.Status !== undefined && object.Status !== null) {
      message.Status = OrderStatus.fromJSON(object.Status);
    } else {
      message.Status = undefined;
    }
    if (object.error !== undefined && object.error !== null) {
      message.error = ErrorList.fromJSON(object.error);
    } else {
      message.error = undefined;
    }
    return message;
  },

  fromPartial(object: DeepPartial<ResponseDetailsList>): ResponseDetailsList {
    const message = { ...baseResponseDetailsList } as ResponseDetailsList;
    if (object.Status !== undefined && object.Status !== null) {
      message.Status = OrderStatus.fromPartial(object.Status);
    } else {
      message.Status = undefined;
    }
    if (object.error !== undefined && object.error !== null) {
      message.error = ErrorList.fromPartial(object.error);
    } else {
      message.error = undefined;
    }
    return message;
  },

  toJSON(message: ResponseDetailsList): unknown {
    const obj: any = {};
    message.Status !== undefined &&
      (obj.Status = message.Status
        ? OrderStatus.toJSON(message.Status)
        : undefined);
    message.error !== undefined &&
      (obj.error = message.error ? ErrorList.toJSON(message.error) : undefined);
    return obj;
  },
};

const baseOrderStatus: object = { OrderId: "", OrderStatus: "" };

export const OrderStatus = {
  encode(message: OrderStatus, writer: Writer = Writer.create()): Writer {
    if (message.OrderId !== "") {
      writer.uint32(10).string(message.OrderId);
    }
    if (message.OrderStatus !== "") {
      writer.uint32(18).string(message.OrderStatus);
    }
    return writer;
  },

  decode(input: Reader | Uint8Array, length?: number): OrderStatus {
    const reader = input instanceof Uint8Array ? new Reader(input) : input;
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = globalThis.Object.create(baseOrderStatus) as OrderStatus;
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.OrderId = reader.string();
          break;
        case 2:
          message.OrderStatus = reader.string();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): OrderStatus {
    const message = globalThis.Object.create(baseOrderStatus) as OrderStatus;
    if (object.OrderId !== undefined && object.OrderId !== null) {
      message.OrderId = String(object.OrderId);
    } else {
      message.OrderId = "";
    }
    if (object.OrderStatus !== undefined && object.OrderStatus !== null) {
      message.OrderStatus = String(object.OrderStatus);
    } else {
      message.OrderStatus = "";
    }
    return message;
  },

  fromPartial(object: DeepPartial<OrderStatus>): OrderStatus {
    const message = { ...baseOrderStatus } as OrderStatus;
    if (object.OrderId !== undefined && object.OrderId !== null) {
      message.OrderId = object.OrderId;
    } else {
      message.OrderId = "";
    }
    if (object.OrderStatus !== undefined && object.OrderStatus !== null) {
      message.OrderStatus = object.OrderStatus;
    } else {
      message.OrderStatus = "";
    }
    return message;
  },

  toJSON(message: OrderStatus): unknown {
    const obj: any = {};
    message.OrderId !== undefined && (obj.OrderId = message.OrderId);
    message.OrderStatus !== undefined &&
      (obj.OrderStatus = message.OrderStatus);
    return obj;
  },
};

const baseErrorList: object = { code: "", message: "" };

export const ErrorList = {
  encode(message: ErrorList, writer: Writer = Writer.create()): Writer {
    for (const v of message.code) {
      writer.uint32(10).string(v!);
    }
    for (const v of message.message) {
      writer.uint32(18).string(v!);
    }
    return writer;
  },

  decode(input: Reader | Uint8Array, length?: number): ErrorList {
    const reader = input instanceof Uint8Array ? new Reader(input) : input;
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = globalThis.Object.create(baseErrorList) as ErrorList;
    message.code = [];
    message.message = [];
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.code.push(reader.string());
          break;
        case 2:
          message.message.push(reader.string());
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): ErrorList {
    const message = globalThis.Object.create(baseErrorList) as ErrorList;
    message.code = [];
    message.message = [];
    if (object.code !== undefined && object.code !== null) {
      for (const e of object.code) {
        message.code.push(String(e));
      }
    }
    if (object.message !== undefined && object.message !== null) {
      for (const e of object.message) {
        message.message.push(String(e));
      }
    }
    return message;
  },

  fromPartial(object: DeepPartial<ErrorList>): ErrorList {
    const message = { ...baseErrorList } as ErrorList;
    message.code = [];
    message.message = [];
    if (object.code !== undefined && object.code !== null) {
      for (const e of object.code) {
        message.code.push(e);
      }
    }
    if (object.message !== undefined && object.message !== null) {
      for (const e of object.message) {
        message.message.push(e);
      }
    }
    return message;
  },

  toJSON(message: ErrorList): unknown {
    const obj: any = {};
    if (message.code) {
      obj.code = message.code.map((e) => e);
    } else {
      obj.code = [];
    }
    if (message.message) {
      obj.message = message.message.map((e) => e);
    } else {
      obj.message = [];
    }
    return obj;
  },
};

export interface Service {
  Read(request: ReadRequest): Promise<OrderListResponse>;
  Create(request: OrderList): Promise<OrderListResponse>;
  Delete(request: DeleteRequest): Promise<DeleteResponse>;
  Update(request: OrderList): Promise<OrderListResponse>;
  Upsert(request: OrderList): Promise<OrderListResponse>;
  TriggerFulfillment(request: OrderDataList): Promise<FulfillmentResults>;
}

export interface ProtoMetadata {
  fileDescriptor: FileDescriptorProto;
  references: { [key: string]: any };
  dependencies?: ProtoMetadata[];
}

export const protoMetadata: ProtoMetadata = {
  fileDescriptor: FileDescriptorProto.fromPartial({
    dependency: [
      "io/restorecommerce/resource_base.proto",
      "io/restorecommerce/meta.proto",
      "io/restorecommerce/auth.proto",
      "io/restorecommerce/status.proto",
    ],
    publicDependency: [],
    weakDependency: [],
    messageType: [
      {
        field: [
          {
            name: "items",
            number: 1,
            label: 3,
            type: 11,
            typeName: ".io.restorecommerce.order.Order",
            jsonName: "items",
          },
          {
            name: "total_count",
            number: 2,
            label: 1,
            type: 13,
            jsonName: "totalCount",
          },
          {
            name: "subject",
            number: 3,
            label: 1,
            type: 11,
            typeName: ".io.restorecommerce.auth.Subject",
            jsonName: "subject",
          },
        ],
        extension: [],
        nestedType: [],
        enumType: [],
        extensionRange: [],
        oneofDecl: [],
        reservedRange: [],
        reservedName: [],
        name: "OrderList",
      },
      {
        field: [
          {
            name: "items",
            number: 1,
            label: 3,
            type: 11,
            typeName: ".io.restorecommerce.order.OrderResponse",
            jsonName: "items",
          },
          {
            name: "total_count",
            number: 2,
            label: 1,
            type: 13,
            jsonName: "totalCount",
          },
          {
            name: "operation_status",
            number: 3,
            label: 1,
            type: 11,
            typeName: ".io.restorecommerce.status.OperationStatus",
            jsonName: "operationStatus",
          },
        ],
        extension: [],
        nestedType: [],
        enumType: [],
        extensionRange: [],
        oneofDecl: [],
        reservedRange: [],
        reservedName: [],
        name: "OrderListResponse",
      },
      {
        field: [
          {
            name: "payload",
            number: 1,
            label: 1,
            type: 11,
            typeName: ".io.restorecommerce.order.Order",
            jsonName: "payload",
          },
          {
            name: "status",
            number: 2,
            label: 1,
            type: 11,
            typeName: ".io.restorecommerce.status.Status",
            jsonName: "status",
          },
        ],
        extension: [],
        nestedType: [],
        enumType: [],
        extensionRange: [],
        oneofDecl: [],
        reservedRange: [],
        reservedName: [],
        name: "OrderResponse",
      },
      {
        field: [
          { name: "id", number: 1, label: 1, type: 9, jsonName: "id" },
          {
            name: "meta",
            number: 2,
            label: 1,
            type: 11,
            typeName: ".io.restorecommerce.meta.Meta",
            jsonName: "meta",
          },
          { name: "name", number: 3, label: 1, type: 9, jsonName: "name" },
          {
            name: "description",
            number: 4,
            label: 1,
            type: 9,
            jsonName: "description",
          },
          { name: "status", number: 5, label: 1, type: 9, jsonName: "status" },
          {
            name: "items",
            number: 6,
            label: 3,
            type: 11,
            typeName: ".io.restorecommerce.order.Items",
            jsonName: "items",
          },
          {
            name: "total_price",
            number: 7,
            label: 1,
            type: 1,
            jsonName: "totalPrice",
          },
          {
            name: "shipping_contact_point_id",
            number: 8,
            label: 1,
            type: 9,
            jsonName: "shippingContactPointId",
          },
          {
            name: "billing_contact_point_id",
            number: 9,
            label: 1,
            type: 9,
            jsonName: "billingContactPointId",
          },
          {
            name: "total_weight_in_kg",
            number: 10,
            label: 1,
            type: 1,
            jsonName: "totalWeightInKg",
          },
        ],
        extension: [],
        nestedType: [],
        enumType: [],
        extensionRange: [],
        oneofDecl: [],
        reservedRange: [],
        reservedName: [],
        name: "Order",
      },
      {
        field: [
          {
            name: "quantity_price",
            number: 1,
            label: 1,
            type: 1,
            jsonName: "quantityPrice",
          },
          {
            name: "item",
            number: 2,
            label: 1,
            type: 11,
            typeName: ".io.restorecommerce.order.Item",
            jsonName: "item",
          },
        ],
        extension: [],
        nestedType: [],
        enumType: [],
        extensionRange: [],
        oneofDecl: [],
        reservedRange: [],
        reservedName: [],
        name: "Items",
      },
      {
        field: [
          {
            name: "product_variant_bundle_id",
            number: 1,
            label: 1,
            type: 9,
            jsonName: "productVariantBundleId",
          },
          {
            name: "product_name",
            number: 2,
            label: 1,
            type: 9,
            jsonName: "productName",
          },
          {
            name: "product_description",
            number: 3,
            label: 1,
            type: 9,
            jsonName: "productDescription",
          },
          {
            name: "manufacturer_name",
            number: 4,
            label: 1,
            type: 9,
            jsonName: "manufacturerName",
          },
          {
            name: "manufacturer_description",
            number: 5,
            label: 1,
            type: 9,
            jsonName: "manufacturerDescription",
          },
          {
            name: "prototype_name",
            number: 6,
            label: 1,
            type: 9,
            jsonName: "prototypeName",
          },
          {
            name: "prototype_description",
            number: 7,
            label: 1,
            type: 9,
            jsonName: "prototypeDescription",
          },
          {
            name: "quantity",
            number: 8,
            label: 1,
            type: 5,
            jsonName: "quantity",
          },
          { name: "vat", number: 9, label: 1, type: 5, jsonName: "vat" },
          { name: "price", number: 10, label: 1, type: 1, jsonName: "price" },
          {
            name: "item_type",
            number: 11,
            label: 1,
            type: 9,
            jsonName: "itemType",
          },
          {
            name: "taric_code",
            number: 12,
            label: 1,
            type: 1,
            jsonName: "taricCode",
          },
          {
            name: "stock_keeping_unit",
            number: 13,
            label: 1,
            type: 9,
            jsonName: "stockKeepingUnit",
          },
          {
            name: "weight_in_kg",
            number: 14,
            label: 1,
            type: 1,
            jsonName: "weightInKg",
          },
          {
            name: "length_in_cm",
            number: 15,
            label: 1,
            type: 5,
            jsonName: "lengthInCm",
          },
          {
            name: "width_in_cm",
            number: 16,
            label: 1,
            type: 5,
            jsonName: "widthInCm",
          },
          {
            name: "height_in_cm",
            number: 17,
            label: 1,
            type: 5,
            jsonName: "heightInCm",
          },
        ],
        extension: [],
        nestedType: [],
        enumType: [],
        extensionRange: [],
        oneofDecl: [],
        reservedRange: [],
        reservedName: [],
        name: "Item",
      },
      {
        field: [{ name: "id", number: 1, label: 1, type: 9, jsonName: "id" }],
        extension: [],
        nestedType: [],
        enumType: [],
        extensionRange: [],
        oneofDecl: [],
        reservedRange: [],
        reservedName: [],
        name: "Deleted",
      },
      {
        field: [
          {
            name: "order_data",
            number: 1,
            label: 3,
            type: 11,
            typeName: ".io.restorecommerce.order.OrderData",
            jsonName: "orderData",
          },
          {
            name: "meta",
            number: 2,
            label: 1,
            type: 11,
            typeName: ".io.restorecommerce.meta.Meta",
            jsonName: "meta",
          },
        ],
        extension: [],
        nestedType: [],
        enumType: [],
        extensionRange: [],
        oneofDecl: [],
        reservedRange: [],
        reservedName: [],
        name: "OrderDataList",
      },
      {
        field: [
          {
            name: "order_id",
            number: 1,
            label: 1,
            type: 9,
            jsonName: "orderId",
          },
          {
            name: "shipments",
            number: 2,
            label: 3,
            type: 11,
            typeName: ".io.restorecommerce.order.Shipments",
            jsonName: "shipments",
          },
        ],
        extension: [],
        nestedType: [],
        enumType: [],
        extensionRange: [],
        oneofDecl: [],
        reservedRange: [],
        reservedName: [],
        name: "OrderData",
      },
      {
        field: [
          {
            name: "total_weight_in_kg",
            number: 1,
            label: 1,
            type: 1,
            jsonName: "totalWeightInKg",
          },
          {
            name: "individual_weight_in_kg",
            number: 2,
            label: 1,
            type: 1,
            jsonName: "individualWeightInKg",
          },
          { name: "amount", number: 3, label: 1, type: 5, jsonName: "amount" },
          {
            name: "export_type",
            number: 4,
            label: 1,
            type: 9,
            jsonName: "exportType",
          },
          {
            name: "export_description",
            number: 5,
            label: 1,
            type: 9,
            jsonName: "exportDescription",
          },
          {
            name: "customs_tariff_number",
            number: 6,
            label: 1,
            type: 9,
            jsonName: "customsTariffNumber",
          },
          {
            name: "invoice_number",
            number: 7,
            label: 1,
            type: 9,
            jsonName: "invoiceNumber",
          },
          {
            name: "customs_value",
            number: 8,
            label: 1,
            type: 1,
            jsonName: "customsValue",
          },
        ],
        extension: [],
        nestedType: [],
        enumType: [],
        extensionRange: [],
        oneofDecl: [],
        reservedRange: [],
        reservedName: [],
        name: "Shipments",
      },
      {
        field: [
          {
            name: "fulfillmentResults",
            number: 1,
            label: 3,
            type: 11,
            typeName: ".io.restorecommerce.order.ResponseDetailsList",
            jsonName: "fulfillmentResults",
          },
        ],
        extension: [],
        nestedType: [],
        enumType: [],
        extensionRange: [],
        oneofDecl: [],
        reservedRange: [],
        reservedName: [],
        name: "FulfillmentResults",
      },
      {
        field: [
          {
            name: "Status",
            number: 1,
            label: 1,
            type: 11,
            typeName: ".io.restorecommerce.order.OrderStatus",
            jsonName: "Status",
          },
          {
            name: "error",
            number: 2,
            label: 1,
            type: 11,
            typeName: ".io.restorecommerce.order.ErrorList",
            jsonName: "error",
          },
        ],
        extension: [],
        nestedType: [],
        enumType: [],
        extensionRange: [],
        oneofDecl: [],
        reservedRange: [],
        reservedName: [],
        name: "ResponseDetailsList",
      },
      {
        field: [
          {
            name: "OrderId",
            number: 1,
            label: 1,
            type: 9,
            jsonName: "OrderId",
          },
          {
            name: "OrderStatus",
            number: 2,
            label: 1,
            type: 9,
            jsonName: "OrderStatus",
          },
        ],
        extension: [],
        nestedType: [],
        enumType: [],
        extensionRange: [],
        oneofDecl: [],
        reservedRange: [],
        reservedName: [],
        name: "OrderStatus",
      },
      {
        field: [
          { name: "code", number: 1, label: 3, type: 9, jsonName: "code" },
          {
            name: "message",
            number: 2,
            label: 3,
            type: 9,
            jsonName: "message",
          },
        ],
        extension: [],
        nestedType: [],
        enumType: [],
        extensionRange: [],
        oneofDecl: [],
        reservedRange: [],
        reservedName: [],
        name: "ErrorList",
      },
    ],
    enumType: [],
    service: [
      {
        method: [
          {
            name: "Read",
            inputType: ".io.restorecommerce.resourcebase.ReadRequest",
            outputType: ".io.restorecommerce.order.OrderListResponse",
          },
          {
            name: "Create",
            inputType: ".io.restorecommerce.order.OrderList",
            outputType: ".io.restorecommerce.order.OrderListResponse",
          },
          {
            name: "Delete",
            inputType: ".io.restorecommerce.resourcebase.DeleteRequest",
            outputType: ".io.restorecommerce.resourcebase.DeleteResponse",
          },
          {
            name: "Update",
            inputType: ".io.restorecommerce.order.OrderList",
            outputType: ".io.restorecommerce.order.OrderListResponse",
          },
          {
            name: "Upsert",
            inputType: ".io.restorecommerce.order.OrderList",
            outputType: ".io.restorecommerce.order.OrderListResponse",
          },
          {
            name: "TriggerFulfillment",
            inputType: ".io.restorecommerce.order.OrderDataList",
            outputType: ".io.restorecommerce.order.FulfillmentResults",
          },
        ],
        name: "Service",
      },
    ],
    extension: [],
    name: "io/restorecommerce/order.proto",
    package: "io.restorecommerce.order",
    sourceCodeInfo: {
      location: [
        {
          path: [4, 3, 2, 6],
          span: [44, 2, 25],
          leadingDetachedComments: [],
          leadingComments:
            " sum of all the quantity_price will be total_price\n",
        },
        {
          path: [4, 3, 2, 7],
          span: [46, 2, 39],
          leadingDetachedComments: [],
          leadingComments: " shipping address\n",
        },
        {
          path: [4, 5, 2, 0],
          span: [58, 2, 39],
          leadingDetachedComments: [],
          leadingComments:
            " below identifier is id of product, variant or bundle\n",
        },
        {
          path: [4, 9, 2, 1],
          span: [94, 2, 37],
          leadingDetachedComments: [],
          leadingComments:
            " below properties are used for international packaging\n",
          trailingComments: " each items weight\n",
        },
        {
          path: [4, 9, 2, 2],
          span: [95, 2, 19],
          leadingDetachedComments: [],
          trailingComments: " number of items\n",
        },
      ],
    },
    syntax: "proto3",
  }),
  references: {
    ".io.restorecommerce.order.OrderList": OrderList,
    ".io.restorecommerce.order.OrderListResponse": OrderListResponse,
    ".io.restorecommerce.order.OrderResponse": OrderResponse,
    ".io.restorecommerce.order.Order": Order,
    ".io.restorecommerce.order.Items": Items,
    ".io.restorecommerce.order.Item": Item,
    ".io.restorecommerce.order.Deleted": Deleted,
    ".io.restorecommerce.order.OrderDataList": OrderDataList,
    ".io.restorecommerce.order.OrderData": OrderData,
    ".io.restorecommerce.order.Shipments": Shipments,
    ".io.restorecommerce.order.FulfillmentResults": FulfillmentResults,
    ".io.restorecommerce.order.ResponseDetailsList": ResponseDetailsList,
    ".io.restorecommerce.order.OrderStatus": OrderStatus,
    ".io.restorecommerce.order.ErrorList": ErrorList,
  },
  dependencies: [
    protoMetadata1,
    protoMetadata2,
    protoMetadata3,
    protoMetadata4,
  ],
};

declare var self: any | undefined;
declare var window: any | undefined;
var globalThis: any = (() => {
  if (typeof globalThis !== "undefined") return globalThis;
  if (typeof self !== "undefined") return self;
  if (typeof window !== "undefined") return window;
  if (typeof global !== "undefined") return global;
  throw "Unable to locate global object";
})();

type Builtin = Date | Function | Uint8Array | string | number | undefined;
export type DeepPartial<T> = T extends Builtin
  ? T
  : T extends Array<infer U>
  ? Array<DeepPartial<U>>
  : T extends ReadonlyArray<infer U>
  ? ReadonlyArray<DeepPartial<U>>
  : T extends {}
  ? { [K in keyof T]?: DeepPartial<T[K]> }
  : Partial<T>;

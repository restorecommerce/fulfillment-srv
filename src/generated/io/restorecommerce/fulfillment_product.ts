/* eslint-disable */
import Long from "long";
import * as _m0 from "protobufjs/minimal";
import { Address, Parcel } from "../../io/restorecommerce/fulfillment";
import { Subject } from "../../io/restorecommerce/auth";
import { Meta } from "../../io/restorecommerce/meta";
import { Status, OperationStatus } from "../../io/restorecommerce/status";
import { Attribute } from "../../io/restorecommerce/attribute";
import { Item } from "../../io/restorecommerce/order";
import {
  DeleteResponse,
  ReadRequest,
  DeleteRequest,
} from "../../io/restorecommerce/resource_base";

export const protobufPackage = "io.restorecommerce.fulfillment_product";

export interface Preferences {
  /** ID, name or type */
  couriers: Attribute[];
  pricing: number;
  compactness: number;
  homogeneity: number;
}

export interface Query {
  sender: Address;
  receiver: Address;
  goods: Item[];
  preferences: Preferences;
  reference_id: string;
}

export interface QueryList {
  items: Query[];
  total_count: number;
  subject: Subject;
}

export interface FulfillmentProduct {
  id: string;
  name: string;
  description: string;
  courier_id: string;
  /** repeated io.restorecommerce.country.Country start_country = 5; */
  start_zones: string[];
  /** repeated io.restorecommerce.country.Country destination_country = 7; */
  destination_zones: string[];
  tax_ids: string[];
  attributes: Attribute[];
  variants: Variant[];
  meta: Meta;
}

export interface Variant {
  id: string;
  name: string;
  description: string;
  price: number;
  max_weight: number;
  max_width: number;
  max_height: number;
  max_length: number;
  max_volume: number;
}

export interface FulfillmentProductList {
  items: FulfillmentProduct[];
  total_count: number;
  subject: Subject;
}

export interface FulfillmentProductResponse {
  payload: FulfillmentProduct;
  status: Status;
}

export interface FulfillmentProductResponseList {
  items: FulfillmentProductResponse[];
  total_count: number;
  operation_status: OperationStatus;
}

export interface PackingSolution {
  reference_id: string;
  price: number;
  compactness: number;
  homogeneity: number;
  score: number;
  parcels: Parcel[];
}

export interface PackingSolutionResponse {
  solutions: PackingSolution[];
  status: Status;
}

export interface PackingSolutionResponseList {
  items: PackingSolutionResponse[];
  total_count: number;
  operation_status: OperationStatus;
}

export interface Deleted {
  id: string;
}

function createBasePreferences(): Preferences {
  return { couriers: [], pricing: 0, compactness: 0, homogeneity: 0 };
}

export const Preferences = {
  encode(
    message: Preferences,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    for (const v of message.couriers) {
      Attribute.encode(v!, writer.uint32(10).fork()).ldelim();
    }
    if (message.pricing !== 0) {
      writer.uint32(21).float(message.pricing);
    }
    if (message.compactness !== 0) {
      writer.uint32(29).float(message.compactness);
    }
    if (message.homogeneity !== 0) {
      writer.uint32(37).float(message.homogeneity);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Preferences {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBasePreferences();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.couriers.push(Attribute.decode(reader, reader.uint32()));
          break;
        case 2:
          message.pricing = reader.float();
          break;
        case 3:
          message.compactness = reader.float();
          break;
        case 4:
          message.homogeneity = reader.float();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): Preferences {
    return {
      couriers: Array.isArray(object?.couriers)
        ? object.couriers.map((e: any) => Attribute.fromJSON(e))
        : [],
      pricing: isSet(object.pricing) ? Number(object.pricing) : 0,
      compactness: isSet(object.compactness) ? Number(object.compactness) : 0,
      homogeneity: isSet(object.homogeneity) ? Number(object.homogeneity) : 0,
    };
  },

  toJSON(message: Preferences): unknown {
    const obj: any = {};
    if (message.couriers) {
      obj.couriers = message.couriers.map((e) =>
        e ? Attribute.toJSON(e) : undefined
      );
    } else {
      obj.couriers = [];
    }
    message.pricing !== undefined && (obj.pricing = message.pricing);
    message.compactness !== undefined &&
      (obj.compactness = message.compactness);
    message.homogeneity !== undefined &&
      (obj.homogeneity = message.homogeneity);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<Preferences>, I>>(
    object: I
  ): Preferences {
    const message = createBasePreferences();
    message.couriers =
      object.couriers?.map((e) => Attribute.fromPartial(e)) || [];
    message.pricing = object.pricing ?? 0;
    message.compactness = object.compactness ?? 0;
    message.homogeneity = object.homogeneity ?? 0;
    return message;
  },
};

function createBaseQuery(): Query {
  return {
    sender: undefined,
    receiver: undefined,
    goods: [],
    preferences: undefined,
    reference_id: "",
  };
}

export const Query = {
  encode(message: Query, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.sender !== undefined) {
      Address.encode(message.sender, writer.uint32(10).fork()).ldelim();
    }
    if (message.receiver !== undefined) {
      Address.encode(message.receiver, writer.uint32(18).fork()).ldelim();
    }
    for (const v of message.goods) {
      Item.encode(v!, writer.uint32(26).fork()).ldelim();
    }
    if (message.preferences !== undefined) {
      Preferences.encode(
        message.preferences,
        writer.uint32(34).fork()
      ).ldelim();
    }
    if (message.reference_id !== "") {
      writer.uint32(42).string(message.reference_id);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Query {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseQuery();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.sender = Address.decode(reader, reader.uint32());
          break;
        case 2:
          message.receiver = Address.decode(reader, reader.uint32());
          break;
        case 3:
          message.goods.push(Item.decode(reader, reader.uint32()));
          break;
        case 4:
          message.preferences = Preferences.decode(reader, reader.uint32());
          break;
        case 5:
          message.reference_id = reader.string();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): Query {
    return {
      sender: isSet(object.sender)
        ? Address.fromJSON(object.sender)
        : undefined,
      receiver: isSet(object.receiver)
        ? Address.fromJSON(object.receiver)
        : undefined,
      goods: Array.isArray(object?.goods)
        ? object.goods.map((e: any) => Item.fromJSON(e))
        : [],
      preferences: isSet(object.preferences)
        ? Preferences.fromJSON(object.preferences)
        : undefined,
      reference_id: isSet(object.reference_id)
        ? String(object.reference_id)
        : "",
    };
  },

  toJSON(message: Query): unknown {
    const obj: any = {};
    message.sender !== undefined &&
      (obj.sender = message.sender
        ? Address.toJSON(message.sender)
        : undefined);
    message.receiver !== undefined &&
      (obj.receiver = message.receiver
        ? Address.toJSON(message.receiver)
        : undefined);
    if (message.goods) {
      obj.goods = message.goods.map((e) => (e ? Item.toJSON(e) : undefined));
    } else {
      obj.goods = [];
    }
    message.preferences !== undefined &&
      (obj.preferences = message.preferences
        ? Preferences.toJSON(message.preferences)
        : undefined);
    message.reference_id !== undefined &&
      (obj.reference_id = message.reference_id);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<Query>, I>>(object: I): Query {
    const message = createBaseQuery();
    message.sender =
      object.sender !== undefined && object.sender !== null
        ? Address.fromPartial(object.sender)
        : undefined;
    message.receiver =
      object.receiver !== undefined && object.receiver !== null
        ? Address.fromPartial(object.receiver)
        : undefined;
    message.goods = object.goods?.map((e) => Item.fromPartial(e)) || [];
    message.preferences =
      object.preferences !== undefined && object.preferences !== null
        ? Preferences.fromPartial(object.preferences)
        : undefined;
    message.reference_id = object.reference_id ?? "";
    return message;
  },
};

function createBaseQueryList(): QueryList {
  return { items: [], total_count: 0, subject: undefined };
}

export const QueryList = {
  encode(
    message: QueryList,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    for (const v of message.items) {
      Query.encode(v!, writer.uint32(10).fork()).ldelim();
    }
    if (message.total_count !== 0) {
      writer.uint32(16).uint32(message.total_count);
    }
    if (message.subject !== undefined) {
      Subject.encode(message.subject, writer.uint32(26).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): QueryList {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseQueryList();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.items.push(Query.decode(reader, reader.uint32()));
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

  fromJSON(object: any): QueryList {
    return {
      items: Array.isArray(object?.items)
        ? object.items.map((e: any) => Query.fromJSON(e))
        : [],
      total_count: isSet(object.total_count) ? Number(object.total_count) : 0,
      subject: isSet(object.subject)
        ? Subject.fromJSON(object.subject)
        : undefined,
    };
  },

  toJSON(message: QueryList): unknown {
    const obj: any = {};
    if (message.items) {
      obj.items = message.items.map((e) => (e ? Query.toJSON(e) : undefined));
    } else {
      obj.items = [];
    }
    message.total_count !== undefined &&
      (obj.total_count = Math.round(message.total_count));
    message.subject !== undefined &&
      (obj.subject = message.subject
        ? Subject.toJSON(message.subject)
        : undefined);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<QueryList>, I>>(
    object: I
  ): QueryList {
    const message = createBaseQueryList();
    message.items = object.items?.map((e) => Query.fromPartial(e)) || [];
    message.total_count = object.total_count ?? 0;
    message.subject =
      object.subject !== undefined && object.subject !== null
        ? Subject.fromPartial(object.subject)
        : undefined;
    return message;
  },
};

function createBaseFulfillmentProduct(): FulfillmentProduct {
  return {
    id: "",
    name: "",
    description: "",
    courier_id: "",
    start_zones: [],
    destination_zones: [],
    tax_ids: [],
    attributes: [],
    variants: [],
    meta: undefined,
  };
}

export const FulfillmentProduct = {
  encode(
    message: FulfillmentProduct,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.id !== "") {
      writer.uint32(10).string(message.id);
    }
    if (message.name !== "") {
      writer.uint32(18).string(message.name);
    }
    if (message.description !== "") {
      writer.uint32(26).string(message.description);
    }
    if (message.courier_id !== "") {
      writer.uint32(34).string(message.courier_id);
    }
    for (const v of message.start_zones) {
      writer.uint32(50).string(v!);
    }
    for (const v of message.destination_zones) {
      writer.uint32(66).string(v!);
    }
    for (const v of message.tax_ids) {
      writer.uint32(74).string(v!);
    }
    for (const v of message.attributes) {
      Attribute.encode(v!, writer.uint32(82).fork()).ldelim();
    }
    for (const v of message.variants) {
      Variant.encode(v!, writer.uint32(90).fork()).ldelim();
    }
    if (message.meta !== undefined) {
      Meta.encode(message.meta, writer.uint32(98).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): FulfillmentProduct {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseFulfillmentProduct();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.id = reader.string();
          break;
        case 2:
          message.name = reader.string();
          break;
        case 3:
          message.description = reader.string();
          break;
        case 4:
          message.courier_id = reader.string();
          break;
        case 6:
          message.start_zones.push(reader.string());
          break;
        case 8:
          message.destination_zones.push(reader.string());
          break;
        case 9:
          message.tax_ids.push(reader.string());
          break;
        case 10:
          message.attributes.push(Attribute.decode(reader, reader.uint32()));
          break;
        case 11:
          message.variants.push(Variant.decode(reader, reader.uint32()));
          break;
        case 12:
          message.meta = Meta.decode(reader, reader.uint32());
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): FulfillmentProduct {
    return {
      id: isSet(object.id) ? String(object.id) : "",
      name: isSet(object.name) ? String(object.name) : "",
      description: isSet(object.description) ? String(object.description) : "",
      courier_id: isSet(object.courier_id) ? String(object.courier_id) : "",
      start_zones: Array.isArray(object?.start_zones)
        ? object.start_zones.map((e: any) => String(e))
        : [],
      destination_zones: Array.isArray(object?.destination_zones)
        ? object.destination_zones.map((e: any) => String(e))
        : [],
      tax_ids: Array.isArray(object?.tax_ids)
        ? object.tax_ids.map((e: any) => String(e))
        : [],
      attributes: Array.isArray(object?.attributes)
        ? object.attributes.map((e: any) => Attribute.fromJSON(e))
        : [],
      variants: Array.isArray(object?.variants)
        ? object.variants.map((e: any) => Variant.fromJSON(e))
        : [],
      meta: isSet(object.meta) ? Meta.fromJSON(object.meta) : undefined,
    };
  },

  toJSON(message: FulfillmentProduct): unknown {
    const obj: any = {};
    message.id !== undefined && (obj.id = message.id);
    message.name !== undefined && (obj.name = message.name);
    message.description !== undefined &&
      (obj.description = message.description);
    message.courier_id !== undefined && (obj.courier_id = message.courier_id);
    if (message.start_zones) {
      obj.start_zones = message.start_zones.map((e) => e);
    } else {
      obj.start_zones = [];
    }
    if (message.destination_zones) {
      obj.destination_zones = message.destination_zones.map((e) => e);
    } else {
      obj.destination_zones = [];
    }
    if (message.tax_ids) {
      obj.tax_ids = message.tax_ids.map((e) => e);
    } else {
      obj.tax_ids = [];
    }
    if (message.attributes) {
      obj.attributes = message.attributes.map((e) =>
        e ? Attribute.toJSON(e) : undefined
      );
    } else {
      obj.attributes = [];
    }
    if (message.variants) {
      obj.variants = message.variants.map((e) =>
        e ? Variant.toJSON(e) : undefined
      );
    } else {
      obj.variants = [];
    }
    message.meta !== undefined &&
      (obj.meta = message.meta ? Meta.toJSON(message.meta) : undefined);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<FulfillmentProduct>, I>>(
    object: I
  ): FulfillmentProduct {
    const message = createBaseFulfillmentProduct();
    message.id = object.id ?? "";
    message.name = object.name ?? "";
    message.description = object.description ?? "";
    message.courier_id = object.courier_id ?? "";
    message.start_zones = object.start_zones?.map((e) => e) || [];
    message.destination_zones = object.destination_zones?.map((e) => e) || [];
    message.tax_ids = object.tax_ids?.map((e) => e) || [];
    message.attributes =
      object.attributes?.map((e) => Attribute.fromPartial(e)) || [];
    message.variants =
      object.variants?.map((e) => Variant.fromPartial(e)) || [];
    message.meta =
      object.meta !== undefined && object.meta !== null
        ? Meta.fromPartial(object.meta)
        : undefined;
    return message;
  },
};

function createBaseVariant(): Variant {
  return {
    id: "",
    name: "",
    description: "",
    price: 0,
    max_weight: 0,
    max_width: 0,
    max_height: 0,
    max_length: 0,
    max_volume: 0,
  };
}

export const Variant = {
  encode(
    message: Variant,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.id !== "") {
      writer.uint32(10).string(message.id);
    }
    if (message.name !== "") {
      writer.uint32(18).string(message.name);
    }
    if (message.description !== "") {
      writer.uint32(26).string(message.description);
    }
    if (message.price !== 0) {
      writer.uint32(33).double(message.price);
    }
    if (message.max_weight !== 0) {
      writer.uint32(41).double(message.max_weight);
    }
    if (message.max_width !== 0) {
      writer.uint32(49).double(message.max_width);
    }
    if (message.max_height !== 0) {
      writer.uint32(57).double(message.max_height);
    }
    if (message.max_length !== 0) {
      writer.uint32(65).double(message.max_length);
    }
    if (message.max_volume !== 0) {
      writer.uint32(73).double(message.max_volume);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Variant {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseVariant();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.id = reader.string();
          break;
        case 2:
          message.name = reader.string();
          break;
        case 3:
          message.description = reader.string();
          break;
        case 4:
          message.price = reader.double();
          break;
        case 5:
          message.max_weight = reader.double();
          break;
        case 6:
          message.max_width = reader.double();
          break;
        case 7:
          message.max_height = reader.double();
          break;
        case 8:
          message.max_length = reader.double();
          break;
        case 9:
          message.max_volume = reader.double();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): Variant {
    return {
      id: isSet(object.id) ? String(object.id) : "",
      name: isSet(object.name) ? String(object.name) : "",
      description: isSet(object.description) ? String(object.description) : "",
      price: isSet(object.price) ? Number(object.price) : 0,
      max_weight: isSet(object.max_weight) ? Number(object.max_weight) : 0,
      max_width: isSet(object.max_width) ? Number(object.max_width) : 0,
      max_height: isSet(object.max_height) ? Number(object.max_height) : 0,
      max_length: isSet(object.max_length) ? Number(object.max_length) : 0,
      max_volume: isSet(object.max_volume) ? Number(object.max_volume) : 0,
    };
  },

  toJSON(message: Variant): unknown {
    const obj: any = {};
    message.id !== undefined && (obj.id = message.id);
    message.name !== undefined && (obj.name = message.name);
    message.description !== undefined &&
      (obj.description = message.description);
    message.price !== undefined && (obj.price = message.price);
    message.max_weight !== undefined && (obj.max_weight = message.max_weight);
    message.max_width !== undefined && (obj.max_width = message.max_width);
    message.max_height !== undefined && (obj.max_height = message.max_height);
    message.max_length !== undefined && (obj.max_length = message.max_length);
    message.max_volume !== undefined && (obj.max_volume = message.max_volume);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<Variant>, I>>(object: I): Variant {
    const message = createBaseVariant();
    message.id = object.id ?? "";
    message.name = object.name ?? "";
    message.description = object.description ?? "";
    message.price = object.price ?? 0;
    message.max_weight = object.max_weight ?? 0;
    message.max_width = object.max_width ?? 0;
    message.max_height = object.max_height ?? 0;
    message.max_length = object.max_length ?? 0;
    message.max_volume = object.max_volume ?? 0;
    return message;
  },
};

function createBaseFulfillmentProductList(): FulfillmentProductList {
  return { items: [], total_count: 0, subject: undefined };
}

export const FulfillmentProductList = {
  encode(
    message: FulfillmentProductList,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    for (const v of message.items) {
      FulfillmentProduct.encode(v!, writer.uint32(10).fork()).ldelim();
    }
    if (message.total_count !== 0) {
      writer.uint32(16).uint32(message.total_count);
    }
    if (message.subject !== undefined) {
      Subject.encode(message.subject, writer.uint32(26).fork()).ldelim();
    }
    return writer;
  },

  decode(
    input: _m0.Reader | Uint8Array,
    length?: number
  ): FulfillmentProductList {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseFulfillmentProductList();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.items.push(
            FulfillmentProduct.decode(reader, reader.uint32())
          );
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

  fromJSON(object: any): FulfillmentProductList {
    return {
      items: Array.isArray(object?.items)
        ? object.items.map((e: any) => FulfillmentProduct.fromJSON(e))
        : [],
      total_count: isSet(object.total_count) ? Number(object.total_count) : 0,
      subject: isSet(object.subject)
        ? Subject.fromJSON(object.subject)
        : undefined,
    };
  },

  toJSON(message: FulfillmentProductList): unknown {
    const obj: any = {};
    if (message.items) {
      obj.items = message.items.map((e) =>
        e ? FulfillmentProduct.toJSON(e) : undefined
      );
    } else {
      obj.items = [];
    }
    message.total_count !== undefined &&
      (obj.total_count = Math.round(message.total_count));
    message.subject !== undefined &&
      (obj.subject = message.subject
        ? Subject.toJSON(message.subject)
        : undefined);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<FulfillmentProductList>, I>>(
    object: I
  ): FulfillmentProductList {
    const message = createBaseFulfillmentProductList();
    message.items =
      object.items?.map((e) => FulfillmentProduct.fromPartial(e)) || [];
    message.total_count = object.total_count ?? 0;
    message.subject =
      object.subject !== undefined && object.subject !== null
        ? Subject.fromPartial(object.subject)
        : undefined;
    return message;
  },
};

function createBaseFulfillmentProductResponse(): FulfillmentProductResponse {
  return { payload: undefined, status: undefined };
}

export const FulfillmentProductResponse = {
  encode(
    message: FulfillmentProductResponse,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.payload !== undefined) {
      FulfillmentProduct.encode(
        message.payload,
        writer.uint32(10).fork()
      ).ldelim();
    }
    if (message.status !== undefined) {
      Status.encode(message.status, writer.uint32(18).fork()).ldelim();
    }
    return writer;
  },

  decode(
    input: _m0.Reader | Uint8Array,
    length?: number
  ): FulfillmentProductResponse {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseFulfillmentProductResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.payload = FulfillmentProduct.decode(reader, reader.uint32());
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

  fromJSON(object: any): FulfillmentProductResponse {
    return {
      payload: isSet(object.payload)
        ? FulfillmentProduct.fromJSON(object.payload)
        : undefined,
      status: isSet(object.status) ? Status.fromJSON(object.status) : undefined,
    };
  },

  toJSON(message: FulfillmentProductResponse): unknown {
    const obj: any = {};
    message.payload !== undefined &&
      (obj.payload = message.payload
        ? FulfillmentProduct.toJSON(message.payload)
        : undefined);
    message.status !== undefined &&
      (obj.status = message.status ? Status.toJSON(message.status) : undefined);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<FulfillmentProductResponse>, I>>(
    object: I
  ): FulfillmentProductResponse {
    const message = createBaseFulfillmentProductResponse();
    message.payload =
      object.payload !== undefined && object.payload !== null
        ? FulfillmentProduct.fromPartial(object.payload)
        : undefined;
    message.status =
      object.status !== undefined && object.status !== null
        ? Status.fromPartial(object.status)
        : undefined;
    return message;
  },
};

function createBaseFulfillmentProductResponseList(): FulfillmentProductResponseList {
  return { items: [], total_count: 0, operation_status: undefined };
}

export const FulfillmentProductResponseList = {
  encode(
    message: FulfillmentProductResponseList,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    for (const v of message.items) {
      FulfillmentProductResponse.encode(v!, writer.uint32(10).fork()).ldelim();
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

  decode(
    input: _m0.Reader | Uint8Array,
    length?: number
  ): FulfillmentProductResponseList {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseFulfillmentProductResponseList();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.items.push(
            FulfillmentProductResponse.decode(reader, reader.uint32())
          );
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

  fromJSON(object: any): FulfillmentProductResponseList {
    return {
      items: Array.isArray(object?.items)
        ? object.items.map((e: any) => FulfillmentProductResponse.fromJSON(e))
        : [],
      total_count: isSet(object.total_count) ? Number(object.total_count) : 0,
      operation_status: isSet(object.operation_status)
        ? OperationStatus.fromJSON(object.operation_status)
        : undefined,
    };
  },

  toJSON(message: FulfillmentProductResponseList): unknown {
    const obj: any = {};
    if (message.items) {
      obj.items = message.items.map((e) =>
        e ? FulfillmentProductResponse.toJSON(e) : undefined
      );
    } else {
      obj.items = [];
    }
    message.total_count !== undefined &&
      (obj.total_count = Math.round(message.total_count));
    message.operation_status !== undefined &&
      (obj.operation_status = message.operation_status
        ? OperationStatus.toJSON(message.operation_status)
        : undefined);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<FulfillmentProductResponseList>, I>>(
    object: I
  ): FulfillmentProductResponseList {
    const message = createBaseFulfillmentProductResponseList();
    message.items =
      object.items?.map((e) => FulfillmentProductResponse.fromPartial(e)) || [];
    message.total_count = object.total_count ?? 0;
    message.operation_status =
      object.operation_status !== undefined && object.operation_status !== null
        ? OperationStatus.fromPartial(object.operation_status)
        : undefined;
    return message;
  },
};

function createBasePackingSolution(): PackingSolution {
  return {
    reference_id: "",
    price: 0,
    compactness: 0,
    homogeneity: 0,
    score: 0,
    parcels: [],
  };
}

export const PackingSolution = {
  encode(
    message: PackingSolution,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.reference_id !== "") {
      writer.uint32(10).string(message.reference_id);
    }
    if (message.price !== 0) {
      writer.uint32(21).float(message.price);
    }
    if (message.compactness !== 0) {
      writer.uint32(29).float(message.compactness);
    }
    if (message.homogeneity !== 0) {
      writer.uint32(37).float(message.homogeneity);
    }
    if (message.score !== 0) {
      writer.uint32(45).float(message.score);
    }
    for (const v of message.parcels) {
      Parcel.encode(v!, writer.uint32(50).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): PackingSolution {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBasePackingSolution();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.reference_id = reader.string();
          break;
        case 2:
          message.price = reader.float();
          break;
        case 3:
          message.compactness = reader.float();
          break;
        case 4:
          message.homogeneity = reader.float();
          break;
        case 5:
          message.score = reader.float();
          break;
        case 6:
          message.parcels.push(Parcel.decode(reader, reader.uint32()));
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): PackingSolution {
    return {
      reference_id: isSet(object.reference_id)
        ? String(object.reference_id)
        : "",
      price: isSet(object.price) ? Number(object.price) : 0,
      compactness: isSet(object.compactness) ? Number(object.compactness) : 0,
      homogeneity: isSet(object.homogeneity) ? Number(object.homogeneity) : 0,
      score: isSet(object.score) ? Number(object.score) : 0,
      parcels: Array.isArray(object?.parcels)
        ? object.parcels.map((e: any) => Parcel.fromJSON(e))
        : [],
    };
  },

  toJSON(message: PackingSolution): unknown {
    const obj: any = {};
    message.reference_id !== undefined &&
      (obj.reference_id = message.reference_id);
    message.price !== undefined && (obj.price = message.price);
    message.compactness !== undefined &&
      (obj.compactness = message.compactness);
    message.homogeneity !== undefined &&
      (obj.homogeneity = message.homogeneity);
    message.score !== undefined && (obj.score = message.score);
    if (message.parcels) {
      obj.parcels = message.parcels.map((e) =>
        e ? Parcel.toJSON(e) : undefined
      );
    } else {
      obj.parcels = [];
    }
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<PackingSolution>, I>>(
    object: I
  ): PackingSolution {
    const message = createBasePackingSolution();
    message.reference_id = object.reference_id ?? "";
    message.price = object.price ?? 0;
    message.compactness = object.compactness ?? 0;
    message.homogeneity = object.homogeneity ?? 0;
    message.score = object.score ?? 0;
    message.parcels = object.parcels?.map((e) => Parcel.fromPartial(e)) || [];
    return message;
  },
};

function createBasePackingSolutionResponse(): PackingSolutionResponse {
  return { solutions: [], status: undefined };
}

export const PackingSolutionResponse = {
  encode(
    message: PackingSolutionResponse,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    for (const v of message.solutions) {
      PackingSolution.encode(v!, writer.uint32(10).fork()).ldelim();
    }
    if (message.status !== undefined) {
      Status.encode(message.status, writer.uint32(18).fork()).ldelim();
    }
    return writer;
  },

  decode(
    input: _m0.Reader | Uint8Array,
    length?: number
  ): PackingSolutionResponse {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBasePackingSolutionResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.solutions.push(
            PackingSolution.decode(reader, reader.uint32())
          );
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

  fromJSON(object: any): PackingSolutionResponse {
    return {
      solutions: Array.isArray(object?.solutions)
        ? object.solutions.map((e: any) => PackingSolution.fromJSON(e))
        : [],
      status: isSet(object.status) ? Status.fromJSON(object.status) : undefined,
    };
  },

  toJSON(message: PackingSolutionResponse): unknown {
    const obj: any = {};
    if (message.solutions) {
      obj.solutions = message.solutions.map((e) =>
        e ? PackingSolution.toJSON(e) : undefined
      );
    } else {
      obj.solutions = [];
    }
    message.status !== undefined &&
      (obj.status = message.status ? Status.toJSON(message.status) : undefined);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<PackingSolutionResponse>, I>>(
    object: I
  ): PackingSolutionResponse {
    const message = createBasePackingSolutionResponse();
    message.solutions =
      object.solutions?.map((e) => PackingSolution.fromPartial(e)) || [];
    message.status =
      object.status !== undefined && object.status !== null
        ? Status.fromPartial(object.status)
        : undefined;
    return message;
  },
};

function createBasePackingSolutionResponseList(): PackingSolutionResponseList {
  return { items: [], total_count: 0, operation_status: undefined };
}

export const PackingSolutionResponseList = {
  encode(
    message: PackingSolutionResponseList,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    for (const v of message.items) {
      PackingSolutionResponse.encode(v!, writer.uint32(10).fork()).ldelim();
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

  decode(
    input: _m0.Reader | Uint8Array,
    length?: number
  ): PackingSolutionResponseList {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBasePackingSolutionResponseList();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.items.push(
            PackingSolutionResponse.decode(reader, reader.uint32())
          );
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

  fromJSON(object: any): PackingSolutionResponseList {
    return {
      items: Array.isArray(object?.items)
        ? object.items.map((e: any) => PackingSolutionResponse.fromJSON(e))
        : [],
      total_count: isSet(object.total_count) ? Number(object.total_count) : 0,
      operation_status: isSet(object.operation_status)
        ? OperationStatus.fromJSON(object.operation_status)
        : undefined,
    };
  },

  toJSON(message: PackingSolutionResponseList): unknown {
    const obj: any = {};
    if (message.items) {
      obj.items = message.items.map((e) =>
        e ? PackingSolutionResponse.toJSON(e) : undefined
      );
    } else {
      obj.items = [];
    }
    message.total_count !== undefined &&
      (obj.total_count = Math.round(message.total_count));
    message.operation_status !== undefined &&
      (obj.operation_status = message.operation_status
        ? OperationStatus.toJSON(message.operation_status)
        : undefined);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<PackingSolutionResponseList>, I>>(
    object: I
  ): PackingSolutionResponseList {
    const message = createBasePackingSolutionResponseList();
    message.items =
      object.items?.map((e) => PackingSolutionResponse.fromPartial(e)) || [];
    message.total_count = object.total_count ?? 0;
    message.operation_status =
      object.operation_status !== undefined && object.operation_status !== null
        ? OperationStatus.fromPartial(object.operation_status)
        : undefined;
    return message;
  },
};

function createBaseDeleted(): Deleted {
  return { id: "" };
}

export const Deleted = {
  encode(
    message: Deleted,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.id !== "") {
      writer.uint32(10).string(message.id);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Deleted {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseDeleted();
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
    return {
      id: isSet(object.id) ? String(object.id) : "",
    };
  },

  toJSON(message: Deleted): unknown {
    const obj: any = {};
    message.id !== undefined && (obj.id = message.id);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<Deleted>, I>>(object: I): Deleted {
    const message = createBaseDeleted();
    message.id = object.id ?? "";
    return message;
  },
};

export interface Service {
  Read(request: ReadRequest): Promise<FulfillmentProductResponseList>;
  Find(request: QueryList): Promise<PackingSolutionResponseList>;
  Create(
    request: FulfillmentProductList
  ): Promise<FulfillmentProductResponseList>;
  Update(
    request: FulfillmentProductList
  ): Promise<FulfillmentProductResponseList>;
  Upsert(
    request: FulfillmentProductList
  ): Promise<FulfillmentProductResponseList>;
  Delete(request: DeleteRequest): Promise<DeleteResponse>;
}

type Builtin =
  | Date
  | Function
  | Uint8Array
  | string
  | number
  | boolean
  | undefined;

export type DeepPartial<T> = T extends Builtin
  ? T
  : T extends Array<infer U>
  ? Array<DeepPartial<U>>
  : T extends ReadonlyArray<infer U>
  ? ReadonlyArray<DeepPartial<U>>
  : T extends {}
  ? { [K in keyof T]?: DeepPartial<T[K]> }
  : Partial<T>;

type KeysOfUnion<T> = T extends T ? keyof T : never;
export type Exact<P, I extends P> = P extends Builtin
  ? P
  : P & { [K in keyof P]: Exact<P[K], I[K]> } & Record<
        Exclude<keyof I, KeysOfUnion<P>>,
        never
      >;

if (_m0.util.Long !== Long) {
  _m0.util.Long = Long as any;
  _m0.configure();
}

function isSet(value: any): boolean {
  return value !== null && value !== undefined;
}
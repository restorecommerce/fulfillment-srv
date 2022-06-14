/* eslint-disable */
import * as Long from "long";
import * as _m0 from "protobufjs/minimal";
import { Country } from "../../io/restorecommerce/country";
import { Status, OperationStatus } from "../../io/restorecommerce/status";
import { Meta } from "../../io/restorecommerce/meta";
import { Subject } from "../../io/restorecommerce/auth";
import { Any } from "../../google/protobuf/any";
import { Address as Address1 } from "../../io/restorecommerce/address";
import {
  DeleteResponse,
  ReadRequest,
  DeleteRequest,
} from "../../io/restorecommerce/resource_base";

export const protobufPackage = "io.restorecommerce.fulfillment";

export enum State {
  Undefined = 0,
  Invalid = 1,
  Ordered = 2,
  Shipping = 3,
  Done = 4,
  Cancelled = 5,
  Failed = 6,
  UNRECOGNIZED = -1,
}

export function stateFromJSON(object: any): State {
  switch (object) {
    case 0:
    case "Undefined":
      return State.Undefined;
    case 1:
    case "Invalid":
      return State.Invalid;
    case 2:
    case "Ordered":
      return State.Ordered;
    case 3:
    case "Shipping":
      return State.Shipping;
    case 4:
    case "Done":
      return State.Done;
    case 5:
    case "Cancelled":
      return State.Cancelled;
    case 6:
    case "Failed":
      return State.Failed;
    case -1:
    case "UNRECOGNIZED":
    default:
      return State.UNRECOGNIZED;
  }
}

export function stateToJSON(object: State): string {
  switch (object) {
    case State.Undefined:
      return "Undefined";
    case State.Invalid:
      return "Invalid";
    case State.Ordered:
      return "Ordered";
    case State.Shipping:
      return "Shipping";
    case State.Done:
      return "Done";
    case State.Cancelled:
      return "Cancelled";
    case State.Failed:
      return "Failed";
    case State.UNRECOGNIZED:
    default:
      return "UNRECOGNIZED";
  }
}

export interface Contact {
  name: string;
  email: string;
  phone: string;
}

export interface Branch {
  provider: string;
  branchNumber: string;
  postNumber: string;
}

export interface Packstation {
  provider: string;
  stationNumber: string;
  postNumber: string;
}

export interface Address {
  title: string;
  name: string[];
  address: Address1 | undefined;
  packstation: Packstation | undefined;
  branch: Branch | undefined;
  country: Country;
  contact: Contact;
}

export interface Parcel {
  productId: string;
  productVariantId: string;
  items: Parcel_Item[];
  weightInKg: number;
  heightInCm: number;
  widthInCm: number;
  lengthInCm: number;
}

export interface Parcel_Item {
  itemId: string;
  quantity: number;
}

export interface Order {
  referenceId: string;
  parcels: Parcel[];
  sender: Address;
  receiver: Address;
  notify: string;
}

export interface Label {
  url: string | undefined;
  pdf: string | undefined;
  png: string | undefined;
  /** filled on Order */
  shipmentNumber: string;
  /** update by Track */
  state: State;
  /** API status */
  status: Status;
}

export interface FulfillmentRequest {
  id: string;
  order: Order;
  meta: Meta;
}

export interface FulfillmentRequestList {
  items: FulfillmentRequest[];
  totalCount: number;
  subject: Subject;
}

/** This is the message how it get stored to the database */
export interface Fulfillment {
  id: string;
  order: Order;
  meta: Meta;
  /** filled by service */
  labels: Label[];
  fulfilled: boolean;
}

export interface FulfillmentResponse {
  payload: Fulfillment;
  status: Status;
}

export interface FulfillmentResponseList {
  items: FulfillmentResponse[];
  totalCount: number;
  operationStatus: OperationStatus;
}

export interface TrackingRequest {
  fulfillmentId: string;
  /** optional */
  shipmentNumbers: string[];
  options: Any;
}

export interface TrackingRequestList {
  items: TrackingRequest[];
  subject: Subject;
}

export interface Event {
  timestamp: number;
  location: string;
  details: Any;
  status: Status;
}

export interface Tracking {
  shipmentNumber: string;
  events: Event[];
  details: Any;
  status: Status;
}

export interface TrackingResult {
  fulfillment: Fulfillment;
  tracks: Tracking[];
  status: Status;
}

export interface TrackingResultList {
  items: TrackingResult[];
  operationStatus: OperationStatus;
}

export interface CancelRequestList {
  ids: string[];
  subject: Subject;
}

export interface Deleted {
  id: string;
}

function createBaseContact(): Contact {
  return { name: "", email: "", phone: "" };
}

export const Contact = {
  encode(
    message: Contact,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.name !== "") {
      writer.uint32(10).string(message.name);
    }
    if (message.email !== "") {
      writer.uint32(18).string(message.email);
    }
    if (message.phone !== "") {
      writer.uint32(26).string(message.phone);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Contact {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseContact();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.name = reader.string();
          break;
        case 2:
          message.email = reader.string();
          break;
        case 3:
          message.phone = reader.string();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): Contact {
    return {
      name: isSet(object.name) ? String(object.name) : "",
      email: isSet(object.email) ? String(object.email) : "",
      phone: isSet(object.phone) ? String(object.phone) : "",
    };
  },

  toJSON(message: Contact): unknown {
    const obj: any = {};
    message.name !== undefined && (obj.name = message.name);
    message.email !== undefined && (obj.email = message.email);
    message.phone !== undefined && (obj.phone = message.phone);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<Contact>, I>>(object: I): Contact {
    const message = createBaseContact();
    message.name = object.name ?? "";
    message.email = object.email ?? "";
    message.phone = object.phone ?? "";
    return message;
  },
};

function createBaseBranch(): Branch {
  return { provider: "", branchNumber: "", postNumber: "" };
}

export const Branch = {
  encode(
    message: Branch,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.provider !== "") {
      writer.uint32(10).string(message.provider);
    }
    if (message.branchNumber !== "") {
      writer.uint32(18).string(message.branchNumber);
    }
    if (message.postNumber !== "") {
      writer.uint32(26).string(message.postNumber);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Branch {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseBranch();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.provider = reader.string();
          break;
        case 2:
          message.branchNumber = reader.string();
          break;
        case 3:
          message.postNumber = reader.string();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): Branch {
    return {
      provider: isSet(object.provider) ? String(object.provider) : "",
      branchNumber: isSet(object.branchNumber)
        ? String(object.branchNumber)
        : "",
      postNumber: isSet(object.postNumber) ? String(object.postNumber) : "",
    };
  },

  toJSON(message: Branch): unknown {
    const obj: any = {};
    message.provider !== undefined && (obj.provider = message.provider);
    message.branchNumber !== undefined &&
      (obj.branchNumber = message.branchNumber);
    message.postNumber !== undefined && (obj.postNumber = message.postNumber);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<Branch>, I>>(object: I): Branch {
    const message = createBaseBranch();
    message.provider = object.provider ?? "";
    message.branchNumber = object.branchNumber ?? "";
    message.postNumber = object.postNumber ?? "";
    return message;
  },
};

function createBasePackstation(): Packstation {
  return { provider: "", stationNumber: "", postNumber: "" };
}

export const Packstation = {
  encode(
    message: Packstation,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.provider !== "") {
      writer.uint32(10).string(message.provider);
    }
    if (message.stationNumber !== "") {
      writer.uint32(18).string(message.stationNumber);
    }
    if (message.postNumber !== "") {
      writer.uint32(26).string(message.postNumber);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Packstation {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBasePackstation();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.provider = reader.string();
          break;
        case 2:
          message.stationNumber = reader.string();
          break;
        case 3:
          message.postNumber = reader.string();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): Packstation {
    return {
      provider: isSet(object.provider) ? String(object.provider) : "",
      stationNumber: isSet(object.stationNumber)
        ? String(object.stationNumber)
        : "",
      postNumber: isSet(object.postNumber) ? String(object.postNumber) : "",
    };
  },

  toJSON(message: Packstation): unknown {
    const obj: any = {};
    message.provider !== undefined && (obj.provider = message.provider);
    message.stationNumber !== undefined &&
      (obj.stationNumber = message.stationNumber);
    message.postNumber !== undefined && (obj.postNumber = message.postNumber);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<Packstation>, I>>(
    object: I
  ): Packstation {
    const message = createBasePackstation();
    message.provider = object.provider ?? "";
    message.stationNumber = object.stationNumber ?? "";
    message.postNumber = object.postNumber ?? "";
    return message;
  },
};

function createBaseAddress(): Address {
  return {
    title: "",
    name: [],
    address: undefined,
    packstation: undefined,
    branch: undefined,
    country: undefined,
    contact: undefined,
  };
}

export const Address = {
  encode(
    message: Address,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.title !== "") {
      writer.uint32(10).string(message.title);
    }
    for (const v of message.name) {
      writer.uint32(18).string(v!);
    }
    if (message.address !== undefined) {
      Address1.encode(message.address, writer.uint32(26).fork()).ldelim();
    }
    if (message.packstation !== undefined) {
      Packstation.encode(
        message.packstation,
        writer.uint32(34).fork()
      ).ldelim();
    }
    if (message.branch !== undefined) {
      Branch.encode(message.branch, writer.uint32(42).fork()).ldelim();
    }
    if (message.country !== undefined) {
      Country.encode(message.country, writer.uint32(50).fork()).ldelim();
    }
    if (message.contact !== undefined) {
      Contact.encode(message.contact, writer.uint32(58).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Address {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseAddress();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.title = reader.string();
          break;
        case 2:
          message.name.push(reader.string());
          break;
        case 3:
          message.address = Address1.decode(reader, reader.uint32());
          break;
        case 4:
          message.packstation = Packstation.decode(reader, reader.uint32());
          break;
        case 5:
          message.branch = Branch.decode(reader, reader.uint32());
          break;
        case 6:
          message.country = Country.decode(reader, reader.uint32());
          break;
        case 7:
          message.contact = Contact.decode(reader, reader.uint32());
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): Address {
    return {
      title: isSet(object.title) ? String(object.title) : "",
      name: Array.isArray(object?.name)
        ? object.name.map((e: any) => String(e))
        : [],
      address: isSet(object.address)
        ? Address1.fromJSON(object.address)
        : undefined,
      packstation: isSet(object.packstation)
        ? Packstation.fromJSON(object.packstation)
        : undefined,
      branch: isSet(object.branch) ? Branch.fromJSON(object.branch) : undefined,
      country: isSet(object.country)
        ? Country.fromJSON(object.country)
        : undefined,
      contact: isSet(object.contact)
        ? Contact.fromJSON(object.contact)
        : undefined,
    };
  },

  toJSON(message: Address): unknown {
    const obj: any = {};
    message.title !== undefined && (obj.title = message.title);
    if (message.name) {
      obj.name = message.name.map((e) => e);
    } else {
      obj.name = [];
    }
    message.address !== undefined &&
      (obj.address = message.address
        ? Address1.toJSON(message.address)
        : undefined);
    message.packstation !== undefined &&
      (obj.packstation = message.packstation
        ? Packstation.toJSON(message.packstation)
        : undefined);
    message.branch !== undefined &&
      (obj.branch = message.branch ? Branch.toJSON(message.branch) : undefined);
    message.country !== undefined &&
      (obj.country = message.country
        ? Country.toJSON(message.country)
        : undefined);
    message.contact !== undefined &&
      (obj.contact = message.contact
        ? Contact.toJSON(message.contact)
        : undefined);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<Address>, I>>(object: I): Address {
    const message = createBaseAddress();
    message.title = object.title ?? "";
    message.name = object.name?.map((e) => e) || [];
    message.address =
      object.address !== undefined && object.address !== null
        ? Address1.fromPartial(object.address)
        : undefined;
    message.packstation =
      object.packstation !== undefined && object.packstation !== null
        ? Packstation.fromPartial(object.packstation)
        : undefined;
    message.branch =
      object.branch !== undefined && object.branch !== null
        ? Branch.fromPartial(object.branch)
        : undefined;
    message.country =
      object.country !== undefined && object.country !== null
        ? Country.fromPartial(object.country)
        : undefined;
    message.contact =
      object.contact !== undefined && object.contact !== null
        ? Contact.fromPartial(object.contact)
        : undefined;
    return message;
  },
};

function createBaseParcel(): Parcel {
  return {
    productId: "",
    productVariantId: "",
    items: [],
    weightInKg: 0,
    heightInCm: 0,
    widthInCm: 0,
    lengthInCm: 0,
  };
}

export const Parcel = {
  encode(
    message: Parcel,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.productId !== "") {
      writer.uint32(10).string(message.productId);
    }
    if (message.productVariantId !== "") {
      writer.uint32(18).string(message.productVariantId);
    }
    for (const v of message.items) {
      Parcel_Item.encode(v!, writer.uint32(26).fork()).ldelim();
    }
    if (message.weightInKg !== 0) {
      writer.uint32(37).float(message.weightInKg);
    }
    if (message.heightInCm !== 0) {
      writer.uint32(45).float(message.heightInCm);
    }
    if (message.widthInCm !== 0) {
      writer.uint32(53).float(message.widthInCm);
    }
    if (message.lengthInCm !== 0) {
      writer.uint32(61).float(message.lengthInCm);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Parcel {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseParcel();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.productId = reader.string();
          break;
        case 2:
          message.productVariantId = reader.string();
          break;
        case 3:
          message.items.push(Parcel_Item.decode(reader, reader.uint32()));
          break;
        case 4:
          message.weightInKg = reader.float();
          break;
        case 5:
          message.heightInCm = reader.float();
          break;
        case 6:
          message.widthInCm = reader.float();
          break;
        case 7:
          message.lengthInCm = reader.float();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): Parcel {
    return {
      productId: isSet(object.productId) ? String(object.productId) : "",
      productVariantId: isSet(object.productVariantId)
        ? String(object.productVariantId)
        : "",
      items: Array.isArray(object?.items)
        ? object.items.map((e: any) => Parcel_Item.fromJSON(e))
        : [],
      weightInKg: isSet(object.weightInKg) ? Number(object.weightInKg) : 0,
      heightInCm: isSet(object.heightInCm) ? Number(object.heightInCm) : 0,
      widthInCm: isSet(object.widthInCm) ? Number(object.widthInCm) : 0,
      lengthInCm: isSet(object.lengthInCm) ? Number(object.lengthInCm) : 0,
    };
  },

  toJSON(message: Parcel): unknown {
    const obj: any = {};
    message.productId !== undefined && (obj.productId = message.productId);
    message.productVariantId !== undefined &&
      (obj.productVariantId = message.productVariantId);
    if (message.items) {
      obj.items = message.items.map((e) =>
        e ? Parcel_Item.toJSON(e) : undefined
      );
    } else {
      obj.items = [];
    }
    message.weightInKg !== undefined && (obj.weightInKg = message.weightInKg);
    message.heightInCm !== undefined && (obj.heightInCm = message.heightInCm);
    message.widthInCm !== undefined && (obj.widthInCm = message.widthInCm);
    message.lengthInCm !== undefined && (obj.lengthInCm = message.lengthInCm);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<Parcel>, I>>(object: I): Parcel {
    const message = createBaseParcel();
    message.productId = object.productId ?? "";
    message.productVariantId = object.productVariantId ?? "";
    message.items = object.items?.map((e) => Parcel_Item.fromPartial(e)) || [];
    message.weightInKg = object.weightInKg ?? 0;
    message.heightInCm = object.heightInCm ?? 0;
    message.widthInCm = object.widthInCm ?? 0;
    message.lengthInCm = object.lengthInCm ?? 0;
    return message;
  },
};

function createBaseParcel_Item(): Parcel_Item {
  return { itemId: "", quantity: 0 };
}

export const Parcel_Item = {
  encode(
    message: Parcel_Item,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.itemId !== "") {
      writer.uint32(10).string(message.itemId);
    }
    if (message.quantity !== 0) {
      writer.uint32(16).int32(message.quantity);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Parcel_Item {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseParcel_Item();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.itemId = reader.string();
          break;
        case 2:
          message.quantity = reader.int32();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): Parcel_Item {
    return {
      itemId: isSet(object.itemId) ? String(object.itemId) : "",
      quantity: isSet(object.quantity) ? Number(object.quantity) : 0,
    };
  },

  toJSON(message: Parcel_Item): unknown {
    const obj: any = {};
    message.itemId !== undefined && (obj.itemId = message.itemId);
    message.quantity !== undefined &&
      (obj.quantity = Math.round(message.quantity));
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<Parcel_Item>, I>>(
    object: I
  ): Parcel_Item {
    const message = createBaseParcel_Item();
    message.itemId = object.itemId ?? "";
    message.quantity = object.quantity ?? 0;
    return message;
  },
};

function createBaseOrder(): Order {
  return {
    referenceId: "",
    parcels: [],
    sender: undefined,
    receiver: undefined,
    notify: "",
  };
}

export const Order = {
  encode(message: Order, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.referenceId !== "") {
      writer.uint32(10).string(message.referenceId);
    }
    for (const v of message.parcels) {
      Parcel.encode(v!, writer.uint32(18).fork()).ldelim();
    }
    if (message.sender !== undefined) {
      Address.encode(message.sender, writer.uint32(26).fork()).ldelim();
    }
    if (message.receiver !== undefined) {
      Address.encode(message.receiver, writer.uint32(34).fork()).ldelim();
    }
    if (message.notify !== "") {
      writer.uint32(42).string(message.notify);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Order {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseOrder();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.referenceId = reader.string();
          break;
        case 2:
          message.parcels.push(Parcel.decode(reader, reader.uint32()));
          break;
        case 3:
          message.sender = Address.decode(reader, reader.uint32());
          break;
        case 4:
          message.receiver = Address.decode(reader, reader.uint32());
          break;
        case 5:
          message.notify = reader.string();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): Order {
    return {
      referenceId: isSet(object.referenceId) ? String(object.referenceId) : "",
      parcels: Array.isArray(object?.parcels)
        ? object.parcels.map((e: any) => Parcel.fromJSON(e))
        : [],
      sender: isSet(object.sender)
        ? Address.fromJSON(object.sender)
        : undefined,
      receiver: isSet(object.receiver)
        ? Address.fromJSON(object.receiver)
        : undefined,
      notify: isSet(object.notify) ? String(object.notify) : "",
    };
  },

  toJSON(message: Order): unknown {
    const obj: any = {};
    message.referenceId !== undefined &&
      (obj.referenceId = message.referenceId);
    if (message.parcels) {
      obj.parcels = message.parcels.map((e) =>
        e ? Parcel.toJSON(e) : undefined
      );
    } else {
      obj.parcels = [];
    }
    message.sender !== undefined &&
      (obj.sender = message.sender
        ? Address.toJSON(message.sender)
        : undefined);
    message.receiver !== undefined &&
      (obj.receiver = message.receiver
        ? Address.toJSON(message.receiver)
        : undefined);
    message.notify !== undefined && (obj.notify = message.notify);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<Order>, I>>(object: I): Order {
    const message = createBaseOrder();
    message.referenceId = object.referenceId ?? "";
    message.parcels = object.parcels?.map((e) => Parcel.fromPartial(e)) || [];
    message.sender =
      object.sender !== undefined && object.sender !== null
        ? Address.fromPartial(object.sender)
        : undefined;
    message.receiver =
      object.receiver !== undefined && object.receiver !== null
        ? Address.fromPartial(object.receiver)
        : undefined;
    message.notify = object.notify ?? "";
    return message;
  },
};

function createBaseLabel(): Label {
  return {
    url: undefined,
    pdf: undefined,
    png: undefined,
    shipmentNumber: "",
    state: 0,
    status: undefined,
  };
}

export const Label = {
  encode(message: Label, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.url !== undefined) {
      writer.uint32(10).string(message.url);
    }
    if (message.pdf !== undefined) {
      writer.uint32(18).string(message.pdf);
    }
    if (message.png !== undefined) {
      writer.uint32(26).string(message.png);
    }
    if (message.shipmentNumber !== "") {
      writer.uint32(34).string(message.shipmentNumber);
    }
    if (message.state !== 0) {
      writer.uint32(40).int32(message.state);
    }
    if (message.status !== undefined) {
      Status.encode(message.status, writer.uint32(50).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Label {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseLabel();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.url = reader.string();
          break;
        case 2:
          message.pdf = reader.string();
          break;
        case 3:
          message.png = reader.string();
          break;
        case 4:
          message.shipmentNumber = reader.string();
          break;
        case 5:
          message.state = reader.int32() as any;
          break;
        case 6:
          message.status = Status.decode(reader, reader.uint32());
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): Label {
    return {
      url: isSet(object.url) ? String(object.url) : undefined,
      pdf: isSet(object.pdf) ? String(object.pdf) : undefined,
      png: isSet(object.png) ? String(object.png) : undefined,
      shipmentNumber: isSet(object.shipmentNumber)
        ? String(object.shipmentNumber)
        : "",
      state: isSet(object.state) ? stateFromJSON(object.state) : 0,
      status: isSet(object.status) ? Status.fromJSON(object.status) : undefined,
    };
  },

  toJSON(message: Label): unknown {
    const obj: any = {};
    message.url !== undefined && (obj.url = message.url);
    message.pdf !== undefined && (obj.pdf = message.pdf);
    message.png !== undefined && (obj.png = message.png);
    message.shipmentNumber !== undefined &&
      (obj.shipmentNumber = message.shipmentNumber);
    message.state !== undefined && (obj.state = stateToJSON(message.state));
    message.status !== undefined &&
      (obj.status = message.status ? Status.toJSON(message.status) : undefined);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<Label>, I>>(object: I): Label {
    const message = createBaseLabel();
    message.url = object.url ?? undefined;
    message.pdf = object.pdf ?? undefined;
    message.png = object.png ?? undefined;
    message.shipmentNumber = object.shipmentNumber ?? "";
    message.state = object.state ?? 0;
    message.status =
      object.status !== undefined && object.status !== null
        ? Status.fromPartial(object.status)
        : undefined;
    return message;
  },
};

function createBaseFulfillmentRequest(): FulfillmentRequest {
  return { id: "", order: undefined, meta: undefined };
}

export const FulfillmentRequest = {
  encode(
    message: FulfillmentRequest,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.id !== "") {
      writer.uint32(10).string(message.id);
    }
    if (message.order !== undefined) {
      Order.encode(message.order, writer.uint32(18).fork()).ldelim();
    }
    if (message.meta !== undefined) {
      Meta.encode(message.meta, writer.uint32(26).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): FulfillmentRequest {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseFulfillmentRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.id = reader.string();
          break;
        case 2:
          message.order = Order.decode(reader, reader.uint32());
          break;
        case 3:
          message.meta = Meta.decode(reader, reader.uint32());
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): FulfillmentRequest {
    return {
      id: isSet(object.id) ? String(object.id) : "",
      order: isSet(object.order) ? Order.fromJSON(object.order) : undefined,
      meta: isSet(object.meta) ? Meta.fromJSON(object.meta) : undefined,
    };
  },

  toJSON(message: FulfillmentRequest): unknown {
    const obj: any = {};
    message.id !== undefined && (obj.id = message.id);
    message.order !== undefined &&
      (obj.order = message.order ? Order.toJSON(message.order) : undefined);
    message.meta !== undefined &&
      (obj.meta = message.meta ? Meta.toJSON(message.meta) : undefined);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<FulfillmentRequest>, I>>(
    object: I
  ): FulfillmentRequest {
    const message = createBaseFulfillmentRequest();
    message.id = object.id ?? "";
    message.order =
      object.order !== undefined && object.order !== null
        ? Order.fromPartial(object.order)
        : undefined;
    message.meta =
      object.meta !== undefined && object.meta !== null
        ? Meta.fromPartial(object.meta)
        : undefined;
    return message;
  },
};

function createBaseFulfillmentRequestList(): FulfillmentRequestList {
  return { items: [], totalCount: 0, subject: undefined };
}

export const FulfillmentRequestList = {
  encode(
    message: FulfillmentRequestList,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    for (const v of message.items) {
      FulfillmentRequest.encode(v!, writer.uint32(10).fork()).ldelim();
    }
    if (message.totalCount !== 0) {
      writer.uint32(16).uint32(message.totalCount);
    }
    if (message.subject !== undefined) {
      Subject.encode(message.subject, writer.uint32(26).fork()).ldelim();
    }
    return writer;
  },

  decode(
    input: _m0.Reader | Uint8Array,
    length?: number
  ): FulfillmentRequestList {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseFulfillmentRequestList();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.items.push(
            FulfillmentRequest.decode(reader, reader.uint32())
          );
          break;
        case 2:
          message.totalCount = reader.uint32();
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

  fromJSON(object: any): FulfillmentRequestList {
    return {
      items: Array.isArray(object?.items)
        ? object.items.map((e: any) => FulfillmentRequest.fromJSON(e))
        : [],
      totalCount: isSet(object.totalCount) ? Number(object.totalCount) : 0,
      subject: isSet(object.subject)
        ? Subject.fromJSON(object.subject)
        : undefined,
    };
  },

  toJSON(message: FulfillmentRequestList): unknown {
    const obj: any = {};
    if (message.items) {
      obj.items = message.items.map((e) =>
        e ? FulfillmentRequest.toJSON(e) : undefined
      );
    } else {
      obj.items = [];
    }
    message.totalCount !== undefined &&
      (obj.totalCount = Math.round(message.totalCount));
    message.subject !== undefined &&
      (obj.subject = message.subject
        ? Subject.toJSON(message.subject)
        : undefined);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<FulfillmentRequestList>, I>>(
    object: I
  ): FulfillmentRequestList {
    const message = createBaseFulfillmentRequestList();
    message.items =
      object.items?.map((e) => FulfillmentRequest.fromPartial(e)) || [];
    message.totalCount = object.totalCount ?? 0;
    message.subject =
      object.subject !== undefined && object.subject !== null
        ? Subject.fromPartial(object.subject)
        : undefined;
    return message;
  },
};

function createBaseFulfillment(): Fulfillment {
  return {
    id: "",
    order: undefined,
    meta: undefined,
    labels: [],
    fulfilled: false,
  };
}

export const Fulfillment = {
  encode(
    message: Fulfillment,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.id !== "") {
      writer.uint32(10).string(message.id);
    }
    if (message.order !== undefined) {
      Order.encode(message.order, writer.uint32(18).fork()).ldelim();
    }
    if (message.meta !== undefined) {
      Meta.encode(message.meta, writer.uint32(26).fork()).ldelim();
    }
    for (const v of message.labels) {
      Label.encode(v!, writer.uint32(34).fork()).ldelim();
    }
    if (message.fulfilled === true) {
      writer.uint32(40).bool(message.fulfilled);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Fulfillment {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseFulfillment();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.id = reader.string();
          break;
        case 2:
          message.order = Order.decode(reader, reader.uint32());
          break;
        case 3:
          message.meta = Meta.decode(reader, reader.uint32());
          break;
        case 4:
          message.labels.push(Label.decode(reader, reader.uint32()));
          break;
        case 5:
          message.fulfilled = reader.bool();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): Fulfillment {
    return {
      id: isSet(object.id) ? String(object.id) : "",
      order: isSet(object.order) ? Order.fromJSON(object.order) : undefined,
      meta: isSet(object.meta) ? Meta.fromJSON(object.meta) : undefined,
      labels: Array.isArray(object?.labels)
        ? object.labels.map((e: any) => Label.fromJSON(e))
        : [],
      fulfilled: isSet(object.fulfilled) ? Boolean(object.fulfilled) : false,
    };
  },

  toJSON(message: Fulfillment): unknown {
    const obj: any = {};
    message.id !== undefined && (obj.id = message.id);
    message.order !== undefined &&
      (obj.order = message.order ? Order.toJSON(message.order) : undefined);
    message.meta !== undefined &&
      (obj.meta = message.meta ? Meta.toJSON(message.meta) : undefined);
    if (message.labels) {
      obj.labels = message.labels.map((e) => (e ? Label.toJSON(e) : undefined));
    } else {
      obj.labels = [];
    }
    message.fulfilled !== undefined && (obj.fulfilled = message.fulfilled);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<Fulfillment>, I>>(
    object: I
  ): Fulfillment {
    const message = createBaseFulfillment();
    message.id = object.id ?? "";
    message.order =
      object.order !== undefined && object.order !== null
        ? Order.fromPartial(object.order)
        : undefined;
    message.meta =
      object.meta !== undefined && object.meta !== null
        ? Meta.fromPartial(object.meta)
        : undefined;
    message.labels = object.labels?.map((e) => Label.fromPartial(e)) || [];
    message.fulfilled = object.fulfilled ?? false;
    return message;
  },
};

function createBaseFulfillmentResponse(): FulfillmentResponse {
  return { payload: undefined, status: undefined };
}

export const FulfillmentResponse = {
  encode(
    message: FulfillmentResponse,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.payload !== undefined) {
      Fulfillment.encode(message.payload, writer.uint32(10).fork()).ldelim();
    }
    if (message.status !== undefined) {
      Status.encode(message.status, writer.uint32(18).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): FulfillmentResponse {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseFulfillmentResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.payload = Fulfillment.decode(reader, reader.uint32());
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

  fromJSON(object: any): FulfillmentResponse {
    return {
      payload: isSet(object.payload)
        ? Fulfillment.fromJSON(object.payload)
        : undefined,
      status: isSet(object.status) ? Status.fromJSON(object.status) : undefined,
    };
  },

  toJSON(message: FulfillmentResponse): unknown {
    const obj: any = {};
    message.payload !== undefined &&
      (obj.payload = message.payload
        ? Fulfillment.toJSON(message.payload)
        : undefined);
    message.status !== undefined &&
      (obj.status = message.status ? Status.toJSON(message.status) : undefined);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<FulfillmentResponse>, I>>(
    object: I
  ): FulfillmentResponse {
    const message = createBaseFulfillmentResponse();
    message.payload =
      object.payload !== undefined && object.payload !== null
        ? Fulfillment.fromPartial(object.payload)
        : undefined;
    message.status =
      object.status !== undefined && object.status !== null
        ? Status.fromPartial(object.status)
        : undefined;
    return message;
  },
};

function createBaseFulfillmentResponseList(): FulfillmentResponseList {
  return { items: [], totalCount: 0, operationStatus: undefined };
}

export const FulfillmentResponseList = {
  encode(
    message: FulfillmentResponseList,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    for (const v of message.items) {
      FulfillmentResponse.encode(v!, writer.uint32(10).fork()).ldelim();
    }
    if (message.totalCount !== 0) {
      writer.uint32(16).uint32(message.totalCount);
    }
    if (message.operationStatus !== undefined) {
      OperationStatus.encode(
        message.operationStatus,
        writer.uint32(26).fork()
      ).ldelim();
    }
    return writer;
  },

  decode(
    input: _m0.Reader | Uint8Array,
    length?: number
  ): FulfillmentResponseList {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseFulfillmentResponseList();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.items.push(
            FulfillmentResponse.decode(reader, reader.uint32())
          );
          break;
        case 2:
          message.totalCount = reader.uint32();
          break;
        case 3:
          message.operationStatus = OperationStatus.decode(
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

  fromJSON(object: any): FulfillmentResponseList {
    return {
      items: Array.isArray(object?.items)
        ? object.items.map((e: any) => FulfillmentResponse.fromJSON(e))
        : [],
      totalCount: isSet(object.totalCount) ? Number(object.totalCount) : 0,
      operationStatus: isSet(object.operationStatus)
        ? OperationStatus.fromJSON(object.operationStatus)
        : undefined,
    };
  },

  toJSON(message: FulfillmentResponseList): unknown {
    const obj: any = {};
    if (message.items) {
      obj.items = message.items.map((e) =>
        e ? FulfillmentResponse.toJSON(e) : undefined
      );
    } else {
      obj.items = [];
    }
    message.totalCount !== undefined &&
      (obj.totalCount = Math.round(message.totalCount));
    message.operationStatus !== undefined &&
      (obj.operationStatus = message.operationStatus
        ? OperationStatus.toJSON(message.operationStatus)
        : undefined);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<FulfillmentResponseList>, I>>(
    object: I
  ): FulfillmentResponseList {
    const message = createBaseFulfillmentResponseList();
    message.items =
      object.items?.map((e) => FulfillmentResponse.fromPartial(e)) || [];
    message.totalCount = object.totalCount ?? 0;
    message.operationStatus =
      object.operationStatus !== undefined && object.operationStatus !== null
        ? OperationStatus.fromPartial(object.operationStatus)
        : undefined;
    return message;
  },
};

function createBaseTrackingRequest(): TrackingRequest {
  return { fulfillmentId: "", shipmentNumbers: [], options: undefined };
}

export const TrackingRequest = {
  encode(
    message: TrackingRequest,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.fulfillmentId !== "") {
      writer.uint32(10).string(message.fulfillmentId);
    }
    for (const v of message.shipmentNumbers) {
      writer.uint32(18).string(v!);
    }
    if (message.options !== undefined) {
      Any.encode(message.options, writer.uint32(26).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): TrackingRequest {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseTrackingRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.fulfillmentId = reader.string();
          break;
        case 2:
          message.shipmentNumbers.push(reader.string());
          break;
        case 3:
          message.options = Any.decode(reader, reader.uint32());
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): TrackingRequest {
    return {
      fulfillmentId: isSet(object.fulfillmentId)
        ? String(object.fulfillmentId)
        : "",
      shipmentNumbers: Array.isArray(object?.shipmentNumbers)
        ? object.shipmentNumbers.map((e: any) => String(e))
        : [],
      options: isSet(object.options) ? Any.fromJSON(object.options) : undefined,
    };
  },

  toJSON(message: TrackingRequest): unknown {
    const obj: any = {};
    message.fulfillmentId !== undefined &&
      (obj.fulfillmentId = message.fulfillmentId);
    if (message.shipmentNumbers) {
      obj.shipmentNumbers = message.shipmentNumbers.map((e) => e);
    } else {
      obj.shipmentNumbers = [];
    }
    message.options !== undefined &&
      (obj.options = message.options ? Any.toJSON(message.options) : undefined);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<TrackingRequest>, I>>(
    object: I
  ): TrackingRequest {
    const message = createBaseTrackingRequest();
    message.fulfillmentId = object.fulfillmentId ?? "";
    message.shipmentNumbers = object.shipmentNumbers?.map((e) => e) || [];
    message.options =
      object.options !== undefined && object.options !== null
        ? Any.fromPartial(object.options)
        : undefined;
    return message;
  },
};

function createBaseTrackingRequestList(): TrackingRequestList {
  return { items: [], subject: undefined };
}

export const TrackingRequestList = {
  encode(
    message: TrackingRequestList,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    for (const v of message.items) {
      TrackingRequest.encode(v!, writer.uint32(10).fork()).ldelim();
    }
    if (message.subject !== undefined) {
      Subject.encode(message.subject, writer.uint32(18).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): TrackingRequestList {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseTrackingRequestList();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.items.push(TrackingRequest.decode(reader, reader.uint32()));
          break;
        case 2:
          message.subject = Subject.decode(reader, reader.uint32());
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): TrackingRequestList {
    return {
      items: Array.isArray(object?.items)
        ? object.items.map((e: any) => TrackingRequest.fromJSON(e))
        : [],
      subject: isSet(object.subject)
        ? Subject.fromJSON(object.subject)
        : undefined,
    };
  },

  toJSON(message: TrackingRequestList): unknown {
    const obj: any = {};
    if (message.items) {
      obj.items = message.items.map((e) =>
        e ? TrackingRequest.toJSON(e) : undefined
      );
    } else {
      obj.items = [];
    }
    message.subject !== undefined &&
      (obj.subject = message.subject
        ? Subject.toJSON(message.subject)
        : undefined);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<TrackingRequestList>, I>>(
    object: I
  ): TrackingRequestList {
    const message = createBaseTrackingRequestList();
    message.items =
      object.items?.map((e) => TrackingRequest.fromPartial(e)) || [];
    message.subject =
      object.subject !== undefined && object.subject !== null
        ? Subject.fromPartial(object.subject)
        : undefined;
    return message;
  },
};

function createBaseEvent(): Event {
  return { timestamp: 0, location: "", details: undefined, status: undefined };
}

export const Event = {
  encode(message: Event, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.timestamp !== 0) {
      writer.uint32(8).int64(message.timestamp);
    }
    if (message.location !== "") {
      writer.uint32(18).string(message.location);
    }
    if (message.details !== undefined) {
      Any.encode(message.details, writer.uint32(26).fork()).ldelim();
    }
    if (message.status !== undefined) {
      Status.encode(message.status, writer.uint32(34).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Event {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseEvent();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.timestamp = longToNumber(reader.int64() as Long);
          break;
        case 2:
          message.location = reader.string();
          break;
        case 3:
          message.details = Any.decode(reader, reader.uint32());
          break;
        case 4:
          message.status = Status.decode(reader, reader.uint32());
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): Event {
    return {
      timestamp: isSet(object.timestamp) ? Number(object.timestamp) : 0,
      location: isSet(object.location) ? String(object.location) : "",
      details: isSet(object.details) ? Any.fromJSON(object.details) : undefined,
      status: isSet(object.status) ? Status.fromJSON(object.status) : undefined,
    };
  },

  toJSON(message: Event): unknown {
    const obj: any = {};
    message.timestamp !== undefined &&
      (obj.timestamp = Math.round(message.timestamp));
    message.location !== undefined && (obj.location = message.location);
    message.details !== undefined &&
      (obj.details = message.details ? Any.toJSON(message.details) : undefined);
    message.status !== undefined &&
      (obj.status = message.status ? Status.toJSON(message.status) : undefined);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<Event>, I>>(object: I): Event {
    const message = createBaseEvent();
    message.timestamp = object.timestamp ?? 0;
    message.location = object.location ?? "";
    message.details =
      object.details !== undefined && object.details !== null
        ? Any.fromPartial(object.details)
        : undefined;
    message.status =
      object.status !== undefined && object.status !== null
        ? Status.fromPartial(object.status)
        : undefined;
    return message;
  },
};

function createBaseTracking(): Tracking {
  return {
    shipmentNumber: "",
    events: [],
    details: undefined,
    status: undefined,
  };
}

export const Tracking = {
  encode(
    message: Tracking,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.shipmentNumber !== "") {
      writer.uint32(10).string(message.shipmentNumber);
    }
    for (const v of message.events) {
      Event.encode(v!, writer.uint32(26).fork()).ldelim();
    }
    if (message.details !== undefined) {
      Any.encode(message.details, writer.uint32(34).fork()).ldelim();
    }
    if (message.status !== undefined) {
      Status.encode(message.status, writer.uint32(42).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Tracking {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseTracking();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.shipmentNumber = reader.string();
          break;
        case 3:
          message.events.push(Event.decode(reader, reader.uint32()));
          break;
        case 4:
          message.details = Any.decode(reader, reader.uint32());
          break;
        case 5:
          message.status = Status.decode(reader, reader.uint32());
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): Tracking {
    return {
      shipmentNumber: isSet(object.shipmentNumber)
        ? String(object.shipmentNumber)
        : "",
      events: Array.isArray(object?.events)
        ? object.events.map((e: any) => Event.fromJSON(e))
        : [],
      details: isSet(object.details) ? Any.fromJSON(object.details) : undefined,
      status: isSet(object.status) ? Status.fromJSON(object.status) : undefined,
    };
  },

  toJSON(message: Tracking): unknown {
    const obj: any = {};
    message.shipmentNumber !== undefined &&
      (obj.shipmentNumber = message.shipmentNumber);
    if (message.events) {
      obj.events = message.events.map((e) => (e ? Event.toJSON(e) : undefined));
    } else {
      obj.events = [];
    }
    message.details !== undefined &&
      (obj.details = message.details ? Any.toJSON(message.details) : undefined);
    message.status !== undefined &&
      (obj.status = message.status ? Status.toJSON(message.status) : undefined);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<Tracking>, I>>(object: I): Tracking {
    const message = createBaseTracking();
    message.shipmentNumber = object.shipmentNumber ?? "";
    message.events = object.events?.map((e) => Event.fromPartial(e)) || [];
    message.details =
      object.details !== undefined && object.details !== null
        ? Any.fromPartial(object.details)
        : undefined;
    message.status =
      object.status !== undefined && object.status !== null
        ? Status.fromPartial(object.status)
        : undefined;
    return message;
  },
};

function createBaseTrackingResult(): TrackingResult {
  return { fulfillment: undefined, tracks: [], status: undefined };
}

export const TrackingResult = {
  encode(
    message: TrackingResult,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.fulfillment !== undefined) {
      Fulfillment.encode(
        message.fulfillment,
        writer.uint32(10).fork()
      ).ldelim();
    }
    for (const v of message.tracks) {
      Tracking.encode(v!, writer.uint32(18).fork()).ldelim();
    }
    if (message.status !== undefined) {
      Status.encode(message.status, writer.uint32(26).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): TrackingResult {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseTrackingResult();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.fulfillment = Fulfillment.decode(reader, reader.uint32());
          break;
        case 2:
          message.tracks.push(Tracking.decode(reader, reader.uint32()));
          break;
        case 3:
          message.status = Status.decode(reader, reader.uint32());
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): TrackingResult {
    return {
      fulfillment: isSet(object.fulfillment)
        ? Fulfillment.fromJSON(object.fulfillment)
        : undefined,
      tracks: Array.isArray(object?.tracks)
        ? object.tracks.map((e: any) => Tracking.fromJSON(e))
        : [],
      status: isSet(object.status) ? Status.fromJSON(object.status) : undefined,
    };
  },

  toJSON(message: TrackingResult): unknown {
    const obj: any = {};
    message.fulfillment !== undefined &&
      (obj.fulfillment = message.fulfillment
        ? Fulfillment.toJSON(message.fulfillment)
        : undefined);
    if (message.tracks) {
      obj.tracks = message.tracks.map((e) =>
        e ? Tracking.toJSON(e) : undefined
      );
    } else {
      obj.tracks = [];
    }
    message.status !== undefined &&
      (obj.status = message.status ? Status.toJSON(message.status) : undefined);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<TrackingResult>, I>>(
    object: I
  ): TrackingResult {
    const message = createBaseTrackingResult();
    message.fulfillment =
      object.fulfillment !== undefined && object.fulfillment !== null
        ? Fulfillment.fromPartial(object.fulfillment)
        : undefined;
    message.tracks = object.tracks?.map((e) => Tracking.fromPartial(e)) || [];
    message.status =
      object.status !== undefined && object.status !== null
        ? Status.fromPartial(object.status)
        : undefined;
    return message;
  },
};

function createBaseTrackingResultList(): TrackingResultList {
  return { items: [], operationStatus: undefined };
}

export const TrackingResultList = {
  encode(
    message: TrackingResultList,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    for (const v of message.items) {
      TrackingResult.encode(v!, writer.uint32(10).fork()).ldelim();
    }
    if (message.operationStatus !== undefined) {
      OperationStatus.encode(
        message.operationStatus,
        writer.uint32(18).fork()
      ).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): TrackingResultList {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseTrackingResultList();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.items.push(TrackingResult.decode(reader, reader.uint32()));
          break;
        case 2:
          message.operationStatus = OperationStatus.decode(
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

  fromJSON(object: any): TrackingResultList {
    return {
      items: Array.isArray(object?.items)
        ? object.items.map((e: any) => TrackingResult.fromJSON(e))
        : [],
      operationStatus: isSet(object.operationStatus)
        ? OperationStatus.fromJSON(object.operationStatus)
        : undefined,
    };
  },

  toJSON(message: TrackingResultList): unknown {
    const obj: any = {};
    if (message.items) {
      obj.items = message.items.map((e) =>
        e ? TrackingResult.toJSON(e) : undefined
      );
    } else {
      obj.items = [];
    }
    message.operationStatus !== undefined &&
      (obj.operationStatus = message.operationStatus
        ? OperationStatus.toJSON(message.operationStatus)
        : undefined);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<TrackingResultList>, I>>(
    object: I
  ): TrackingResultList {
    const message = createBaseTrackingResultList();
    message.items =
      object.items?.map((e) => TrackingResult.fromPartial(e)) || [];
    message.operationStatus =
      object.operationStatus !== undefined && object.operationStatus !== null
        ? OperationStatus.fromPartial(object.operationStatus)
        : undefined;
    return message;
  },
};

function createBaseCancelRequestList(): CancelRequestList {
  return { ids: [], subject: undefined };
}

export const CancelRequestList = {
  encode(
    message: CancelRequestList,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    for (const v of message.ids) {
      writer.uint32(10).string(v!);
    }
    if (message.subject !== undefined) {
      Subject.encode(message.subject, writer.uint32(18).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): CancelRequestList {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseCancelRequestList();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.ids.push(reader.string());
          break;
        case 2:
          message.subject = Subject.decode(reader, reader.uint32());
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): CancelRequestList {
    return {
      ids: Array.isArray(object?.ids)
        ? object.ids.map((e: any) => String(e))
        : [],
      subject: isSet(object.subject)
        ? Subject.fromJSON(object.subject)
        : undefined,
    };
  },

  toJSON(message: CancelRequestList): unknown {
    const obj: any = {};
    if (message.ids) {
      obj.ids = message.ids.map((e) => e);
    } else {
      obj.ids = [];
    }
    message.subject !== undefined &&
      (obj.subject = message.subject
        ? Subject.toJSON(message.subject)
        : undefined);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<CancelRequestList>, I>>(
    object: I
  ): CancelRequestList {
    const message = createBaseCancelRequestList();
    message.ids = object.ids?.map((e) => e) || [];
    message.subject =
      object.subject !== undefined && object.subject !== null
        ? Subject.fromPartial(object.subject)
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

/** Microservice definition. */
export interface Service {
  /** Returns a list of shipment IDs. */
  Read(request: ReadRequest): Promise<FulfillmentResponseList>;
  /** Creates and executes fulfillment orders */
  Create(request: FulfillmentRequestList): Promise<FulfillmentResponseList>;
  /** Track a batch of fulfillment orders */
  Track(request: TrackingRequestList): Promise<TrackingResultList>;
  /** Cancel a batch of fulfillment orders */
  Cancel(request: CancelRequestList): Promise<FulfillmentResponseList>;
  /** Delete a batch of fulfillments from the database */
  Delete(request: DeleteRequest): Promise<DeleteResponse>;
}

declare var self: any | undefined;
declare var window: any | undefined;
declare var global: any | undefined;
var globalThis: any = (() => {
  if (typeof globalThis !== "undefined") return globalThis;
  if (typeof self !== "undefined") return self;
  if (typeof window !== "undefined") return window;
  if (typeof global !== "undefined") return global;
  throw "Unable to locate global object";
})();

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

function longToNumber(long: Long): number {
  if (long.gt(Number.MAX_SAFE_INTEGER)) {
    throw new globalThis.Error("Value is larger than Number.MAX_SAFE_INTEGER");
  }
  return long.toNumber();
}

// If you get a compile-error about 'Constructor<Long> and ... have no overlap',
// add '--ts_proto_opt=esModuleInterop=true' as a flag when calling 'protoc'.
if (_m0.util.Long !== Long) {
  _m0.util.Long = Long as any;
  _m0.configure();
}

function isSet(value: any): boolean {
  return value !== null && value !== undefined;
}

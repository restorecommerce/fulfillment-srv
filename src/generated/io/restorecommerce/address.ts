/* eslint-disable */
import Long from "long";
import * as _m0 from "protobufjs/minimal";
import { Subject } from "../../io/restorecommerce/auth";
import { OperationStatus, Status } from "../../io/restorecommerce/status";
import { Meta } from "../../io/restorecommerce/meta";
import {
  DeleteResponse,
  ReadRequest,
  DeleteRequest,
} from "../../io/restorecommerce/resource_base";

export const protobufPackage = "io.restorecommerce.address";

export interface Deleted {
  id: string;
}

export interface AddressList {
  items: Address[];
  total_count: number;
  subject: Subject;
}

export interface AddressListResponse {
  items: AddressResponse[];
  total_count: number;
  operation_status: OperationStatus;
}

export interface AddressResponse {
  payload: Address;
  status: Status;
}

export interface Address {
  id: string;
  meta: Meta;
  postcode: string;
  country_id: string;
  locality: string;
  street: string;
  region: string;
  geo_coordinates: Address_GeoPoint;
  altitude: number;
  building_number: string;
  address_addition: AddressAddition;
}

export interface Address_GeoPoint {
  latitude: number;
  longitude: number;
}

export interface AddressAddition {
  field1: string;
  field2: string;
}

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

function createBaseAddressList(): AddressList {
  return { items: [], total_count: 0, subject: undefined };
}

export const AddressList = {
  encode(
    message: AddressList,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    for (const v of message.items) {
      Address.encode(v!, writer.uint32(10).fork()).ldelim();
    }
    if (message.total_count !== 0) {
      writer.uint32(16).uint32(message.total_count);
    }
    if (message.subject !== undefined) {
      Subject.encode(message.subject, writer.uint32(26).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): AddressList {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseAddressList();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.items.push(Address.decode(reader, reader.uint32()));
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

  fromJSON(object: any): AddressList {
    return {
      items: Array.isArray(object?.items)
        ? object.items.map((e: any) => Address.fromJSON(e))
        : [],
      total_count: isSet(object.total_count) ? Number(object.total_count) : 0,
      subject: isSet(object.subject)
        ? Subject.fromJSON(object.subject)
        : undefined,
    };
  },

  toJSON(message: AddressList): unknown {
    const obj: any = {};
    if (message.items) {
      obj.items = message.items.map((e) => (e ? Address.toJSON(e) : undefined));
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

  fromPartial<I extends Exact<DeepPartial<AddressList>, I>>(
    object: I
  ): AddressList {
    const message = createBaseAddressList();
    message.items = object.items?.map((e) => Address.fromPartial(e)) || [];
    message.total_count = object.total_count ?? 0;
    message.subject =
      object.subject !== undefined && object.subject !== null
        ? Subject.fromPartial(object.subject)
        : undefined;
    return message;
  },
};

function createBaseAddressListResponse(): AddressListResponse {
  return { items: [], total_count: 0, operation_status: undefined };
}

export const AddressListResponse = {
  encode(
    message: AddressListResponse,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    for (const v of message.items) {
      AddressResponse.encode(v!, writer.uint32(10).fork()).ldelim();
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

  decode(input: _m0.Reader | Uint8Array, length?: number): AddressListResponse {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseAddressListResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.items.push(AddressResponse.decode(reader, reader.uint32()));
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

  fromJSON(object: any): AddressListResponse {
    return {
      items: Array.isArray(object?.items)
        ? object.items.map((e: any) => AddressResponse.fromJSON(e))
        : [],
      total_count: isSet(object.total_count) ? Number(object.total_count) : 0,
      operation_status: isSet(object.operation_status)
        ? OperationStatus.fromJSON(object.operation_status)
        : undefined,
    };
  },

  toJSON(message: AddressListResponse): unknown {
    const obj: any = {};
    if (message.items) {
      obj.items = message.items.map((e) =>
        e ? AddressResponse.toJSON(e) : undefined
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

  fromPartial<I extends Exact<DeepPartial<AddressListResponse>, I>>(
    object: I
  ): AddressListResponse {
    const message = createBaseAddressListResponse();
    message.items =
      object.items?.map((e) => AddressResponse.fromPartial(e)) || [];
    message.total_count = object.total_count ?? 0;
    message.operation_status =
      object.operation_status !== undefined && object.operation_status !== null
        ? OperationStatus.fromPartial(object.operation_status)
        : undefined;
    return message;
  },
};

function createBaseAddressResponse(): AddressResponse {
  return { payload: undefined, status: undefined };
}

export const AddressResponse = {
  encode(
    message: AddressResponse,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.payload !== undefined) {
      Address.encode(message.payload, writer.uint32(10).fork()).ldelim();
    }
    if (message.status !== undefined) {
      Status.encode(message.status, writer.uint32(18).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): AddressResponse {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseAddressResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.payload = Address.decode(reader, reader.uint32());
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

  fromJSON(object: any): AddressResponse {
    return {
      payload: isSet(object.payload)
        ? Address.fromJSON(object.payload)
        : undefined,
      status: isSet(object.status) ? Status.fromJSON(object.status) : undefined,
    };
  },

  toJSON(message: AddressResponse): unknown {
    const obj: any = {};
    message.payload !== undefined &&
      (obj.payload = message.payload
        ? Address.toJSON(message.payload)
        : undefined);
    message.status !== undefined &&
      (obj.status = message.status ? Status.toJSON(message.status) : undefined);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<AddressResponse>, I>>(
    object: I
  ): AddressResponse {
    const message = createBaseAddressResponse();
    message.payload =
      object.payload !== undefined && object.payload !== null
        ? Address.fromPartial(object.payload)
        : undefined;
    message.status =
      object.status !== undefined && object.status !== null
        ? Status.fromPartial(object.status)
        : undefined;
    return message;
  },
};

function createBaseAddress(): Address {
  return {
    id: "",
    meta: undefined,
    postcode: "",
    country_id: "",
    locality: "",
    street: "",
    region: "",
    geo_coordinates: undefined,
    altitude: 0,
    building_number: "",
    address_addition: undefined,
  };
}

export const Address = {
  encode(
    message: Address,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.id !== "") {
      writer.uint32(10).string(message.id);
    }
    if (message.meta !== undefined) {
      Meta.encode(message.meta, writer.uint32(18).fork()).ldelim();
    }
    if (message.postcode !== "") {
      writer.uint32(26).string(message.postcode);
    }
    if (message.country_id !== "") {
      writer.uint32(34).string(message.country_id);
    }
    if (message.locality !== "") {
      writer.uint32(42).string(message.locality);
    }
    if (message.street !== "") {
      writer.uint32(50).string(message.street);
    }
    if (message.region !== "") {
      writer.uint32(58).string(message.region);
    }
    if (message.geo_coordinates !== undefined) {
      Address_GeoPoint.encode(
        message.geo_coordinates,
        writer.uint32(66).fork()
      ).ldelim();
    }
    if (message.altitude !== 0) {
      writer.uint32(73).double(message.altitude);
    }
    if (message.building_number !== "") {
      writer.uint32(82).string(message.building_number);
    }
    if (message.address_addition !== undefined) {
      AddressAddition.encode(
        message.address_addition,
        writer.uint32(90).fork()
      ).ldelim();
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
          message.id = reader.string();
          break;
        case 2:
          message.meta = Meta.decode(reader, reader.uint32());
          break;
        case 3:
          message.postcode = reader.string();
          break;
        case 4:
          message.country_id = reader.string();
          break;
        case 5:
          message.locality = reader.string();
          break;
        case 6:
          message.street = reader.string();
          break;
        case 7:
          message.region = reader.string();
          break;
        case 8:
          message.geo_coordinates = Address_GeoPoint.decode(
            reader,
            reader.uint32()
          );
          break;
        case 9:
          message.altitude = reader.double();
          break;
        case 10:
          message.building_number = reader.string();
          break;
        case 11:
          message.address_addition = AddressAddition.decode(
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

  fromJSON(object: any): Address {
    return {
      id: isSet(object.id) ? String(object.id) : "",
      meta: isSet(object.meta) ? Meta.fromJSON(object.meta) : undefined,
      postcode: isSet(object.postcode) ? String(object.postcode) : "",
      country_id: isSet(object.country_id) ? String(object.country_id) : "",
      locality: isSet(object.locality) ? String(object.locality) : "",
      street: isSet(object.street) ? String(object.street) : "",
      region: isSet(object.region) ? String(object.region) : "",
      geo_coordinates: isSet(object.geo_coordinates)
        ? Address_GeoPoint.fromJSON(object.geo_coordinates)
        : undefined,
      altitude: isSet(object.altitude) ? Number(object.altitude) : 0,
      building_number: isSet(object.building_number)
        ? String(object.building_number)
        : "",
      address_addition: isSet(object.address_addition)
        ? AddressAddition.fromJSON(object.address_addition)
        : undefined,
    };
  },

  toJSON(message: Address): unknown {
    const obj: any = {};
    message.id !== undefined && (obj.id = message.id);
    message.meta !== undefined &&
      (obj.meta = message.meta ? Meta.toJSON(message.meta) : undefined);
    message.postcode !== undefined && (obj.postcode = message.postcode);
    message.country_id !== undefined && (obj.country_id = message.country_id);
    message.locality !== undefined && (obj.locality = message.locality);
    message.street !== undefined && (obj.street = message.street);
    message.region !== undefined && (obj.region = message.region);
    message.geo_coordinates !== undefined &&
      (obj.geo_coordinates = message.geo_coordinates
        ? Address_GeoPoint.toJSON(message.geo_coordinates)
        : undefined);
    message.altitude !== undefined && (obj.altitude = message.altitude);
    message.building_number !== undefined &&
      (obj.building_number = message.building_number);
    message.address_addition !== undefined &&
      (obj.address_addition = message.address_addition
        ? AddressAddition.toJSON(message.address_addition)
        : undefined);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<Address>, I>>(object: I): Address {
    const message = createBaseAddress();
    message.id = object.id ?? "";
    message.meta =
      object.meta !== undefined && object.meta !== null
        ? Meta.fromPartial(object.meta)
        : undefined;
    message.postcode = object.postcode ?? "";
    message.country_id = object.country_id ?? "";
    message.locality = object.locality ?? "";
    message.street = object.street ?? "";
    message.region = object.region ?? "";
    message.geo_coordinates =
      object.geo_coordinates !== undefined && object.geo_coordinates !== null
        ? Address_GeoPoint.fromPartial(object.geo_coordinates)
        : undefined;
    message.altitude = object.altitude ?? 0;
    message.building_number = object.building_number ?? "";
    message.address_addition =
      object.address_addition !== undefined && object.address_addition !== null
        ? AddressAddition.fromPartial(object.address_addition)
        : undefined;
    return message;
  },
};

function createBaseAddress_GeoPoint(): Address_GeoPoint {
  return { latitude: 0, longitude: 0 };
}

export const Address_GeoPoint = {
  encode(
    message: Address_GeoPoint,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.latitude !== 0) {
      writer.uint32(9).double(message.latitude);
    }
    if (message.longitude !== 0) {
      writer.uint32(17).double(message.longitude);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Address_GeoPoint {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseAddress_GeoPoint();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.latitude = reader.double();
          break;
        case 2:
          message.longitude = reader.double();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): Address_GeoPoint {
    return {
      latitude: isSet(object.latitude) ? Number(object.latitude) : 0,
      longitude: isSet(object.longitude) ? Number(object.longitude) : 0,
    };
  },

  toJSON(message: Address_GeoPoint): unknown {
    const obj: any = {};
    message.latitude !== undefined && (obj.latitude = message.latitude);
    message.longitude !== undefined && (obj.longitude = message.longitude);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<Address_GeoPoint>, I>>(
    object: I
  ): Address_GeoPoint {
    const message = createBaseAddress_GeoPoint();
    message.latitude = object.latitude ?? 0;
    message.longitude = object.longitude ?? 0;
    return message;
  },
};

function createBaseAddressAddition(): AddressAddition {
  return { field1: "", field2: "" };
}

export const AddressAddition = {
  encode(
    message: AddressAddition,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.field1 !== "") {
      writer.uint32(10).string(message.field1);
    }
    if (message.field2 !== "") {
      writer.uint32(18).string(message.field2);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): AddressAddition {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseAddressAddition();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.field1 = reader.string();
          break;
        case 2:
          message.field2 = reader.string();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): AddressAddition {
    return {
      field1: isSet(object.field1) ? String(object.field1) : "",
      field2: isSet(object.field2) ? String(object.field2) : "",
    };
  },

  toJSON(message: AddressAddition): unknown {
    const obj: any = {};
    message.field1 !== undefined && (obj.field1 = message.field1);
    message.field2 !== undefined && (obj.field2 = message.field2);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<AddressAddition>, I>>(
    object: I
  ): AddressAddition {
    const message = createBaseAddressAddition();
    message.field1 = object.field1 ?? "";
    message.field2 = object.field2 ?? "";
    return message;
  },
};

/** Microservice definition. */
export interface Service {
  Read(request: ReadRequest): Promise<AddressListResponse>;
  Create(request: AddressList): Promise<AddressListResponse>;
  Delete(request: DeleteRequest): Promise<DeleteResponse>;
  Update(request: AddressList): Promise<AddressListResponse>;
  Upsert(request: AddressList): Promise<AddressListResponse>;
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

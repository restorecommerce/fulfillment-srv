/* eslint-disable */
import * as Long from "long";
import * as _m0 from "protobufjs/minimal";
import { Subject } from "../../io/restorecommerce/auth";
import { OperationStatus, Status } from "../../io/restorecommerce/status";
import { Meta } from "../../io/restorecommerce/meta";
import {
  DeleteResponse,
  ReadRequest,
  DeleteRequest,
} from "../../io/restorecommerce/resource_base";

export const protobufPackage = "io.restorecommerce.country";

export interface Deleted {
  id: string;
}

export interface CountryList {
  items: Country[];
  total_count: number;
  subject: Subject;
}

export interface CountryListResponse {
  items: CountryResponse[];
  total_count: number;
  operation_status: OperationStatus;
}

export interface CountryResponse {
  payload: Country;
  status: Status;
}

export interface Country {
  id: string;
  meta: Meta;
  name: string;
  country_code: string;
  geographical_name: string;
  economic_areas: string[];
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

function createBaseCountryList(): CountryList {
  return { items: [], total_count: 0, subject: undefined };
}

export const CountryList = {
  encode(
    message: CountryList,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    for (const v of message.items) {
      Country.encode(v!, writer.uint32(10).fork()).ldelim();
    }
    if (message.total_count !== 0) {
      writer.uint32(16).uint32(message.total_count);
    }
    if (message.subject !== undefined) {
      Subject.encode(message.subject, writer.uint32(26).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): CountryList {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseCountryList();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.items.push(Country.decode(reader, reader.uint32()));
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

  fromJSON(object: any): CountryList {
    return {
      items: Array.isArray(object?.items)
        ? object.items.map((e: any) => Country.fromJSON(e))
        : [],
      total_count: isSet(object.total_count) ? Number(object.total_count) : 0,
      subject: isSet(object.subject)
        ? Subject.fromJSON(object.subject)
        : undefined,
    };
  },

  toJSON(message: CountryList): unknown {
    const obj: any = {};
    if (message.items) {
      obj.items = message.items.map((e) => (e ? Country.toJSON(e) : undefined));
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

  fromPartial<I extends Exact<DeepPartial<CountryList>, I>>(
    object: I
  ): CountryList {
    const message = createBaseCountryList();
    message.items = object.items?.map((e) => Country.fromPartial(e)) || [];
    message.total_count = object.total_count ?? 0;
    message.subject =
      object.subject !== undefined && object.subject !== null
        ? Subject.fromPartial(object.subject)
        : undefined;
    return message;
  },
};

function createBaseCountryListResponse(): CountryListResponse {
  return { items: [], total_count: 0, operation_status: undefined };
}

export const CountryListResponse = {
  encode(
    message: CountryListResponse,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    for (const v of message.items) {
      CountryResponse.encode(v!, writer.uint32(10).fork()).ldelim();
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

  decode(input: _m0.Reader | Uint8Array, length?: number): CountryListResponse {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseCountryListResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.items.push(CountryResponse.decode(reader, reader.uint32()));
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

  fromJSON(object: any): CountryListResponse {
    return {
      items: Array.isArray(object?.items)
        ? object.items.map((e: any) => CountryResponse.fromJSON(e))
        : [],
      total_count: isSet(object.total_count) ? Number(object.total_count) : 0,
      operation_status: isSet(object.operation_status)
        ? OperationStatus.fromJSON(object.operation_status)
        : undefined,
    };
  },

  toJSON(message: CountryListResponse): unknown {
    const obj: any = {};
    if (message.items) {
      obj.items = message.items.map((e) =>
        e ? CountryResponse.toJSON(e) : undefined
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

  fromPartial<I extends Exact<DeepPartial<CountryListResponse>, I>>(
    object: I
  ): CountryListResponse {
    const message = createBaseCountryListResponse();
    message.items =
      object.items?.map((e) => CountryResponse.fromPartial(e)) || [];
    message.total_count = object.total_count ?? 0;
    message.operation_status =
      object.operation_status !== undefined && object.operation_status !== null
        ? OperationStatus.fromPartial(object.operation_status)
        : undefined;
    return message;
  },
};

function createBaseCountryResponse(): CountryResponse {
  return { payload: undefined, status: undefined };
}

export const CountryResponse = {
  encode(
    message: CountryResponse,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.payload !== undefined) {
      Country.encode(message.payload, writer.uint32(10).fork()).ldelim();
    }
    if (message.status !== undefined) {
      Status.encode(message.status, writer.uint32(18).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): CountryResponse {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseCountryResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.payload = Country.decode(reader, reader.uint32());
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

  fromJSON(object: any): CountryResponse {
    return {
      payload: isSet(object.payload)
        ? Country.fromJSON(object.payload)
        : undefined,
      status: isSet(object.status) ? Status.fromJSON(object.status) : undefined,
    };
  },

  toJSON(message: CountryResponse): unknown {
    const obj: any = {};
    message.payload !== undefined &&
      (obj.payload = message.payload
        ? Country.toJSON(message.payload)
        : undefined);
    message.status !== undefined &&
      (obj.status = message.status ? Status.toJSON(message.status) : undefined);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<CountryResponse>, I>>(
    object: I
  ): CountryResponse {
    const message = createBaseCountryResponse();
    message.payload =
      object.payload !== undefined && object.payload !== null
        ? Country.fromPartial(object.payload)
        : undefined;
    message.status =
      object.status !== undefined && object.status !== null
        ? Status.fromPartial(object.status)
        : undefined;
    return message;
  },
};

function createBaseCountry(): Country {
  return {
    id: "",
    meta: undefined,
    name: "",
    country_code: "",
    geographical_name: "",
    economic_areas: [],
  };
}

export const Country = {
  encode(
    message: Country,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.id !== "") {
      writer.uint32(10).string(message.id);
    }
    if (message.meta !== undefined) {
      Meta.encode(message.meta, writer.uint32(18).fork()).ldelim();
    }
    if (message.name !== "") {
      writer.uint32(26).string(message.name);
    }
    if (message.country_code !== "") {
      writer.uint32(34).string(message.country_code);
    }
    if (message.geographical_name !== "") {
      writer.uint32(42).string(message.geographical_name);
    }
    for (const v of message.economic_areas) {
      writer.uint32(50).string(v!);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Country {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseCountry();
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
          message.country_code = reader.string();
          break;
        case 5:
          message.geographical_name = reader.string();
          break;
        case 6:
          message.economic_areas.push(reader.string());
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): Country {
    return {
      id: isSet(object.id) ? String(object.id) : "",
      meta: isSet(object.meta) ? Meta.fromJSON(object.meta) : undefined,
      name: isSet(object.name) ? String(object.name) : "",
      country_code: isSet(object.country_code)
        ? String(object.country_code)
        : "",
      geographical_name: isSet(object.geographical_name)
        ? String(object.geographical_name)
        : "",
      economic_areas: Array.isArray(object?.economic_areas)
        ? object.economic_areas.map((e: any) => String(e))
        : [],
    };
  },

  toJSON(message: Country): unknown {
    const obj: any = {};
    message.id !== undefined && (obj.id = message.id);
    message.meta !== undefined &&
      (obj.meta = message.meta ? Meta.toJSON(message.meta) : undefined);
    message.name !== undefined && (obj.name = message.name);
    message.country_code !== undefined &&
      (obj.country_code = message.country_code);
    message.geographical_name !== undefined &&
      (obj.geographical_name = message.geographical_name);
    if (message.economic_areas) {
      obj.economic_areas = message.economic_areas.map((e) => e);
    } else {
      obj.economic_areas = [];
    }
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<Country>, I>>(object: I): Country {
    const message = createBaseCountry();
    message.id = object.id ?? "";
    message.meta =
      object.meta !== undefined && object.meta !== null
        ? Meta.fromPartial(object.meta)
        : undefined;
    message.name = object.name ?? "";
    message.country_code = object.country_code ?? "";
    message.geographical_name = object.geographical_name ?? "";
    message.economic_areas = object.economic_areas?.map((e) => e) || [];
    return message;
  },
};

/** Microservice definition. */
export interface Service {
  Read(request: ReadRequest): Promise<CountryListResponse>;
  Create(request: CountryList): Promise<CountryListResponse>;
  Delete(request: DeleteRequest): Promise<DeleteResponse>;
  Update(request: CountryList): Promise<CountryListResponse>;
  Upsert(request: CountryList): Promise<CountryListResponse>;
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

// If you get a compile-error about 'Constructor<Long> and ... have no overlap',
// add '--ts_proto_opt=esModuleInterop=true' as a flag when calling 'protoc'.
if (_m0.util.Long !== Long) {
  _m0.util.Long = Long as any;
  _m0.configure();
}

function isSet(value: any): boolean {
  return value !== null && value !== undefined;
}

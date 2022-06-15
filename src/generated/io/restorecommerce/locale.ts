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

export const protobufPackage = "io.restorecommerce.locale";

export interface Deleted {
  id: string;
}

export interface LocaleList {
  items: Locale[];
  total_count: number;
  subject: Subject;
}

export interface LocaleListResponse {
  items: LocaleResponse[];
  total_count: number;
  operation_status: OperationStatus;
}

export interface LocaleResponse {
  payload: Locale;
  status: Status;
}

export interface Locale {
  id: string;
  meta: Meta;
  value: string;
  description: string;
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

function createBaseLocaleList(): LocaleList {
  return { items: [], total_count: 0, subject: undefined };
}

export const LocaleList = {
  encode(
    message: LocaleList,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    for (const v of message.items) {
      Locale.encode(v!, writer.uint32(10).fork()).ldelim();
    }
    if (message.total_count !== 0) {
      writer.uint32(16).uint32(message.total_count);
    }
    if (message.subject !== undefined) {
      Subject.encode(message.subject, writer.uint32(26).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): LocaleList {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseLocaleList();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.items.push(Locale.decode(reader, reader.uint32()));
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

  fromJSON(object: any): LocaleList {
    return {
      items: Array.isArray(object?.items)
        ? object.items.map((e: any) => Locale.fromJSON(e))
        : [],
      total_count: isSet(object.total_count) ? Number(object.total_count) : 0,
      subject: isSet(object.subject)
        ? Subject.fromJSON(object.subject)
        : undefined,
    };
  },

  toJSON(message: LocaleList): unknown {
    const obj: any = {};
    if (message.items) {
      obj.items = message.items.map((e) => (e ? Locale.toJSON(e) : undefined));
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

  fromPartial<I extends Exact<DeepPartial<LocaleList>, I>>(
    object: I
  ): LocaleList {
    const message = createBaseLocaleList();
    message.items = object.items?.map((e) => Locale.fromPartial(e)) || [];
    message.total_count = object.total_count ?? 0;
    message.subject =
      object.subject !== undefined && object.subject !== null
        ? Subject.fromPartial(object.subject)
        : undefined;
    return message;
  },
};

function createBaseLocaleListResponse(): LocaleListResponse {
  return { items: [], total_count: 0, operation_status: undefined };
}

export const LocaleListResponse = {
  encode(
    message: LocaleListResponse,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    for (const v of message.items) {
      LocaleResponse.encode(v!, writer.uint32(10).fork()).ldelim();
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

  decode(input: _m0.Reader | Uint8Array, length?: number): LocaleListResponse {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseLocaleListResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.items.push(LocaleResponse.decode(reader, reader.uint32()));
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

  fromJSON(object: any): LocaleListResponse {
    return {
      items: Array.isArray(object?.items)
        ? object.items.map((e: any) => LocaleResponse.fromJSON(e))
        : [],
      total_count: isSet(object.total_count) ? Number(object.total_count) : 0,
      operation_status: isSet(object.operation_status)
        ? OperationStatus.fromJSON(object.operation_status)
        : undefined,
    };
  },

  toJSON(message: LocaleListResponse): unknown {
    const obj: any = {};
    if (message.items) {
      obj.items = message.items.map((e) =>
        e ? LocaleResponse.toJSON(e) : undefined
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

  fromPartial<I extends Exact<DeepPartial<LocaleListResponse>, I>>(
    object: I
  ): LocaleListResponse {
    const message = createBaseLocaleListResponse();
    message.items =
      object.items?.map((e) => LocaleResponse.fromPartial(e)) || [];
    message.total_count = object.total_count ?? 0;
    message.operation_status =
      object.operation_status !== undefined && object.operation_status !== null
        ? OperationStatus.fromPartial(object.operation_status)
        : undefined;
    return message;
  },
};

function createBaseLocaleResponse(): LocaleResponse {
  return { payload: undefined, status: undefined };
}

export const LocaleResponse = {
  encode(
    message: LocaleResponse,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.payload !== undefined) {
      Locale.encode(message.payload, writer.uint32(10).fork()).ldelim();
    }
    if (message.status !== undefined) {
      Status.encode(message.status, writer.uint32(18).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): LocaleResponse {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseLocaleResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.payload = Locale.decode(reader, reader.uint32());
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

  fromJSON(object: any): LocaleResponse {
    return {
      payload: isSet(object.payload)
        ? Locale.fromJSON(object.payload)
        : undefined,
      status: isSet(object.status) ? Status.fromJSON(object.status) : undefined,
    };
  },

  toJSON(message: LocaleResponse): unknown {
    const obj: any = {};
    message.payload !== undefined &&
      (obj.payload = message.payload
        ? Locale.toJSON(message.payload)
        : undefined);
    message.status !== undefined &&
      (obj.status = message.status ? Status.toJSON(message.status) : undefined);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<LocaleResponse>, I>>(
    object: I
  ): LocaleResponse {
    const message = createBaseLocaleResponse();
    message.payload =
      object.payload !== undefined && object.payload !== null
        ? Locale.fromPartial(object.payload)
        : undefined;
    message.status =
      object.status !== undefined && object.status !== null
        ? Status.fromPartial(object.status)
        : undefined;
    return message;
  },
};

function createBaseLocale(): Locale {
  return { id: "", meta: undefined, value: "", description: "" };
}

export const Locale = {
  encode(
    message: Locale,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.id !== "") {
      writer.uint32(10).string(message.id);
    }
    if (message.meta !== undefined) {
      Meta.encode(message.meta, writer.uint32(18).fork()).ldelim();
    }
    if (message.value !== "") {
      writer.uint32(26).string(message.value);
    }
    if (message.description !== "") {
      writer.uint32(34).string(message.description);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Locale {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseLocale();
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
          message.value = reader.string();
          break;
        case 4:
          message.description = reader.string();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): Locale {
    return {
      id: isSet(object.id) ? String(object.id) : "",
      meta: isSet(object.meta) ? Meta.fromJSON(object.meta) : undefined,
      value: isSet(object.value) ? String(object.value) : "",
      description: isSet(object.description) ? String(object.description) : "",
    };
  },

  toJSON(message: Locale): unknown {
    const obj: any = {};
    message.id !== undefined && (obj.id = message.id);
    message.meta !== undefined &&
      (obj.meta = message.meta ? Meta.toJSON(message.meta) : undefined);
    message.value !== undefined && (obj.value = message.value);
    message.description !== undefined &&
      (obj.description = message.description);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<Locale>, I>>(object: I): Locale {
    const message = createBaseLocale();
    message.id = object.id ?? "";
    message.meta =
      object.meta !== undefined && object.meta !== null
        ? Meta.fromPartial(object.meta)
        : undefined;
    message.value = object.value ?? "";
    message.description = object.description ?? "";
    return message;
  },
};

/** Microservice definition. */
export interface Service {
  Read(request: ReadRequest): Promise<LocaleListResponse>;
  Create(request: LocaleList): Promise<LocaleListResponse>;
  Delete(request: DeleteRequest): Promise<DeleteResponse>;
  Update(request: LocaleList): Promise<LocaleListResponse>;
  Upsert(request: LocaleList): Promise<LocaleListResponse>;
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

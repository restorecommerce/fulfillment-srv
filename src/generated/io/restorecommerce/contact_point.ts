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

export const protobufPackage = "io.restorecommerce.contact_point";

export interface Deleted {
  id: string;
}

export interface ContactPointList {
  items: ContactPoint[];
  total_count: number;
  subject: Subject;
}

export interface ContactPointListResponse {
  items: ContactPointResponse[];
  total_count: number;
  operation_status: OperationStatus;
}

export interface ContactPointResponse {
  payload: ContactPoint;
  status: Status;
}

export interface ContactPoint {
  id: string;
  meta: Meta;
  physical_address_id: string;
  website: string;
  email: string;
  contact_point_type_id: string;
  telephone: string;
  timezone_id: string;
  locale_id: string;
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

function createBaseContactPointList(): ContactPointList {
  return { items: [], total_count: 0, subject: undefined };
}

export const ContactPointList = {
  encode(
    message: ContactPointList,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    for (const v of message.items) {
      ContactPoint.encode(v!, writer.uint32(10).fork()).ldelim();
    }
    if (message.total_count !== 0) {
      writer.uint32(16).uint32(message.total_count);
    }
    if (message.subject !== undefined) {
      Subject.encode(message.subject, writer.uint32(26).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ContactPointList {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseContactPointList();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.items.push(ContactPoint.decode(reader, reader.uint32()));
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

  fromJSON(object: any): ContactPointList {
    return {
      items: Array.isArray(object?.items)
        ? object.items.map((e: any) => ContactPoint.fromJSON(e))
        : [],
      total_count: isSet(object.total_count) ? Number(object.total_count) : 0,
      subject: isSet(object.subject)
        ? Subject.fromJSON(object.subject)
        : undefined,
    };
  },

  toJSON(message: ContactPointList): unknown {
    const obj: any = {};
    if (message.items) {
      obj.items = message.items.map((e) =>
        e ? ContactPoint.toJSON(e) : undefined
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

  fromPartial<I extends Exact<DeepPartial<ContactPointList>, I>>(
    object: I
  ): ContactPointList {
    const message = createBaseContactPointList();
    message.items = object.items?.map((e) => ContactPoint.fromPartial(e)) || [];
    message.total_count = object.total_count ?? 0;
    message.subject =
      object.subject !== undefined && object.subject !== null
        ? Subject.fromPartial(object.subject)
        : undefined;
    return message;
  },
};

function createBaseContactPointListResponse(): ContactPointListResponse {
  return { items: [], total_count: 0, operation_status: undefined };
}

export const ContactPointListResponse = {
  encode(
    message: ContactPointListResponse,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    for (const v of message.items) {
      ContactPointResponse.encode(v!, writer.uint32(10).fork()).ldelim();
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
  ): ContactPointListResponse {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseContactPointListResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.items.push(
            ContactPointResponse.decode(reader, reader.uint32())
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

  fromJSON(object: any): ContactPointListResponse {
    return {
      items: Array.isArray(object?.items)
        ? object.items.map((e: any) => ContactPointResponse.fromJSON(e))
        : [],
      total_count: isSet(object.total_count) ? Number(object.total_count) : 0,
      operation_status: isSet(object.operation_status)
        ? OperationStatus.fromJSON(object.operation_status)
        : undefined,
    };
  },

  toJSON(message: ContactPointListResponse): unknown {
    const obj: any = {};
    if (message.items) {
      obj.items = message.items.map((e) =>
        e ? ContactPointResponse.toJSON(e) : undefined
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

  fromPartial<I extends Exact<DeepPartial<ContactPointListResponse>, I>>(
    object: I
  ): ContactPointListResponse {
    const message = createBaseContactPointListResponse();
    message.items =
      object.items?.map((e) => ContactPointResponse.fromPartial(e)) || [];
    message.total_count = object.total_count ?? 0;
    message.operation_status =
      object.operation_status !== undefined && object.operation_status !== null
        ? OperationStatus.fromPartial(object.operation_status)
        : undefined;
    return message;
  },
};

function createBaseContactPointResponse(): ContactPointResponse {
  return { payload: undefined, status: undefined };
}

export const ContactPointResponse = {
  encode(
    message: ContactPointResponse,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.payload !== undefined) {
      ContactPoint.encode(message.payload, writer.uint32(10).fork()).ldelim();
    }
    if (message.status !== undefined) {
      Status.encode(message.status, writer.uint32(18).fork()).ldelim();
    }
    return writer;
  },

  decode(
    input: _m0.Reader | Uint8Array,
    length?: number
  ): ContactPointResponse {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseContactPointResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.payload = ContactPoint.decode(reader, reader.uint32());
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

  fromJSON(object: any): ContactPointResponse {
    return {
      payload: isSet(object.payload)
        ? ContactPoint.fromJSON(object.payload)
        : undefined,
      status: isSet(object.status) ? Status.fromJSON(object.status) : undefined,
    };
  },

  toJSON(message: ContactPointResponse): unknown {
    const obj: any = {};
    message.payload !== undefined &&
      (obj.payload = message.payload
        ? ContactPoint.toJSON(message.payload)
        : undefined);
    message.status !== undefined &&
      (obj.status = message.status ? Status.toJSON(message.status) : undefined);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<ContactPointResponse>, I>>(
    object: I
  ): ContactPointResponse {
    const message = createBaseContactPointResponse();
    message.payload =
      object.payload !== undefined && object.payload !== null
        ? ContactPoint.fromPartial(object.payload)
        : undefined;
    message.status =
      object.status !== undefined && object.status !== null
        ? Status.fromPartial(object.status)
        : undefined;
    return message;
  },
};

function createBaseContactPoint(): ContactPoint {
  return {
    id: "",
    meta: undefined,
    physical_address_id: "",
    website: "",
    email: "",
    contact_point_type_id: "",
    telephone: "",
    timezone_id: "",
    locale_id: "",
  };
}

export const ContactPoint = {
  encode(
    message: ContactPoint,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.id !== "") {
      writer.uint32(10).string(message.id);
    }
    if (message.meta !== undefined) {
      Meta.encode(message.meta, writer.uint32(18).fork()).ldelim();
    }
    if (message.physical_address_id !== "") {
      writer.uint32(26).string(message.physical_address_id);
    }
    if (message.website !== "") {
      writer.uint32(34).string(message.website);
    }
    if (message.email !== "") {
      writer.uint32(42).string(message.email);
    }
    if (message.contact_point_type_id !== "") {
      writer.uint32(50).string(message.contact_point_type_id);
    }
    if (message.telephone !== "") {
      writer.uint32(66).string(message.telephone);
    }
    if (message.timezone_id !== "") {
      writer.uint32(74).string(message.timezone_id);
    }
    if (message.locale_id !== "") {
      writer.uint32(82).string(message.locale_id);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ContactPoint {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseContactPoint();
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
          message.physical_address_id = reader.string();
          break;
        case 4:
          message.website = reader.string();
          break;
        case 5:
          message.email = reader.string();
          break;
        case 6:
          message.contact_point_type_id = reader.string();
          break;
        case 8:
          message.telephone = reader.string();
          break;
        case 9:
          message.timezone_id = reader.string();
          break;
        case 10:
          message.locale_id = reader.string();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): ContactPoint {
    return {
      id: isSet(object.id) ? String(object.id) : "",
      meta: isSet(object.meta) ? Meta.fromJSON(object.meta) : undefined,
      physical_address_id: isSet(object.physical_address_id)
        ? String(object.physical_address_id)
        : "",
      website: isSet(object.website) ? String(object.website) : "",
      email: isSet(object.email) ? String(object.email) : "",
      contact_point_type_id: isSet(object.contact_point_type_id)
        ? String(object.contact_point_type_id)
        : "",
      telephone: isSet(object.telephone) ? String(object.telephone) : "",
      timezone_id: isSet(object.timezone_id) ? String(object.timezone_id) : "",
      locale_id: isSet(object.locale_id) ? String(object.locale_id) : "",
    };
  },

  toJSON(message: ContactPoint): unknown {
    const obj: any = {};
    message.id !== undefined && (obj.id = message.id);
    message.meta !== undefined &&
      (obj.meta = message.meta ? Meta.toJSON(message.meta) : undefined);
    message.physical_address_id !== undefined &&
      (obj.physical_address_id = message.physical_address_id);
    message.website !== undefined && (obj.website = message.website);
    message.email !== undefined && (obj.email = message.email);
    message.contact_point_type_id !== undefined &&
      (obj.contact_point_type_id = message.contact_point_type_id);
    message.telephone !== undefined && (obj.telephone = message.telephone);
    message.timezone_id !== undefined &&
      (obj.timezone_id = message.timezone_id);
    message.locale_id !== undefined && (obj.locale_id = message.locale_id);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<ContactPoint>, I>>(
    object: I
  ): ContactPoint {
    const message = createBaseContactPoint();
    message.id = object.id ?? "";
    message.meta =
      object.meta !== undefined && object.meta !== null
        ? Meta.fromPartial(object.meta)
        : undefined;
    message.physical_address_id = object.physical_address_id ?? "";
    message.website = object.website ?? "";
    message.email = object.email ?? "";
    message.contact_point_type_id = object.contact_point_type_id ?? "";
    message.telephone = object.telephone ?? "";
    message.timezone_id = object.timezone_id ?? "";
    message.locale_id = object.locale_id ?? "";
    return message;
  },
};

export interface Service {
  Read(request: ReadRequest): Promise<ContactPointListResponse>;
  Create(request: ContactPointList): Promise<ContactPointListResponse>;
  Delete(request: DeleteRequest): Promise<DeleteResponse>;
  Update(request: ContactPointList): Promise<ContactPointListResponse>;
  Upsert(request: ContactPointList): Promise<ContactPointListResponse>;
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

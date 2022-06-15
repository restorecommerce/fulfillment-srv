/* eslint-disable */
import * as Long from "long";
import * as _m0 from "protobufjs/minimal";
import { Any } from "../../google/protobuf/any";
import { Meta } from "../../io/restorecommerce/meta";
import { Subject } from "../../io/restorecommerce/auth";
import { Status, OperationStatus } from "../../io/restorecommerce/status";
import {
  DeleteResponse,
  ReadRequest,
  DeleteRequest,
} from "../../io/restorecommerce/resource_base";

export const protobufPackage = "io.restorecommerce.fulfillment_courier";

export interface FulfillmentCourier {
  id: string;
  name: string;
  description: string;
  logo: string;
  website: string;
  stub_type: string;
  configuration: Any;
  meta: Meta;
}

export interface FulfillmentCourierList {
  items: FulfillmentCourier[];
  total_count: number;
  subject: Subject;
}

export interface FulfillmentCourierResponse {
  payload: FulfillmentCourier;
  status: Status;
}

export interface FulfillmentCourierResponseList {
  items: FulfillmentCourierResponse[];
  total_count: number;
  operation_status: OperationStatus;
}

export interface Deleted {
  id: string;
}

function createBaseFulfillmentCourier(): FulfillmentCourier {
  return {
    id: "",
    name: "",
    description: "",
    logo: "",
    website: "",
    stub_type: "",
    configuration: undefined,
    meta: undefined,
  };
}

export const FulfillmentCourier = {
  encode(
    message: FulfillmentCourier,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.id !== "") {
      writer.uint32(10).string(message.id);
    }
    if (message.name !== "") {
      writer.uint32(34).string(message.name);
    }
    if (message.description !== "") {
      writer.uint32(42).string(message.description);
    }
    if (message.logo !== "") {
      writer.uint32(50).string(message.logo);
    }
    if (message.website !== "") {
      writer.uint32(58).string(message.website);
    }
    if (message.stub_type !== "") {
      writer.uint32(66).string(message.stub_type);
    }
    if (message.configuration !== undefined) {
      Any.encode(message.configuration, writer.uint32(82).fork()).ldelim();
    }
    if (message.meta !== undefined) {
      Meta.encode(message.meta, writer.uint32(90).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): FulfillmentCourier {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseFulfillmentCourier();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.id = reader.string();
          break;
        case 4:
          message.name = reader.string();
          break;
        case 5:
          message.description = reader.string();
          break;
        case 6:
          message.logo = reader.string();
          break;
        case 7:
          message.website = reader.string();
          break;
        case 8:
          message.stub_type = reader.string();
          break;
        case 10:
          message.configuration = Any.decode(reader, reader.uint32());
          break;
        case 11:
          message.meta = Meta.decode(reader, reader.uint32());
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): FulfillmentCourier {
    return {
      id: isSet(object.id) ? String(object.id) : "",
      name: isSet(object.name) ? String(object.name) : "",
      description: isSet(object.description) ? String(object.description) : "",
      logo: isSet(object.logo) ? String(object.logo) : "",
      website: isSet(object.website) ? String(object.website) : "",
      stub_type: isSet(object.stub_type) ? String(object.stub_type) : "",
      configuration: isSet(object.configuration)
        ? Any.fromJSON(object.configuration)
        : undefined,
      meta: isSet(object.meta) ? Meta.fromJSON(object.meta) : undefined,
    };
  },

  toJSON(message: FulfillmentCourier): unknown {
    const obj: any = {};
    message.id !== undefined && (obj.id = message.id);
    message.name !== undefined && (obj.name = message.name);
    message.description !== undefined &&
      (obj.description = message.description);
    message.logo !== undefined && (obj.logo = message.logo);
    message.website !== undefined && (obj.website = message.website);
    message.stub_type !== undefined && (obj.stub_type = message.stub_type);
    message.configuration !== undefined &&
      (obj.configuration = message.configuration
        ? Any.toJSON(message.configuration)
        : undefined);
    message.meta !== undefined &&
      (obj.meta = message.meta ? Meta.toJSON(message.meta) : undefined);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<FulfillmentCourier>, I>>(
    object: I
  ): FulfillmentCourier {
    const message = createBaseFulfillmentCourier();
    message.id = object.id ?? "";
    message.name = object.name ?? "";
    message.description = object.description ?? "";
    message.logo = object.logo ?? "";
    message.website = object.website ?? "";
    message.stub_type = object.stub_type ?? "";
    message.configuration =
      object.configuration !== undefined && object.configuration !== null
        ? Any.fromPartial(object.configuration)
        : undefined;
    message.meta =
      object.meta !== undefined && object.meta !== null
        ? Meta.fromPartial(object.meta)
        : undefined;
    return message;
  },
};

function createBaseFulfillmentCourierList(): FulfillmentCourierList {
  return { items: [], total_count: 0, subject: undefined };
}

export const FulfillmentCourierList = {
  encode(
    message: FulfillmentCourierList,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    for (const v of message.items) {
      FulfillmentCourier.encode(v!, writer.uint32(10).fork()).ldelim();
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
  ): FulfillmentCourierList {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseFulfillmentCourierList();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.items.push(
            FulfillmentCourier.decode(reader, reader.uint32())
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

  fromJSON(object: any): FulfillmentCourierList {
    return {
      items: Array.isArray(object?.items)
        ? object.items.map((e: any) => FulfillmentCourier.fromJSON(e))
        : [],
      total_count: isSet(object.total_count) ? Number(object.total_count) : 0,
      subject: isSet(object.subject)
        ? Subject.fromJSON(object.subject)
        : undefined,
    };
  },

  toJSON(message: FulfillmentCourierList): unknown {
    const obj: any = {};
    if (message.items) {
      obj.items = message.items.map((e) =>
        e ? FulfillmentCourier.toJSON(e) : undefined
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

  fromPartial<I extends Exact<DeepPartial<FulfillmentCourierList>, I>>(
    object: I
  ): FulfillmentCourierList {
    const message = createBaseFulfillmentCourierList();
    message.items =
      object.items?.map((e) => FulfillmentCourier.fromPartial(e)) || [];
    message.total_count = object.total_count ?? 0;
    message.subject =
      object.subject !== undefined && object.subject !== null
        ? Subject.fromPartial(object.subject)
        : undefined;
    return message;
  },
};

function createBaseFulfillmentCourierResponse(): FulfillmentCourierResponse {
  return { payload: undefined, status: undefined };
}

export const FulfillmentCourierResponse = {
  encode(
    message: FulfillmentCourierResponse,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.payload !== undefined) {
      FulfillmentCourier.encode(
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
  ): FulfillmentCourierResponse {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseFulfillmentCourierResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.payload = FulfillmentCourier.decode(reader, reader.uint32());
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

  fromJSON(object: any): FulfillmentCourierResponse {
    return {
      payload: isSet(object.payload)
        ? FulfillmentCourier.fromJSON(object.payload)
        : undefined,
      status: isSet(object.status) ? Status.fromJSON(object.status) : undefined,
    };
  },

  toJSON(message: FulfillmentCourierResponse): unknown {
    const obj: any = {};
    message.payload !== undefined &&
      (obj.payload = message.payload
        ? FulfillmentCourier.toJSON(message.payload)
        : undefined);
    message.status !== undefined &&
      (obj.status = message.status ? Status.toJSON(message.status) : undefined);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<FulfillmentCourierResponse>, I>>(
    object: I
  ): FulfillmentCourierResponse {
    const message = createBaseFulfillmentCourierResponse();
    message.payload =
      object.payload !== undefined && object.payload !== null
        ? FulfillmentCourier.fromPartial(object.payload)
        : undefined;
    message.status =
      object.status !== undefined && object.status !== null
        ? Status.fromPartial(object.status)
        : undefined;
    return message;
  },
};

function createBaseFulfillmentCourierResponseList(): FulfillmentCourierResponseList {
  return { items: [], total_count: 0, operation_status: undefined };
}

export const FulfillmentCourierResponseList = {
  encode(
    message: FulfillmentCourierResponseList,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    for (const v of message.items) {
      FulfillmentCourierResponse.encode(v!, writer.uint32(10).fork()).ldelim();
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
  ): FulfillmentCourierResponseList {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseFulfillmentCourierResponseList();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.items.push(
            FulfillmentCourierResponse.decode(reader, reader.uint32())
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

  fromJSON(object: any): FulfillmentCourierResponseList {
    return {
      items: Array.isArray(object?.items)
        ? object.items.map((e: any) => FulfillmentCourierResponse.fromJSON(e))
        : [],
      total_count: isSet(object.total_count) ? Number(object.total_count) : 0,
      operation_status: isSet(object.operation_status)
        ? OperationStatus.fromJSON(object.operation_status)
        : undefined,
    };
  },

  toJSON(message: FulfillmentCourierResponseList): unknown {
    const obj: any = {};
    if (message.items) {
      obj.items = message.items.map((e) =>
        e ? FulfillmentCourierResponse.toJSON(e) : undefined
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

  fromPartial<I extends Exact<DeepPartial<FulfillmentCourierResponseList>, I>>(
    object: I
  ): FulfillmentCourierResponseList {
    const message = createBaseFulfillmentCourierResponseList();
    message.items =
      object.items?.map((e) => FulfillmentCourierResponse.fromPartial(e)) || [];
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
  Read(request: ReadRequest): Promise<FulfillmentCourierResponseList>;
  Create(
    request: FulfillmentCourierList
  ): Promise<FulfillmentCourierResponseList>;
  Update(
    request: FulfillmentCourierList
  ): Promise<FulfillmentCourierResponseList>;
  Upsert(
    request: FulfillmentCourierList
  ): Promise<FulfillmentCourierResponseList>;
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

// If you get a compile-error about 'Constructor<Long> and ... have no overlap',
// add '--ts_proto_opt=esModuleInterop=true' as a flag when calling 'protoc'.
if (_m0.util.Long !== Long) {
  _m0.util.Long = Long as any;
  _m0.configure();
}

function isSet(value: any): boolean {
  return value !== null && value !== undefined;
}

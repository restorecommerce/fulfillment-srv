/* eslint-disable */
import * as Long from "long";
import * as _m0 from "protobufjs/minimal";

export const protobufPackage = "io.restorecommerce.status";

export interface Status {
  id: string;
  code: number;
  message: string;
}

export interface StatusArray {
  status: Status[];
}

export interface StatusObj {
  status: Status;
}

export interface OperationStatusObj {
  operation_status: OperationStatus;
}

export interface OperationStatus {
  code: number;
  message: string;
}

function createBaseStatus(): Status {
  return { id: "", code: 0, message: "" };
}

export const Status = {
  encode(
    message: Status,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.id !== "") {
      writer.uint32(10).string(message.id);
    }
    if (message.code !== 0) {
      writer.uint32(16).uint32(message.code);
    }
    if (message.message !== "") {
      writer.uint32(26).string(message.message);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Status {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseStatus();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.id = reader.string();
          break;
        case 2:
          message.code = reader.uint32();
          break;
        case 3:
          message.message = reader.string();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): Status {
    return {
      id: isSet(object.id) ? String(object.id) : "",
      code: isSet(object.code) ? Number(object.code) : 0,
      message: isSet(object.message) ? String(object.message) : "",
    };
  },

  toJSON(message: Status): unknown {
    const obj: any = {};
    message.id !== undefined && (obj.id = message.id);
    message.code !== undefined && (obj.code = Math.round(message.code));
    message.message !== undefined && (obj.message = message.message);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<Status>, I>>(object: I): Status {
    const message = createBaseStatus();
    message.id = object.id ?? "";
    message.code = object.code ?? 0;
    message.message = object.message ?? "";
    return message;
  },
};

function createBaseStatusArray(): StatusArray {
  return { status: [] };
}

export const StatusArray = {
  encode(
    message: StatusArray,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    for (const v of message.status) {
      Status.encode(v!, writer.uint32(10).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): StatusArray {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseStatusArray();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.status.push(Status.decode(reader, reader.uint32()));
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): StatusArray {
    return {
      status: Array.isArray(object?.status)
        ? object.status.map((e: any) => Status.fromJSON(e))
        : [],
    };
  },

  toJSON(message: StatusArray): unknown {
    const obj: any = {};
    if (message.status) {
      obj.status = message.status.map((e) =>
        e ? Status.toJSON(e) : undefined
      );
    } else {
      obj.status = [];
    }
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<StatusArray>, I>>(
    object: I
  ): StatusArray {
    const message = createBaseStatusArray();
    message.status = object.status?.map((e) => Status.fromPartial(e)) || [];
    return message;
  },
};

function createBaseStatusObj(): StatusObj {
  return { status: undefined };
}

export const StatusObj = {
  encode(
    message: StatusObj,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.status !== undefined) {
      Status.encode(message.status, writer.uint32(10).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): StatusObj {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseStatusObj();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.status = Status.decode(reader, reader.uint32());
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): StatusObj {
    return {
      status: isSet(object.status) ? Status.fromJSON(object.status) : undefined,
    };
  },

  toJSON(message: StatusObj): unknown {
    const obj: any = {};
    message.status !== undefined &&
      (obj.status = message.status ? Status.toJSON(message.status) : undefined);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<StatusObj>, I>>(
    object: I
  ): StatusObj {
    const message = createBaseStatusObj();
    message.status =
      object.status !== undefined && object.status !== null
        ? Status.fromPartial(object.status)
        : undefined;
    return message;
  },
};

function createBaseOperationStatusObj(): OperationStatusObj {
  return { operation_status: undefined };
}

export const OperationStatusObj = {
  encode(
    message: OperationStatusObj,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.operation_status !== undefined) {
      OperationStatus.encode(
        message.operation_status,
        writer.uint32(10).fork()
      ).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): OperationStatusObj {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseOperationStatusObj();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
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

  fromJSON(object: any): OperationStatusObj {
    return {
      operation_status: isSet(object.operation_status)
        ? OperationStatus.fromJSON(object.operation_status)
        : undefined,
    };
  },

  toJSON(message: OperationStatusObj): unknown {
    const obj: any = {};
    message.operation_status !== undefined &&
      (obj.operation_status = message.operation_status
        ? OperationStatus.toJSON(message.operation_status)
        : undefined);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<OperationStatusObj>, I>>(
    object: I
  ): OperationStatusObj {
    const message = createBaseOperationStatusObj();
    message.operation_status =
      object.operation_status !== undefined && object.operation_status !== null
        ? OperationStatus.fromPartial(object.operation_status)
        : undefined;
    return message;
  },
};

function createBaseOperationStatus(): OperationStatus {
  return { code: 0, message: "" };
}

export const OperationStatus = {
  encode(
    message: OperationStatus,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.code !== 0) {
      writer.uint32(8).uint32(message.code);
    }
    if (message.message !== "") {
      writer.uint32(18).string(message.message);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): OperationStatus {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseOperationStatus();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.code = reader.uint32();
          break;
        case 2:
          message.message = reader.string();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): OperationStatus {
    return {
      code: isSet(object.code) ? Number(object.code) : 0,
      message: isSet(object.message) ? String(object.message) : "",
    };
  },

  toJSON(message: OperationStatus): unknown {
    const obj: any = {};
    message.code !== undefined && (obj.code = Math.round(message.code));
    message.message !== undefined && (obj.message = message.message);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<OperationStatus>, I>>(
    object: I
  ): OperationStatus {
    const message = createBaseOperationStatus();
    message.code = object.code ?? 0;
    message.message = object.message ?? "";
    return message;
  },
};

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

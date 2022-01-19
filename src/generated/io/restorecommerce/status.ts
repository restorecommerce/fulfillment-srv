/* eslint-disable */
import { FileDescriptorProto } from "ts-proto-descriptors/google/protobuf/descriptor";
import { Writer, Reader } from "protobufjs/minimal";

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
  status?: Status;
}

export interface OperationStatusObj {
  operation_status?: OperationStatus;
}

export interface OperationStatus {
  code: number;
  message: string;
}

const baseStatus: object = { id: "", code: 0, message: "" };

export const Status = {
  encode(message: Status, writer: Writer = Writer.create()): Writer {
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

  decode(input: Reader | Uint8Array, length?: number): Status {
    const reader = input instanceof Uint8Array ? new Reader(input) : input;
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = globalThis.Object.create(baseStatus) as Status;
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
    const message = globalThis.Object.create(baseStatus) as Status;
    if (object.id !== undefined && object.id !== null) {
      message.id = String(object.id);
    } else {
      message.id = "";
    }
    if (object.code !== undefined && object.code !== null) {
      message.code = Number(object.code);
    } else {
      message.code = 0;
    }
    if (object.message !== undefined && object.message !== null) {
      message.message = String(object.message);
    } else {
      message.message = "";
    }
    return message;
  },

  fromPartial(object: DeepPartial<Status>): Status {
    const message = { ...baseStatus } as Status;
    if (object.id !== undefined && object.id !== null) {
      message.id = object.id;
    } else {
      message.id = "";
    }
    if (object.code !== undefined && object.code !== null) {
      message.code = object.code;
    } else {
      message.code = 0;
    }
    if (object.message !== undefined && object.message !== null) {
      message.message = object.message;
    } else {
      message.message = "";
    }
    return message;
  },

  toJSON(message: Status): unknown {
    const obj: any = {};
    message.id !== undefined && (obj.id = message.id);
    message.code !== undefined && (obj.code = message.code);
    message.message !== undefined && (obj.message = message.message);
    return obj;
  },
};

const baseStatusArray: object = {};

export const StatusArray = {
  encode(message: StatusArray, writer: Writer = Writer.create()): Writer {
    for (const v of message.status) {
      Status.encode(v!, writer.uint32(10).fork()).ldelim();
    }
    return writer;
  },

  decode(input: Reader | Uint8Array, length?: number): StatusArray {
    const reader = input instanceof Uint8Array ? new Reader(input) : input;
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = globalThis.Object.create(baseStatusArray) as StatusArray;
    message.status = [];
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
    const message = globalThis.Object.create(baseStatusArray) as StatusArray;
    message.status = [];
    if (object.status !== undefined && object.status !== null) {
      for (const e of object.status) {
        message.status.push(Status.fromJSON(e));
      }
    }
    return message;
  },

  fromPartial(object: DeepPartial<StatusArray>): StatusArray {
    const message = { ...baseStatusArray } as StatusArray;
    message.status = [];
    if (object.status !== undefined && object.status !== null) {
      for (const e of object.status) {
        message.status.push(Status.fromPartial(e));
      }
    }
    return message;
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
};

const baseStatusObj: object = {};

export const StatusObj = {
  encode(message: StatusObj, writer: Writer = Writer.create()): Writer {
    if (message.status !== undefined) {
      Status.encode(message.status, writer.uint32(10).fork()).ldelim();
    }
    return writer;
  },

  decode(input: Reader | Uint8Array, length?: number): StatusObj {
    const reader = input instanceof Uint8Array ? new Reader(input) : input;
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = globalThis.Object.create(baseStatusObj) as StatusObj;
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
    const message = globalThis.Object.create(baseStatusObj) as StatusObj;
    if (object.status !== undefined && object.status !== null) {
      message.status = Status.fromJSON(object.status);
    } else {
      message.status = undefined;
    }
    return message;
  },

  fromPartial(object: DeepPartial<StatusObj>): StatusObj {
    const message = { ...baseStatusObj } as StatusObj;
    if (object.status !== undefined && object.status !== null) {
      message.status = Status.fromPartial(object.status);
    } else {
      message.status = undefined;
    }
    return message;
  },

  toJSON(message: StatusObj): unknown {
    const obj: any = {};
    message.status !== undefined &&
      (obj.status = message.status ? Status.toJSON(message.status) : undefined);
    return obj;
  },
};

const baseOperationStatusObj: object = {};

export const OperationStatusObj = {
  encode(
    message: OperationStatusObj,
    writer: Writer = Writer.create()
  ): Writer {
    if (message.operation_status !== undefined) {
      OperationStatus.encode(
        message.operation_status,
        writer.uint32(10).fork()
      ).ldelim();
    }
    return writer;
  },

  decode(input: Reader | Uint8Array, length?: number): OperationStatusObj {
    const reader = input instanceof Uint8Array ? new Reader(input) : input;
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = globalThis.Object.create(
      baseOperationStatusObj
    ) as OperationStatusObj;
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
    const message = globalThis.Object.create(
      baseOperationStatusObj
    ) as OperationStatusObj;
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

  fromPartial(object: DeepPartial<OperationStatusObj>): OperationStatusObj {
    const message = { ...baseOperationStatusObj } as OperationStatusObj;
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

  toJSON(message: OperationStatusObj): unknown {
    const obj: any = {};
    message.operation_status !== undefined &&
      (obj.operation_status = message.operation_status
        ? OperationStatus.toJSON(message.operation_status)
        : undefined);
    return obj;
  },
};

const baseOperationStatus: object = { code: 0, message: "" };

export const OperationStatus = {
  encode(message: OperationStatus, writer: Writer = Writer.create()): Writer {
    if (message.code !== 0) {
      writer.uint32(8).uint32(message.code);
    }
    if (message.message !== "") {
      writer.uint32(18).string(message.message);
    }
    return writer;
  },

  decode(input: Reader | Uint8Array, length?: number): OperationStatus {
    const reader = input instanceof Uint8Array ? new Reader(input) : input;
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = globalThis.Object.create(
      baseOperationStatus
    ) as OperationStatus;
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
    const message = globalThis.Object.create(
      baseOperationStatus
    ) as OperationStatus;
    if (object.code !== undefined && object.code !== null) {
      message.code = Number(object.code);
    } else {
      message.code = 0;
    }
    if (object.message !== undefined && object.message !== null) {
      message.message = String(object.message);
    } else {
      message.message = "";
    }
    return message;
  },

  fromPartial(object: DeepPartial<OperationStatus>): OperationStatus {
    const message = { ...baseOperationStatus } as OperationStatus;
    if (object.code !== undefined && object.code !== null) {
      message.code = object.code;
    } else {
      message.code = 0;
    }
    if (object.message !== undefined && object.message !== null) {
      message.message = object.message;
    } else {
      message.message = "";
    }
    return message;
  },

  toJSON(message: OperationStatus): unknown {
    const obj: any = {};
    message.code !== undefined && (obj.code = message.code);
    message.message !== undefined && (obj.message = message.message);
    return obj;
  },
};

export interface ProtoMetadata {
  fileDescriptor: FileDescriptorProto;
  references: { [key: string]: any };
  dependencies?: ProtoMetadata[];
}

export const protoMetadata: ProtoMetadata = {
  fileDescriptor: FileDescriptorProto.fromPartial({
    dependency: [],
    publicDependency: [],
    weakDependency: [],
    messageType: [
      {
        field: [
          { name: "id", number: 1, label: 1, type: 9, jsonName: "id" },
          { name: "code", number: 2, label: 1, type: 13, jsonName: "code" },
          {
            name: "message",
            number: 3,
            label: 1,
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
        name: "Status",
      },
      {
        field: [
          {
            name: "status",
            number: 1,
            label: 3,
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
        name: "StatusArray",
      },
      {
        field: [
          {
            name: "status",
            number: 1,
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
        name: "StatusObj",
      },
      {
        field: [
          {
            name: "operation_status",
            number: 1,
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
        name: "OperationStatusObj",
      },
      {
        field: [
          { name: "code", number: 1, label: 1, type: 13, jsonName: "code" },
          {
            name: "message",
            number: 2,
            label: 1,
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
        name: "OperationStatus",
      },
    ],
    enumType: [],
    service: [],
    extension: [],
    name: "io/restorecommerce/status.proto",
    package: "io.restorecommerce.status",
    sourceCodeInfo: { location: [] },
    syntax: "proto3",
  }),
  references: {
    ".io.restorecommerce.status.Status": Status,
    ".io.restorecommerce.status.StatusArray": StatusArray,
    ".io.restorecommerce.status.StatusObj": StatusObj,
    ".io.restorecommerce.status.OperationStatusObj": OperationStatusObj,
    ".io.restorecommerce.status.OperationStatus": OperationStatus,
  },
  dependencies: [],
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

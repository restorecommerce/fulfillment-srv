/* eslint-disable */
import * as Long from "long";
import * as _m0 from "protobufjs/minimal";

export const protobufPackage = "io.restorecommerce.options";

export interface Resolver {
  targetType: string;
  targetService: string;
  targetSubService: string;
  targetMethod: string;
  fieldName: string;
}

function createBaseResolver(): Resolver {
  return {
    targetType: "",
    targetService: "",
    targetSubService: "",
    targetMethod: "",
    fieldName: "",
  };
}

export const Resolver = {
  encode(
    message: Resolver,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.targetType !== "") {
      writer.uint32(10).string(message.targetType);
    }
    if (message.targetService !== "") {
      writer.uint32(18).string(message.targetService);
    }
    if (message.targetSubService !== "") {
      writer.uint32(26).string(message.targetSubService);
    }
    if (message.targetMethod !== "") {
      writer.uint32(34).string(message.targetMethod);
    }
    if (message.fieldName !== "") {
      writer.uint32(42).string(message.fieldName);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Resolver {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseResolver();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.targetType = reader.string();
          break;
        case 2:
          message.targetService = reader.string();
          break;
        case 3:
          message.targetSubService = reader.string();
          break;
        case 4:
          message.targetMethod = reader.string();
          break;
        case 5:
          message.fieldName = reader.string();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): Resolver {
    return {
      targetType: isSet(object.targetType) ? String(object.targetType) : "",
      targetService: isSet(object.targetService)
        ? String(object.targetService)
        : "",
      targetSubService: isSet(object.targetSubService)
        ? String(object.targetSubService)
        : "",
      targetMethod: isSet(object.targetMethod)
        ? String(object.targetMethod)
        : "",
      fieldName: isSet(object.fieldName) ? String(object.fieldName) : "",
    };
  },

  toJSON(message: Resolver): unknown {
    const obj: any = {};
    message.targetType !== undefined && (obj.targetType = message.targetType);
    message.targetService !== undefined &&
      (obj.targetService = message.targetService);
    message.targetSubService !== undefined &&
      (obj.targetSubService = message.targetSubService);
    message.targetMethod !== undefined &&
      (obj.targetMethod = message.targetMethod);
    message.fieldName !== undefined && (obj.fieldName = message.fieldName);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<Resolver>, I>>(object: I): Resolver {
    const message = createBaseResolver();
    message.targetType = object.targetType ?? "";
    message.targetService = object.targetService ?? "";
    message.targetSubService = object.targetSubService ?? "";
    message.targetMethod = object.targetMethod ?? "";
    message.fieldName = object.fieldName ?? "";
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

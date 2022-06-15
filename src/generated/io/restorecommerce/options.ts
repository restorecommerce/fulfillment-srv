/* eslint-disable */
import * as Long from "long";
import * as _m0 from "protobufjs/minimal";

export const protobufPackage = "io.restorecommerce.options";

export interface Resolver {
  target_type: string;
  target_service: string;
  target_sub_service: string;
  target_method: string;
  field_name: string;
}

function createBaseResolver(): Resolver {
  return {
    target_type: "",
    target_service: "",
    target_sub_service: "",
    target_method: "",
    field_name: "",
  };
}

export const Resolver = {
  encode(
    message: Resolver,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.target_type !== "") {
      writer.uint32(10).string(message.target_type);
    }
    if (message.target_service !== "") {
      writer.uint32(18).string(message.target_service);
    }
    if (message.target_sub_service !== "") {
      writer.uint32(26).string(message.target_sub_service);
    }
    if (message.target_method !== "") {
      writer.uint32(34).string(message.target_method);
    }
    if (message.field_name !== "") {
      writer.uint32(42).string(message.field_name);
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
          message.target_type = reader.string();
          break;
        case 2:
          message.target_service = reader.string();
          break;
        case 3:
          message.target_sub_service = reader.string();
          break;
        case 4:
          message.target_method = reader.string();
          break;
        case 5:
          message.field_name = reader.string();
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
      target_type: isSet(object.target_type) ? String(object.target_type) : "",
      target_service: isSet(object.target_service)
        ? String(object.target_service)
        : "",
      target_sub_service: isSet(object.target_sub_service)
        ? String(object.target_sub_service)
        : "",
      target_method: isSet(object.target_method)
        ? String(object.target_method)
        : "",
      field_name: isSet(object.field_name) ? String(object.field_name) : "",
    };
  },

  toJSON(message: Resolver): unknown {
    const obj: any = {};
    message.target_type !== undefined &&
      (obj.target_type = message.target_type);
    message.target_service !== undefined &&
      (obj.target_service = message.target_service);
    message.target_sub_service !== undefined &&
      (obj.target_sub_service = message.target_sub_service);
    message.target_method !== undefined &&
      (obj.target_method = message.target_method);
    message.field_name !== undefined && (obj.field_name = message.field_name);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<Resolver>, I>>(object: I): Resolver {
    const message = createBaseResolver();
    message.target_type = object.target_type ?? "";
    message.target_service = object.target_service ?? "";
    message.target_sub_service = object.target_sub_service ?? "";
    message.target_method = object.target_method ?? "";
    message.field_name = object.field_name ?? "";
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

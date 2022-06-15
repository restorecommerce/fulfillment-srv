/* eslint-disable */
import Long from "long";
import * as _m0 from "protobufjs/minimal";

export const protobufPackage = "io.restorecommerce.attribute";

export interface Attribute {
  id: string;
  value: string;
  attribute: Attribute[];
}

export interface AttributeObj {
  attribute: Attribute;
}

function createBaseAttribute(): Attribute {
  return { id: "", value: "", attribute: [] };
}

export const Attribute = {
  encode(
    message: Attribute,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.id !== "") {
      writer.uint32(10).string(message.id);
    }
    if (message.value !== "") {
      writer.uint32(18).string(message.value);
    }
    for (const v of message.attribute) {
      Attribute.encode(v!, writer.uint32(26).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Attribute {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseAttribute();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.id = reader.string();
          break;
        case 2:
          message.value = reader.string();
          break;
        case 3:
          message.attribute.push(Attribute.decode(reader, reader.uint32()));
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): Attribute {
    return {
      id: isSet(object.id) ? String(object.id) : "",
      value: isSet(object.value) ? String(object.value) : "",
      attribute: Array.isArray(object?.attribute)
        ? object.attribute.map((e: any) => Attribute.fromJSON(e))
        : [],
    };
  },

  toJSON(message: Attribute): unknown {
    const obj: any = {};
    message.id !== undefined && (obj.id = message.id);
    message.value !== undefined && (obj.value = message.value);
    if (message.attribute) {
      obj.attribute = message.attribute.map((e) =>
        e ? Attribute.toJSON(e) : undefined
      );
    } else {
      obj.attribute = [];
    }
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<Attribute>, I>>(
    object: I
  ): Attribute {
    const message = createBaseAttribute();
    message.id = object.id ?? "";
    message.value = object.value ?? "";
    message.attribute =
      object.attribute?.map((e) => Attribute.fromPartial(e)) || [];
    return message;
  },
};

function createBaseAttributeObj(): AttributeObj {
  return { attribute: undefined };
}

export const AttributeObj = {
  encode(
    message: AttributeObj,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.attribute !== undefined) {
      Attribute.encode(message.attribute, writer.uint32(10).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): AttributeObj {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseAttributeObj();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.attribute = Attribute.decode(reader, reader.uint32());
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): AttributeObj {
    return {
      attribute: isSet(object.attribute)
        ? Attribute.fromJSON(object.attribute)
        : undefined,
    };
  },

  toJSON(message: AttributeObj): unknown {
    const obj: any = {};
    message.attribute !== undefined &&
      (obj.attribute = message.attribute
        ? Attribute.toJSON(message.attribute)
        : undefined);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<AttributeObj>, I>>(
    object: I
  ): AttributeObj {
    const message = createBaseAttributeObj();
    message.attribute =
      object.attribute !== undefined && object.attribute !== null
        ? Attribute.fromPartial(object.attribute)
        : undefined;
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

if (_m0.util.Long !== Long) {
  _m0.util.Long = Long as any;
  _m0.configure();
}

function isSet(value: any): boolean {
  return value !== null && value !== undefined;
}

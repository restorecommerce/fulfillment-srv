/* eslint-disable */
import * as Long from "long";
import * as _m0 from "protobufjs/minimal";
import { Attribute, AttributeObj } from "../../io/restorecommerce/attribute";

export const protobufPackage = "io.restorecommerce.meta";

export interface Meta {
  /** timestamp */
  created: number;
  /** timestamp */
  modified: number;
  /** ID from last User who modified it */
  modified_by: string;
  owner: Attribute[];
  acl: AttributeObj[];
}

function createBaseMeta(): Meta {
  return { created: 0, modified: 0, modified_by: "", owner: [], acl: [] };
}

export const Meta = {
  encode(message: Meta, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.created !== 0) {
      writer.uint32(9).double(message.created);
    }
    if (message.modified !== 0) {
      writer.uint32(17).double(message.modified);
    }
    if (message.modified_by !== "") {
      writer.uint32(26).string(message.modified_by);
    }
    for (const v of message.owner) {
      Attribute.encode(v!, writer.uint32(34).fork()).ldelim();
    }
    for (const v of message.acl) {
      AttributeObj.encode(v!, writer.uint32(42).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Meta {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseMeta();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.created = reader.double();
          break;
        case 2:
          message.modified = reader.double();
          break;
        case 3:
          message.modified_by = reader.string();
          break;
        case 4:
          message.owner.push(Attribute.decode(reader, reader.uint32()));
          break;
        case 5:
          message.acl.push(AttributeObj.decode(reader, reader.uint32()));
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): Meta {
    return {
      created: isSet(object.created) ? Number(object.created) : 0,
      modified: isSet(object.modified) ? Number(object.modified) : 0,
      modified_by: isSet(object.modified_by) ? String(object.modified_by) : "",
      owner: Array.isArray(object?.owner)
        ? object.owner.map((e: any) => Attribute.fromJSON(e))
        : [],
      acl: Array.isArray(object?.acl)
        ? object.acl.map((e: any) => AttributeObj.fromJSON(e))
        : [],
    };
  },

  toJSON(message: Meta): unknown {
    const obj: any = {};
    message.created !== undefined && (obj.created = message.created);
    message.modified !== undefined && (obj.modified = message.modified);
    message.modified_by !== undefined &&
      (obj.modified_by = message.modified_by);
    if (message.owner) {
      obj.owner = message.owner.map((e) =>
        e ? Attribute.toJSON(e) : undefined
      );
    } else {
      obj.owner = [];
    }
    if (message.acl) {
      obj.acl = message.acl.map((e) =>
        e ? AttributeObj.toJSON(e) : undefined
      );
    } else {
      obj.acl = [];
    }
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<Meta>, I>>(object: I): Meta {
    const message = createBaseMeta();
    message.created = object.created ?? 0;
    message.modified = object.modified ?? 0;
    message.modified_by = object.modified_by ?? "";
    message.owner = object.owner?.map((e) => Attribute.fromPartial(e)) || [];
    message.acl = object.acl?.map((e) => AttributeObj.fromPartial(e)) || [];
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

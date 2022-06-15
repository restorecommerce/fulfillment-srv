/* eslint-disable */
import Long from "long";
import * as _m0 from "protobufjs/minimal";

export const protobufPackage = "io.restorecommerce.filter";

export interface Filter {
  field: string;
  operation: Filter_Operation;
  value: string;
  type: Filter_ValueType;
  filters: FilterOp[];
}

export enum Filter_Operation {
  eq = 0,
  lt = 1,
  lte = 2,
  gt = 3,
  gte = 4,
  isEmpty = 5,
  iLike = 6,
  in = 7,
  neq = 8,
  UNRECOGNIZED = -1,
}

export function filter_OperationFromJSON(object: any): Filter_Operation {
  switch (object) {
    case 0:
    case "eq":
      return Filter_Operation.eq;
    case 1:
    case "lt":
      return Filter_Operation.lt;
    case 2:
    case "lte":
      return Filter_Operation.lte;
    case 3:
    case "gt":
      return Filter_Operation.gt;
    case 4:
    case "gte":
      return Filter_Operation.gte;
    case 5:
    case "isEmpty":
      return Filter_Operation.isEmpty;
    case 6:
    case "iLike":
      return Filter_Operation.iLike;
    case 7:
    case "in":
      return Filter_Operation.in;
    case 8:
    case "neq":
      return Filter_Operation.neq;
    case -1:
    case "UNRECOGNIZED":
    default:
      return Filter_Operation.UNRECOGNIZED;
  }
}

export function filter_OperationToJSON(object: Filter_Operation): string {
  switch (object) {
    case Filter_Operation.eq:
      return "eq";
    case Filter_Operation.lt:
      return "lt";
    case Filter_Operation.lte:
      return "lte";
    case Filter_Operation.gt:
      return "gt";
    case Filter_Operation.gte:
      return "gte";
    case Filter_Operation.isEmpty:
      return "isEmpty";
    case Filter_Operation.iLike:
      return "iLike";
    case Filter_Operation.in:
      return "in";
    case Filter_Operation.neq:
      return "neq";
    case Filter_Operation.UNRECOGNIZED:
    default:
      return "UNRECOGNIZED";
  }
}

export enum Filter_ValueType {
  /** STRING - default value type if not specified */
  STRING = 0,
  NUMBER = 1,
  BOOLEAN = 2,
  DATE = 3,
  ARRAY = 4,
  UNRECOGNIZED = -1,
}

export function filter_ValueTypeFromJSON(object: any): Filter_ValueType {
  switch (object) {
    case 0:
    case "STRING":
      return Filter_ValueType.STRING;
    case 1:
    case "NUMBER":
      return Filter_ValueType.NUMBER;
    case 2:
    case "BOOLEAN":
      return Filter_ValueType.BOOLEAN;
    case 3:
    case "DATE":
      return Filter_ValueType.DATE;
    case 4:
    case "ARRAY":
      return Filter_ValueType.ARRAY;
    case -1:
    case "UNRECOGNIZED":
    default:
      return Filter_ValueType.UNRECOGNIZED;
  }
}

export function filter_ValueTypeToJSON(object: Filter_ValueType): string {
  switch (object) {
    case Filter_ValueType.STRING:
      return "STRING";
    case Filter_ValueType.NUMBER:
      return "NUMBER";
    case Filter_ValueType.BOOLEAN:
      return "BOOLEAN";
    case Filter_ValueType.DATE:
      return "DATE";
    case Filter_ValueType.ARRAY:
      return "ARRAY";
    case Filter_ValueType.UNRECOGNIZED:
    default:
      return "UNRECOGNIZED";
  }
}

export interface FilterOp {
  filter: Filter[];
  operator: FilterOp_Operator;
}

export enum FilterOp_Operator {
  and = 0,
  or = 1,
  UNRECOGNIZED = -1,
}

export function filterOp_OperatorFromJSON(object: any): FilterOp_Operator {
  switch (object) {
    case 0:
    case "and":
      return FilterOp_Operator.and;
    case 1:
    case "or":
      return FilterOp_Operator.or;
    case -1:
    case "UNRECOGNIZED":
    default:
      return FilterOp_Operator.UNRECOGNIZED;
  }
}

export function filterOp_OperatorToJSON(object: FilterOp_Operator): string {
  switch (object) {
    case FilterOp_Operator.and:
      return "and";
    case FilterOp_Operator.or:
      return "or";
    case FilterOp_Operator.UNRECOGNIZED:
    default:
      return "UNRECOGNIZED";
  }
}

function createBaseFilter(): Filter {
  return { field: "", operation: 0, value: "", type: 0, filters: [] };
}

export const Filter = {
  encode(
    message: Filter,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.field !== "") {
      writer.uint32(10).string(message.field);
    }
    if (message.operation !== 0) {
      writer.uint32(16).int32(message.operation);
    }
    if (message.value !== "") {
      writer.uint32(26).string(message.value);
    }
    if (message.type !== 0) {
      writer.uint32(32).int32(message.type);
    }
    for (const v of message.filters) {
      FilterOp.encode(v!, writer.uint32(50).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Filter {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseFilter();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.field = reader.string();
          break;
        case 2:
          message.operation = reader.int32() as any;
          break;
        case 3:
          message.value = reader.string();
          break;
        case 4:
          message.type = reader.int32() as any;
          break;
        case 6:
          message.filters.push(FilterOp.decode(reader, reader.uint32()));
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): Filter {
    return {
      field: isSet(object.field) ? String(object.field) : "",
      operation: isSet(object.operation)
        ? filter_OperationFromJSON(object.operation)
        : 0,
      value: isSet(object.value) ? String(object.value) : "",
      type: isSet(object.type) ? filter_ValueTypeFromJSON(object.type) : 0,
      filters: Array.isArray(object?.filters)
        ? object.filters.map((e: any) => FilterOp.fromJSON(e))
        : [],
    };
  },

  toJSON(message: Filter): unknown {
    const obj: any = {};
    message.field !== undefined && (obj.field = message.field);
    message.operation !== undefined &&
      (obj.operation = filter_OperationToJSON(message.operation));
    message.value !== undefined && (obj.value = message.value);
    message.type !== undefined &&
      (obj.type = filter_ValueTypeToJSON(message.type));
    if (message.filters) {
      obj.filters = message.filters.map((e) =>
        e ? FilterOp.toJSON(e) : undefined
      );
    } else {
      obj.filters = [];
    }
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<Filter>, I>>(object: I): Filter {
    const message = createBaseFilter();
    message.field = object.field ?? "";
    message.operation = object.operation ?? 0;
    message.value = object.value ?? "";
    message.type = object.type ?? 0;
    message.filters = object.filters?.map((e) => FilterOp.fromPartial(e)) || [];
    return message;
  },
};

function createBaseFilterOp(): FilterOp {
  return { filter: [], operator: 0 };
}

export const FilterOp = {
  encode(
    message: FilterOp,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    for (const v of message.filter) {
      Filter.encode(v!, writer.uint32(10).fork()).ldelim();
    }
    if (message.operator !== 0) {
      writer.uint32(16).int32(message.operator);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): FilterOp {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseFilterOp();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.filter.push(Filter.decode(reader, reader.uint32()));
          break;
        case 2:
          message.operator = reader.int32() as any;
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): FilterOp {
    return {
      filter: Array.isArray(object?.filter)
        ? object.filter.map((e: any) => Filter.fromJSON(e))
        : [],
      operator: isSet(object.operator)
        ? filterOp_OperatorFromJSON(object.operator)
        : 0,
    };
  },

  toJSON(message: FilterOp): unknown {
    const obj: any = {};
    if (message.filter) {
      obj.filter = message.filter.map((e) =>
        e ? Filter.toJSON(e) : undefined
      );
    } else {
      obj.filter = [];
    }
    message.operator !== undefined &&
      (obj.operator = filterOp_OperatorToJSON(message.operator));
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<FilterOp>, I>>(object: I): FilterOp {
    const message = createBaseFilterOp();
    message.filter = object.filter?.map((e) => Filter.fromPartial(e)) || [];
    message.operator = object.operator ?? 0;
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

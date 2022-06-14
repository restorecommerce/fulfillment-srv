/* eslint-disable */
import * as Long from "long";
import * as _m0 from "protobufjs/minimal";
import { Any } from "../../google/protobuf/any";
import { Subject } from "../../io/restorecommerce/auth";
import { OperationStatus, Status } from "../../io/restorecommerce/status";
import { Meta } from "../../io/restorecommerce/meta";
import { FilterOp as FilterOp1 } from "../../io/restorecommerce/filter";

export const protobufPackage = "io.restorecommerce.resourcebase";

export interface FieldFilter {
  name: string;
  include: boolean;
}

export interface Sort {
  field: string;
  order: Sort_SortOrder;
}

export enum Sort_SortOrder {
  UNSORTED = 0,
  ASCENDING = 1,
  DESCENDING = 2,
  UNRECOGNIZED = -1,
}

export function sort_SortOrderFromJSON(object: any): Sort_SortOrder {
  switch (object) {
    case 0:
    case "UNSORTED":
      return Sort_SortOrder.UNSORTED;
    case 1:
    case "ASCENDING":
      return Sort_SortOrder.ASCENDING;
    case 2:
    case "DESCENDING":
      return Sort_SortOrder.DESCENDING;
    case -1:
    case "UNRECOGNIZED":
    default:
      return Sort_SortOrder.UNRECOGNIZED;
  }
}

export function sort_SortOrderToJSON(object: Sort_SortOrder): string {
  switch (object) {
    case Sort_SortOrder.UNSORTED:
      return "UNSORTED";
    case Sort_SortOrder.ASCENDING:
      return "ASCENDING";
    case Sort_SortOrder.DESCENDING:
      return "DESCENDING";
    case Sort_SortOrder.UNRECOGNIZED:
    default:
      return "UNRECOGNIZED";
  }
}

export interface Filter {
  field: string;
  operation: Filter_Operation;
  value: string;
  type: Filter_ValueType;
  /** for nested filtering and to make optional its in separate filter.proto file */
  filters: FilterOp1[];
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

export interface ReadRequest {
  offset: number;
  limit: number;
  sort: Sort[];
  /** / Filter based on fieldName|operation, value|list */
  filters: FilterOp[];
  /** / Fields selector */
  field: FieldFilter[];
  search: string[];
  /**
   * Check the query parameters of HTTP request.
   * If query parameter `locales` is given,
   * return all corresponding localized values.
   * Otherwise, return always the localized value
   * with highest priority.
   * Can be empty, single locale or multiple locales.
   */
  localesLimiter: string[];
  customQueries: string[];
  customArguments: Any;
  subject: Subject;
}

export interface DeleteRequest {
  /** / Request to purge the whole collection */
  collection: boolean;
  /** / Delete specified documents */
  ids: string[];
  subject: Subject;
}

export interface DeleteResponse {
  status: Status[];
  operationStatus: OperationStatus;
}

/** / List of resources */
export interface ResourceList {
  items: Resource[];
  totalCount: number;
  subject: Subject;
}

/** ResourceList response */
export interface ResourceListResponse {
  items: ResourceResponse[];
  totalCount: number;
  operationStatus: OperationStatus;
}

/** resource read response */
export interface ResourceResponse {
  payload: Resource;
  status: Status;
}

/** / Example resource */
export interface Resource {
  id: string;
  meta: Meta;
  value: number;
  text: string;
  active: boolean;
  created: number;
  status: string;
}

function createBaseFieldFilter(): FieldFilter {
  return { name: "", include: false };
}

export const FieldFilter = {
  encode(
    message: FieldFilter,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.name !== "") {
      writer.uint32(10).string(message.name);
    }
    if (message.include === true) {
      writer.uint32(16).bool(message.include);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): FieldFilter {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseFieldFilter();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.name = reader.string();
          break;
        case 2:
          message.include = reader.bool();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): FieldFilter {
    return {
      name: isSet(object.name) ? String(object.name) : "",
      include: isSet(object.include) ? Boolean(object.include) : false,
    };
  },

  toJSON(message: FieldFilter): unknown {
    const obj: any = {};
    message.name !== undefined && (obj.name = message.name);
    message.include !== undefined && (obj.include = message.include);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<FieldFilter>, I>>(
    object: I
  ): FieldFilter {
    const message = createBaseFieldFilter();
    message.name = object.name ?? "";
    message.include = object.include ?? false;
    return message;
  },
};

function createBaseSort(): Sort {
  return { field: "", order: 0 };
}

export const Sort = {
  encode(message: Sort, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.field !== "") {
      writer.uint32(10).string(message.field);
    }
    if (message.order !== 0) {
      writer.uint32(16).int32(message.order);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Sort {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSort();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.field = reader.string();
          break;
        case 2:
          message.order = reader.int32() as any;
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): Sort {
    return {
      field: isSet(object.field) ? String(object.field) : "",
      order: isSet(object.order) ? sort_SortOrderFromJSON(object.order) : 0,
    };
  },

  toJSON(message: Sort): unknown {
    const obj: any = {};
    message.field !== undefined && (obj.field = message.field);
    message.order !== undefined &&
      (obj.order = sort_SortOrderToJSON(message.order));
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<Sort>, I>>(object: I): Sort {
    const message = createBaseSort();
    message.field = object.field ?? "";
    message.order = object.order ?? 0;
    return message;
  },
};

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
      FilterOp1.encode(v!, writer.uint32(42).fork()).ldelim();
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
        case 5:
          message.filters.push(FilterOp1.decode(reader, reader.uint32()));
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
        ? object.filters.map((e: any) => FilterOp1.fromJSON(e))
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
        e ? FilterOp1.toJSON(e) : undefined
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
    message.filters =
      object.filters?.map((e) => FilterOp1.fromPartial(e)) || [];
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

function createBaseReadRequest(): ReadRequest {
  return {
    offset: 0,
    limit: 0,
    sort: [],
    filters: [],
    field: [],
    search: [],
    localesLimiter: [],
    customQueries: [],
    customArguments: undefined,
    subject: undefined,
  };
}

export const ReadRequest = {
  encode(
    message: ReadRequest,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.offset !== 0) {
      writer.uint32(8).uint32(message.offset);
    }
    if (message.limit !== 0) {
      writer.uint32(16).uint32(message.limit);
    }
    for (const v of message.sort) {
      Sort.encode(v!, writer.uint32(26).fork()).ldelim();
    }
    for (const v of message.filters) {
      FilterOp.encode(v!, writer.uint32(34).fork()).ldelim();
    }
    for (const v of message.field) {
      FieldFilter.encode(v!, writer.uint32(42).fork()).ldelim();
    }
    for (const v of message.search) {
      writer.uint32(50).string(v!);
    }
    for (const v of message.localesLimiter) {
      writer.uint32(58).string(v!);
    }
    for (const v of message.customQueries) {
      writer.uint32(66).string(v!);
    }
    if (message.customArguments !== undefined) {
      Any.encode(message.customArguments, writer.uint32(74).fork()).ldelim();
    }
    if (message.subject !== undefined) {
      Subject.encode(message.subject, writer.uint32(82).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ReadRequest {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseReadRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.offset = reader.uint32();
          break;
        case 2:
          message.limit = reader.uint32();
          break;
        case 3:
          message.sort.push(Sort.decode(reader, reader.uint32()));
          break;
        case 4:
          message.filters.push(FilterOp.decode(reader, reader.uint32()));
          break;
        case 5:
          message.field.push(FieldFilter.decode(reader, reader.uint32()));
          break;
        case 6:
          message.search.push(reader.string());
          break;
        case 7:
          message.localesLimiter.push(reader.string());
          break;
        case 8:
          message.customQueries.push(reader.string());
          break;
        case 9:
          message.customArguments = Any.decode(reader, reader.uint32());
          break;
        case 10:
          message.subject = Subject.decode(reader, reader.uint32());
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): ReadRequest {
    return {
      offset: isSet(object.offset) ? Number(object.offset) : 0,
      limit: isSet(object.limit) ? Number(object.limit) : 0,
      sort: Array.isArray(object?.sort)
        ? object.sort.map((e: any) => Sort.fromJSON(e))
        : [],
      filters: Array.isArray(object?.filters)
        ? object.filters.map((e: any) => FilterOp.fromJSON(e))
        : [],
      field: Array.isArray(object?.field)
        ? object.field.map((e: any) => FieldFilter.fromJSON(e))
        : [],
      search: Array.isArray(object?.search)
        ? object.search.map((e: any) => String(e))
        : [],
      localesLimiter: Array.isArray(object?.localesLimiter)
        ? object.localesLimiter.map((e: any) => String(e))
        : [],
      customQueries: Array.isArray(object?.customQueries)
        ? object.customQueries.map((e: any) => String(e))
        : [],
      customArguments: isSet(object.customArguments)
        ? Any.fromJSON(object.customArguments)
        : undefined,
      subject: isSet(object.subject)
        ? Subject.fromJSON(object.subject)
        : undefined,
    };
  },

  toJSON(message: ReadRequest): unknown {
    const obj: any = {};
    message.offset !== undefined && (obj.offset = Math.round(message.offset));
    message.limit !== undefined && (obj.limit = Math.round(message.limit));
    if (message.sort) {
      obj.sort = message.sort.map((e) => (e ? Sort.toJSON(e) : undefined));
    } else {
      obj.sort = [];
    }
    if (message.filters) {
      obj.filters = message.filters.map((e) =>
        e ? FilterOp.toJSON(e) : undefined
      );
    } else {
      obj.filters = [];
    }
    if (message.field) {
      obj.field = message.field.map((e) =>
        e ? FieldFilter.toJSON(e) : undefined
      );
    } else {
      obj.field = [];
    }
    if (message.search) {
      obj.search = message.search.map((e) => e);
    } else {
      obj.search = [];
    }
    if (message.localesLimiter) {
      obj.localesLimiter = message.localesLimiter.map((e) => e);
    } else {
      obj.localesLimiter = [];
    }
    if (message.customQueries) {
      obj.customQueries = message.customQueries.map((e) => e);
    } else {
      obj.customQueries = [];
    }
    message.customArguments !== undefined &&
      (obj.customArguments = message.customArguments
        ? Any.toJSON(message.customArguments)
        : undefined);
    message.subject !== undefined &&
      (obj.subject = message.subject
        ? Subject.toJSON(message.subject)
        : undefined);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<ReadRequest>, I>>(
    object: I
  ): ReadRequest {
    const message = createBaseReadRequest();
    message.offset = object.offset ?? 0;
    message.limit = object.limit ?? 0;
    message.sort = object.sort?.map((e) => Sort.fromPartial(e)) || [];
    message.filters = object.filters?.map((e) => FilterOp.fromPartial(e)) || [];
    message.field = object.field?.map((e) => FieldFilter.fromPartial(e)) || [];
    message.search = object.search?.map((e) => e) || [];
    message.localesLimiter = object.localesLimiter?.map((e) => e) || [];
    message.customQueries = object.customQueries?.map((e) => e) || [];
    message.customArguments =
      object.customArguments !== undefined && object.customArguments !== null
        ? Any.fromPartial(object.customArguments)
        : undefined;
    message.subject =
      object.subject !== undefined && object.subject !== null
        ? Subject.fromPartial(object.subject)
        : undefined;
    return message;
  },
};

function createBaseDeleteRequest(): DeleteRequest {
  return { collection: false, ids: [], subject: undefined };
}

export const DeleteRequest = {
  encode(
    message: DeleteRequest,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.collection === true) {
      writer.uint32(8).bool(message.collection);
    }
    for (const v of message.ids) {
      writer.uint32(18).string(v!);
    }
    if (message.subject !== undefined) {
      Subject.encode(message.subject, writer.uint32(26).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): DeleteRequest {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseDeleteRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.collection = reader.bool();
          break;
        case 2:
          message.ids.push(reader.string());
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

  fromJSON(object: any): DeleteRequest {
    return {
      collection: isSet(object.collection) ? Boolean(object.collection) : false,
      ids: Array.isArray(object?.ids)
        ? object.ids.map((e: any) => String(e))
        : [],
      subject: isSet(object.subject)
        ? Subject.fromJSON(object.subject)
        : undefined,
    };
  },

  toJSON(message: DeleteRequest): unknown {
    const obj: any = {};
    message.collection !== undefined && (obj.collection = message.collection);
    if (message.ids) {
      obj.ids = message.ids.map((e) => e);
    } else {
      obj.ids = [];
    }
    message.subject !== undefined &&
      (obj.subject = message.subject
        ? Subject.toJSON(message.subject)
        : undefined);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<DeleteRequest>, I>>(
    object: I
  ): DeleteRequest {
    const message = createBaseDeleteRequest();
    message.collection = object.collection ?? false;
    message.ids = object.ids?.map((e) => e) || [];
    message.subject =
      object.subject !== undefined && object.subject !== null
        ? Subject.fromPartial(object.subject)
        : undefined;
    return message;
  },
};

function createBaseDeleteResponse(): DeleteResponse {
  return { status: [], operationStatus: undefined };
}

export const DeleteResponse = {
  encode(
    message: DeleteResponse,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    for (const v of message.status) {
      Status.encode(v!, writer.uint32(10).fork()).ldelim();
    }
    if (message.operationStatus !== undefined) {
      OperationStatus.encode(
        message.operationStatus,
        writer.uint32(18).fork()
      ).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): DeleteResponse {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseDeleteResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.status.push(Status.decode(reader, reader.uint32()));
          break;
        case 2:
          message.operationStatus = OperationStatus.decode(
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

  fromJSON(object: any): DeleteResponse {
    return {
      status: Array.isArray(object?.status)
        ? object.status.map((e: any) => Status.fromJSON(e))
        : [],
      operationStatus: isSet(object.operationStatus)
        ? OperationStatus.fromJSON(object.operationStatus)
        : undefined,
    };
  },

  toJSON(message: DeleteResponse): unknown {
    const obj: any = {};
    if (message.status) {
      obj.status = message.status.map((e) =>
        e ? Status.toJSON(e) : undefined
      );
    } else {
      obj.status = [];
    }
    message.operationStatus !== undefined &&
      (obj.operationStatus = message.operationStatus
        ? OperationStatus.toJSON(message.operationStatus)
        : undefined);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<DeleteResponse>, I>>(
    object: I
  ): DeleteResponse {
    const message = createBaseDeleteResponse();
    message.status = object.status?.map((e) => Status.fromPartial(e)) || [];
    message.operationStatus =
      object.operationStatus !== undefined && object.operationStatus !== null
        ? OperationStatus.fromPartial(object.operationStatus)
        : undefined;
    return message;
  },
};

function createBaseResourceList(): ResourceList {
  return { items: [], totalCount: 0, subject: undefined };
}

export const ResourceList = {
  encode(
    message: ResourceList,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    for (const v of message.items) {
      Resource.encode(v!, writer.uint32(10).fork()).ldelim();
    }
    if (message.totalCount !== 0) {
      writer.uint32(16).uint32(message.totalCount);
    }
    if (message.subject !== undefined) {
      Subject.encode(message.subject, writer.uint32(26).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ResourceList {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseResourceList();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.items.push(Resource.decode(reader, reader.uint32()));
          break;
        case 2:
          message.totalCount = reader.uint32();
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

  fromJSON(object: any): ResourceList {
    return {
      items: Array.isArray(object?.items)
        ? object.items.map((e: any) => Resource.fromJSON(e))
        : [],
      totalCount: isSet(object.totalCount) ? Number(object.totalCount) : 0,
      subject: isSet(object.subject)
        ? Subject.fromJSON(object.subject)
        : undefined,
    };
  },

  toJSON(message: ResourceList): unknown {
    const obj: any = {};
    if (message.items) {
      obj.items = message.items.map((e) =>
        e ? Resource.toJSON(e) : undefined
      );
    } else {
      obj.items = [];
    }
    message.totalCount !== undefined &&
      (obj.totalCount = Math.round(message.totalCount));
    message.subject !== undefined &&
      (obj.subject = message.subject
        ? Subject.toJSON(message.subject)
        : undefined);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<ResourceList>, I>>(
    object: I
  ): ResourceList {
    const message = createBaseResourceList();
    message.items = object.items?.map((e) => Resource.fromPartial(e)) || [];
    message.totalCount = object.totalCount ?? 0;
    message.subject =
      object.subject !== undefined && object.subject !== null
        ? Subject.fromPartial(object.subject)
        : undefined;
    return message;
  },
};

function createBaseResourceListResponse(): ResourceListResponse {
  return { items: [], totalCount: 0, operationStatus: undefined };
}

export const ResourceListResponse = {
  encode(
    message: ResourceListResponse,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    for (const v of message.items) {
      ResourceResponse.encode(v!, writer.uint32(10).fork()).ldelim();
    }
    if (message.totalCount !== 0) {
      writer.uint32(16).uint32(message.totalCount);
    }
    if (message.operationStatus !== undefined) {
      OperationStatus.encode(
        message.operationStatus,
        writer.uint32(26).fork()
      ).ldelim();
    }
    return writer;
  },

  decode(
    input: _m0.Reader | Uint8Array,
    length?: number
  ): ResourceListResponse {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseResourceListResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.items.push(ResourceResponse.decode(reader, reader.uint32()));
          break;
        case 2:
          message.totalCount = reader.uint32();
          break;
        case 3:
          message.operationStatus = OperationStatus.decode(
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

  fromJSON(object: any): ResourceListResponse {
    return {
      items: Array.isArray(object?.items)
        ? object.items.map((e: any) => ResourceResponse.fromJSON(e))
        : [],
      totalCount: isSet(object.totalCount) ? Number(object.totalCount) : 0,
      operationStatus: isSet(object.operationStatus)
        ? OperationStatus.fromJSON(object.operationStatus)
        : undefined,
    };
  },

  toJSON(message: ResourceListResponse): unknown {
    const obj: any = {};
    if (message.items) {
      obj.items = message.items.map((e) =>
        e ? ResourceResponse.toJSON(e) : undefined
      );
    } else {
      obj.items = [];
    }
    message.totalCount !== undefined &&
      (obj.totalCount = Math.round(message.totalCount));
    message.operationStatus !== undefined &&
      (obj.operationStatus = message.operationStatus
        ? OperationStatus.toJSON(message.operationStatus)
        : undefined);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<ResourceListResponse>, I>>(
    object: I
  ): ResourceListResponse {
    const message = createBaseResourceListResponse();
    message.items =
      object.items?.map((e) => ResourceResponse.fromPartial(e)) || [];
    message.totalCount = object.totalCount ?? 0;
    message.operationStatus =
      object.operationStatus !== undefined && object.operationStatus !== null
        ? OperationStatus.fromPartial(object.operationStatus)
        : undefined;
    return message;
  },
};

function createBaseResourceResponse(): ResourceResponse {
  return { payload: undefined, status: undefined };
}

export const ResourceResponse = {
  encode(
    message: ResourceResponse,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.payload !== undefined) {
      Resource.encode(message.payload, writer.uint32(10).fork()).ldelim();
    }
    if (message.status !== undefined) {
      Status.encode(message.status, writer.uint32(18).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ResourceResponse {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseResourceResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.payload = Resource.decode(reader, reader.uint32());
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

  fromJSON(object: any): ResourceResponse {
    return {
      payload: isSet(object.payload)
        ? Resource.fromJSON(object.payload)
        : undefined,
      status: isSet(object.status) ? Status.fromJSON(object.status) : undefined,
    };
  },

  toJSON(message: ResourceResponse): unknown {
    const obj: any = {};
    message.payload !== undefined &&
      (obj.payload = message.payload
        ? Resource.toJSON(message.payload)
        : undefined);
    message.status !== undefined &&
      (obj.status = message.status ? Status.toJSON(message.status) : undefined);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<ResourceResponse>, I>>(
    object: I
  ): ResourceResponse {
    const message = createBaseResourceResponse();
    message.payload =
      object.payload !== undefined && object.payload !== null
        ? Resource.fromPartial(object.payload)
        : undefined;
    message.status =
      object.status !== undefined && object.status !== null
        ? Status.fromPartial(object.status)
        : undefined;
    return message;
  },
};

function createBaseResource(): Resource {
  return {
    id: "",
    meta: undefined,
    value: 0,
    text: "",
    active: false,
    created: 0,
    status: "",
  };
}

export const Resource = {
  encode(
    message: Resource,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.id !== "") {
      writer.uint32(10).string(message.id);
    }
    if (message.meta !== undefined) {
      Meta.encode(message.meta, writer.uint32(18).fork()).ldelim();
    }
    if (message.value !== 0) {
      writer.uint32(24).int32(message.value);
    }
    if (message.text !== "") {
      writer.uint32(34).string(message.text);
    }
    if (message.active === true) {
      writer.uint32(40).bool(message.active);
    }
    if (message.created !== 0) {
      writer.uint32(49).double(message.created);
    }
    if (message.status !== "") {
      writer.uint32(58).string(message.status);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Resource {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseResource();
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
          message.value = reader.int32();
          break;
        case 4:
          message.text = reader.string();
          break;
        case 5:
          message.active = reader.bool();
          break;
        case 6:
          message.created = reader.double();
          break;
        case 7:
          message.status = reader.string();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): Resource {
    return {
      id: isSet(object.id) ? String(object.id) : "",
      meta: isSet(object.meta) ? Meta.fromJSON(object.meta) : undefined,
      value: isSet(object.value) ? Number(object.value) : 0,
      text: isSet(object.text) ? String(object.text) : "",
      active: isSet(object.active) ? Boolean(object.active) : false,
      created: isSet(object.created) ? Number(object.created) : 0,
      status: isSet(object.status) ? String(object.status) : "",
    };
  },

  toJSON(message: Resource): unknown {
    const obj: any = {};
    message.id !== undefined && (obj.id = message.id);
    message.meta !== undefined &&
      (obj.meta = message.meta ? Meta.toJSON(message.meta) : undefined);
    message.value !== undefined && (obj.value = Math.round(message.value));
    message.text !== undefined && (obj.text = message.text);
    message.active !== undefined && (obj.active = message.active);
    message.created !== undefined && (obj.created = message.created);
    message.status !== undefined && (obj.status = message.status);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<Resource>, I>>(object: I): Resource {
    const message = createBaseResource();
    message.id = object.id ?? "";
    message.meta =
      object.meta !== undefined && object.meta !== null
        ? Meta.fromPartial(object.meta)
        : undefined;
    message.value = object.value ?? 0;
    message.text = object.text ?? "";
    message.active = object.active ?? false;
    message.created = object.created ?? 0;
    message.status = object.status ?? "";
    return message;
  },
};

/** Service provides the CRUD operations */
export interface Service {
  Read(request: ReadRequest): Promise<ResourceListResponse>;
  Create(request: ResourceList): Promise<ResourceListResponse>;
  Delete(request: DeleteRequest): Promise<DeleteResponse>;
  Update(request: ResourceList): Promise<ResourceListResponse>;
  Upsert(request: ResourceList): Promise<ResourceListResponse>;
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

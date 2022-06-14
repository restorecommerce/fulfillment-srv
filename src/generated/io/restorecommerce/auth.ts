/* eslint-disable */
import * as Long from "long";
import * as _m0 from "protobufjs/minimal";
import { Attribute } from "../../io/restorecommerce/attribute";

export const protobufPackage = "io.restorecommerce.auth";

/** Subject of creating User */
export interface Subject {
  /** user id */
  id: string;
  /** target scope */
  scope: string;
  /** role_associations of user creating the user */
  roleAssociations: RoleAssociation[];
  /** HR scope of user creating the User */
  hierarchicalScopes: HierarchicalScope[];
  /** for unauthenticated context */
  unauthenticated: boolean;
  token: string;
}

export interface Tokens {
  /** token name */
  name: string;
  /** expiration date for token */
  expiresIn: number;
  /** token */
  token: string;
  /** identifier for role_association */
  scopes: string[];
  /** type of token eg: access_token, refresh_token */
  type: string;
  interactive: boolean;
  lastLogin: number;
}

export interface HierarchicalScope {
  /** root node */
  id: string;
  /** children nodes */
  children: HierarchicalScope[];
  /** role identifier associated with root node scope */
  role: string;
}

export interface RoleAssociation {
  /** role ID */
  role: string;
  /** useful attributes for RBAC/ABAC like organizational scope */
  attributes: Attribute[];
  /** identifier for role_association */
  id: string;
  /** timestamp when the role was created */
  created: number;
}

export interface HierarchicalScopesRequest {
  token: string;
}

export interface HierarchicalScopesResponse {
  subjectId: string;
  hierarchicalScopes: HierarchicalScope[];
  token: string;
}

function createBaseSubject(): Subject {
  return {
    id: "",
    scope: "",
    roleAssociations: [],
    hierarchicalScopes: [],
    unauthenticated: false,
    token: "",
  };
}

export const Subject = {
  encode(
    message: Subject,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.id !== "") {
      writer.uint32(10).string(message.id);
    }
    if (message.scope !== "") {
      writer.uint32(18).string(message.scope);
    }
    for (const v of message.roleAssociations) {
      RoleAssociation.encode(v!, writer.uint32(26).fork()).ldelim();
    }
    for (const v of message.hierarchicalScopes) {
      HierarchicalScope.encode(v!, writer.uint32(34).fork()).ldelim();
    }
    if (message.unauthenticated === true) {
      writer.uint32(40).bool(message.unauthenticated);
    }
    if (message.token !== "") {
      writer.uint32(50).string(message.token);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Subject {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSubject();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.id = reader.string();
          break;
        case 2:
          message.scope = reader.string();
          break;
        case 3:
          message.roleAssociations.push(
            RoleAssociation.decode(reader, reader.uint32())
          );
          break;
        case 4:
          message.hierarchicalScopes.push(
            HierarchicalScope.decode(reader, reader.uint32())
          );
          break;
        case 5:
          message.unauthenticated = reader.bool();
          break;
        case 6:
          message.token = reader.string();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): Subject {
    return {
      id: isSet(object.id) ? String(object.id) : "",
      scope: isSet(object.scope) ? String(object.scope) : "",
      roleAssociations: Array.isArray(object?.roleAssociations)
        ? object.roleAssociations.map((e: any) => RoleAssociation.fromJSON(e))
        : [],
      hierarchicalScopes: Array.isArray(object?.hierarchicalScopes)
        ? object.hierarchicalScopes.map((e: any) =>
            HierarchicalScope.fromJSON(e)
          )
        : [],
      unauthenticated: isSet(object.unauthenticated)
        ? Boolean(object.unauthenticated)
        : false,
      token: isSet(object.token) ? String(object.token) : "",
    };
  },

  toJSON(message: Subject): unknown {
    const obj: any = {};
    message.id !== undefined && (obj.id = message.id);
    message.scope !== undefined && (obj.scope = message.scope);
    if (message.roleAssociations) {
      obj.roleAssociations = message.roleAssociations.map((e) =>
        e ? RoleAssociation.toJSON(e) : undefined
      );
    } else {
      obj.roleAssociations = [];
    }
    if (message.hierarchicalScopes) {
      obj.hierarchicalScopes = message.hierarchicalScopes.map((e) =>
        e ? HierarchicalScope.toJSON(e) : undefined
      );
    } else {
      obj.hierarchicalScopes = [];
    }
    message.unauthenticated !== undefined &&
      (obj.unauthenticated = message.unauthenticated);
    message.token !== undefined && (obj.token = message.token);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<Subject>, I>>(object: I): Subject {
    const message = createBaseSubject();
    message.id = object.id ?? "";
    message.scope = object.scope ?? "";
    message.roleAssociations =
      object.roleAssociations?.map((e) => RoleAssociation.fromPartial(e)) || [];
    message.hierarchicalScopes =
      object.hierarchicalScopes?.map((e) => HierarchicalScope.fromPartial(e)) ||
      [];
    message.unauthenticated = object.unauthenticated ?? false;
    message.token = object.token ?? "";
    return message;
  },
};

function createBaseTokens(): Tokens {
  return {
    name: "",
    expiresIn: 0,
    token: "",
    scopes: [],
    type: "",
    interactive: false,
    lastLogin: 0,
  };
}

export const Tokens = {
  encode(
    message: Tokens,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.name !== "") {
      writer.uint32(10).string(message.name);
    }
    if (message.expiresIn !== 0) {
      writer.uint32(17).double(message.expiresIn);
    }
    if (message.token !== "") {
      writer.uint32(26).string(message.token);
    }
    for (const v of message.scopes) {
      writer.uint32(34).string(v!);
    }
    if (message.type !== "") {
      writer.uint32(42).string(message.type);
    }
    if (message.interactive === true) {
      writer.uint32(48).bool(message.interactive);
    }
    if (message.lastLogin !== 0) {
      writer.uint32(57).double(message.lastLogin);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): Tokens {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseTokens();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.name = reader.string();
          break;
        case 2:
          message.expiresIn = reader.double();
          break;
        case 3:
          message.token = reader.string();
          break;
        case 4:
          message.scopes.push(reader.string());
          break;
        case 5:
          message.type = reader.string();
          break;
        case 6:
          message.interactive = reader.bool();
          break;
        case 7:
          message.lastLogin = reader.double();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): Tokens {
    return {
      name: isSet(object.name) ? String(object.name) : "",
      expiresIn: isSet(object.expiresIn) ? Number(object.expiresIn) : 0,
      token: isSet(object.token) ? String(object.token) : "",
      scopes: Array.isArray(object?.scopes)
        ? object.scopes.map((e: any) => String(e))
        : [],
      type: isSet(object.type) ? String(object.type) : "",
      interactive: isSet(object.interactive)
        ? Boolean(object.interactive)
        : false,
      lastLogin: isSet(object.lastLogin) ? Number(object.lastLogin) : 0,
    };
  },

  toJSON(message: Tokens): unknown {
    const obj: any = {};
    message.name !== undefined && (obj.name = message.name);
    message.expiresIn !== undefined && (obj.expiresIn = message.expiresIn);
    message.token !== undefined && (obj.token = message.token);
    if (message.scopes) {
      obj.scopes = message.scopes.map((e) => e);
    } else {
      obj.scopes = [];
    }
    message.type !== undefined && (obj.type = message.type);
    message.interactive !== undefined &&
      (obj.interactive = message.interactive);
    message.lastLogin !== undefined && (obj.lastLogin = message.lastLogin);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<Tokens>, I>>(object: I): Tokens {
    const message = createBaseTokens();
    message.name = object.name ?? "";
    message.expiresIn = object.expiresIn ?? 0;
    message.token = object.token ?? "";
    message.scopes = object.scopes?.map((e) => e) || [];
    message.type = object.type ?? "";
    message.interactive = object.interactive ?? false;
    message.lastLogin = object.lastLogin ?? 0;
    return message;
  },
};

function createBaseHierarchicalScope(): HierarchicalScope {
  return { id: "", children: [], role: "" };
}

export const HierarchicalScope = {
  encode(
    message: HierarchicalScope,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.id !== "") {
      writer.uint32(10).string(message.id);
    }
    for (const v of message.children) {
      HierarchicalScope.encode(v!, writer.uint32(18).fork()).ldelim();
    }
    if (message.role !== "") {
      writer.uint32(26).string(message.role);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): HierarchicalScope {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseHierarchicalScope();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.id = reader.string();
          break;
        case 2:
          message.children.push(
            HierarchicalScope.decode(reader, reader.uint32())
          );
          break;
        case 3:
          message.role = reader.string();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): HierarchicalScope {
    return {
      id: isSet(object.id) ? String(object.id) : "",
      children: Array.isArray(object?.children)
        ? object.children.map((e: any) => HierarchicalScope.fromJSON(e))
        : [],
      role: isSet(object.role) ? String(object.role) : "",
    };
  },

  toJSON(message: HierarchicalScope): unknown {
    const obj: any = {};
    message.id !== undefined && (obj.id = message.id);
    if (message.children) {
      obj.children = message.children.map((e) =>
        e ? HierarchicalScope.toJSON(e) : undefined
      );
    } else {
      obj.children = [];
    }
    message.role !== undefined && (obj.role = message.role);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<HierarchicalScope>, I>>(
    object: I
  ): HierarchicalScope {
    const message = createBaseHierarchicalScope();
    message.id = object.id ?? "";
    message.children =
      object.children?.map((e) => HierarchicalScope.fromPartial(e)) || [];
    message.role = object.role ?? "";
    return message;
  },
};

function createBaseRoleAssociation(): RoleAssociation {
  return { role: "", attributes: [], id: "", created: 0 };
}

export const RoleAssociation = {
  encode(
    message: RoleAssociation,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.role !== "") {
      writer.uint32(10).string(message.role);
    }
    for (const v of message.attributes) {
      Attribute.encode(v!, writer.uint32(18).fork()).ldelim();
    }
    if (message.id !== "") {
      writer.uint32(26).string(message.id);
    }
    if (message.created !== 0) {
      writer.uint32(33).double(message.created);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): RoleAssociation {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseRoleAssociation();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.role = reader.string();
          break;
        case 2:
          message.attributes.push(Attribute.decode(reader, reader.uint32()));
          break;
        case 3:
          message.id = reader.string();
          break;
        case 4:
          message.created = reader.double();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): RoleAssociation {
    return {
      role: isSet(object.role) ? String(object.role) : "",
      attributes: Array.isArray(object?.attributes)
        ? object.attributes.map((e: any) => Attribute.fromJSON(e))
        : [],
      id: isSet(object.id) ? String(object.id) : "",
      created: isSet(object.created) ? Number(object.created) : 0,
    };
  },

  toJSON(message: RoleAssociation): unknown {
    const obj: any = {};
    message.role !== undefined && (obj.role = message.role);
    if (message.attributes) {
      obj.attributes = message.attributes.map((e) =>
        e ? Attribute.toJSON(e) : undefined
      );
    } else {
      obj.attributes = [];
    }
    message.id !== undefined && (obj.id = message.id);
    message.created !== undefined && (obj.created = message.created);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<RoleAssociation>, I>>(
    object: I
  ): RoleAssociation {
    const message = createBaseRoleAssociation();
    message.role = object.role ?? "";
    message.attributes =
      object.attributes?.map((e) => Attribute.fromPartial(e)) || [];
    message.id = object.id ?? "";
    message.created = object.created ?? 0;
    return message;
  },
};

function createBaseHierarchicalScopesRequest(): HierarchicalScopesRequest {
  return { token: "" };
}

export const HierarchicalScopesRequest = {
  encode(
    message: HierarchicalScopesRequest,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.token !== "") {
      writer.uint32(10).string(message.token);
    }
    return writer;
  },

  decode(
    input: _m0.Reader | Uint8Array,
    length?: number
  ): HierarchicalScopesRequest {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseHierarchicalScopesRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.token = reader.string();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): HierarchicalScopesRequest {
    return {
      token: isSet(object.token) ? String(object.token) : "",
    };
  },

  toJSON(message: HierarchicalScopesRequest): unknown {
    const obj: any = {};
    message.token !== undefined && (obj.token = message.token);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<HierarchicalScopesRequest>, I>>(
    object: I
  ): HierarchicalScopesRequest {
    const message = createBaseHierarchicalScopesRequest();
    message.token = object.token ?? "";
    return message;
  },
};

function createBaseHierarchicalScopesResponse(): HierarchicalScopesResponse {
  return { subjectId: "", hierarchicalScopes: [], token: "" };
}

export const HierarchicalScopesResponse = {
  encode(
    message: HierarchicalScopesResponse,
    writer: _m0.Writer = _m0.Writer.create()
  ): _m0.Writer {
    if (message.subjectId !== "") {
      writer.uint32(10).string(message.subjectId);
    }
    for (const v of message.hierarchicalScopes) {
      HierarchicalScope.encode(v!, writer.uint32(18).fork()).ldelim();
    }
    if (message.token !== "") {
      writer.uint32(26).string(message.token);
    }
    return writer;
  },

  decode(
    input: _m0.Reader | Uint8Array,
    length?: number
  ): HierarchicalScopesResponse {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseHierarchicalScopesResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.subjectId = reader.string();
          break;
        case 2:
          message.hierarchicalScopes.push(
            HierarchicalScope.decode(reader, reader.uint32())
          );
          break;
        case 3:
          message.token = reader.string();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  },

  fromJSON(object: any): HierarchicalScopesResponse {
    return {
      subjectId: isSet(object.subjectId) ? String(object.subjectId) : "",
      hierarchicalScopes: Array.isArray(object?.hierarchicalScopes)
        ? object.hierarchicalScopes.map((e: any) =>
            HierarchicalScope.fromJSON(e)
          )
        : [],
      token: isSet(object.token) ? String(object.token) : "",
    };
  },

  toJSON(message: HierarchicalScopesResponse): unknown {
    const obj: any = {};
    message.subjectId !== undefined && (obj.subjectId = message.subjectId);
    if (message.hierarchicalScopes) {
      obj.hierarchicalScopes = message.hierarchicalScopes.map((e) =>
        e ? HierarchicalScope.toJSON(e) : undefined
      );
    } else {
      obj.hierarchicalScopes = [];
    }
    message.token !== undefined && (obj.token = message.token);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<HierarchicalScopesResponse>, I>>(
    object: I
  ): HierarchicalScopesResponse {
    const message = createBaseHierarchicalScopesResponse();
    message.subjectId = object.subjectId ?? "";
    message.hierarchicalScopes =
      object.hierarchicalScopes?.map((e) => HierarchicalScope.fromPartial(e)) ||
      [];
    message.token = object.token ?? "";
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

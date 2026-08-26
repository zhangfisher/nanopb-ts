/**
 * Protocol Buffers type definitions
 * Based on google/protobuf/descriptor.proto
 */

/** Field rule (label in proto terminology) */
export enum FieldRule {
  OPTIONAL = 0,   // Optional field (proto2) / singular (proto3)
  REQUIRED = 1,   // Required field (proto2 only)
  REPEATED = 2,   // Repeated field
  ONEOF = 3,      // Oneof member
  FIXARRAY = 4,   // Fixed size array (nanopb extension)
}

/** Protobuf field types */
export enum ProtoFieldType {
  // Primitive types
  TYPE_DOUBLE = 1,
  TYPE_FLOAT = 2,
  TYPE_INT64 = 3,
  TYPE_UINT64 = 4,
  TYPE_INT32 = 5,
  TYPE_FIXED64 = 6,
  TYPE_FIXED32 = 7,
  TYPE_BOOL = 8,
  TYPE_STRING = 9,
  TYPE_GROUP = 10,    // Deprecated, not used in nanopb
  TYPE_MESSAGE = 11,
  TYPE_BYTES = 12,
  TYPE_UINT32 = 13,
  TYPE_ENUM = 14,
  TYPE_SFIXED32 = 15,
  TYPE_SFIXED64 = 16,
  TYPE_SINT32 = 17,
  TYPE_SINT64 = 18,
}

/** Field descriptor from FileDescriptorProto */
export interface FieldDescriptorProto {
  name: string;
  number: number;
  label: number;        // FieldRule value
  type: number;         // ProtoFieldType value
  typeName?: string;    // For message/enum types
  extendee?: string;    // For extension fields
  defaultValue?: string;
  oneofIndex?: number;
  oneofName?: string;   // Name of the oneof group this field belongs to
  jsonName?: string;
  options?: FieldOptions;
  comments?: string;    // Comment text from proto file
}

/** Oneof descriptor */
export interface OneofDescriptorProto {
  name: string;
  options?: OneofOptions;
}

/** Enum descriptor */
export interface EnumDescriptorProto {
  name: string;
  value: EnumValueDescriptorProto[];
  options?: EnumOptions;
}

/** Enum value descriptor */
export interface EnumValueDescriptorProto {
  name: string;
  number: number;
  options?: EnumValueOptions;
}

/** Message descriptor */
export interface DescriptorProto {
  name: string;
  field: FieldDescriptorProto[];
  nestedType?: DescriptorProto[];
  enumType?: EnumDescriptorProto[];
  oneofDecl?: OneofDescriptorProto[];
  options?: MessageOptions;
  extension?: FieldDescriptorProto[];
}

/** File descriptor */
export interface FileDescriptorProto {
  name: string;
  package: string;
  dependency: string[];
  publicDependency: number[];
  weakDependency: number[];
  messageType: DescriptorProto[];
  enumType: EnumDescriptorProto[];
  extension: FieldDescriptorProto[];
  options: FileOptions;
  sourceCodeInfo?: SourceCodeInfo;
}

/** File options */
export interface FileOptions {
  javaPackage?: string;
  javaOuterClassname?: string;
  javaMultipleFiles?: boolean;
  javaGenerateEqualsAndHash?: boolean;
  javaStringCheckUtf8?: boolean;
  optimizeFor?: number;
  goPackage?: string;
  ccGenericServices?: boolean;
  javaGenericServices?: boolean;
  pyGenericServices?: boolean;
  deprecated?: boolean;
  ccEnableArenas?: boolean;
  objcClassPrefix?: string;
  csharpNamespace?: string;
  swiftPrefix?: string;
  phpClassPrefix?: string;
  phpNamespace?: string;
  phpMetadataNamespace?: string;
  rubyUseEmptyRubyPackage?: boolean;
  // Extensions
  nanopbFileopt?: NanoPBOptions;
}

/** Message options */
export interface MessageOptions {
  mapEntry?: boolean;
  deprecated?: boolean;
  // Extensions
  nanopbMsgopt?: NanoPBOptions;
}

/** Field options */
export interface FieldOptions {
  ctype?: number;
  packed?: boolean;
  jstype?: number;
  lazy?: boolean;
  deprecated?: boolean;
  weak?: boolean;
  unverifiedLazy?: boolean;
  debugRedact?: boolean;
  // Extensions
  nanopb?: NanoPBOptions;
}

/** Oneof options */
export interface OneofOptions {
  deprecated?: boolean;
  // Extensions
  nanopbOneofopt?: NanoPBOptions;
}

/** Enum options */
export interface EnumOptions {
  allowAlias?: boolean;
  deprecated?: boolean;
  // Extensions
  nanopbEnumopt?: NanoPBOptions;
}

/** Enum value options */
export interface EnumValueOptions {
  deprecated?: boolean;
}

/** Nanopb options (from nanopb.proto) */
export interface NanoPBOptions {
  maxSize?: number;
  maxLength?: number;
  maxCount?: number;
  type?: number;
  intSize?: number;
  enumIntSize?: number;
  longNames?: boolean;
  packedStruct?: boolean;
  packedEnum?: boolean;
  noUnions?: boolean;
  mangleNames?: number;
  callbackDatatype?: string;
  callbackFunction?: string;
  include?: string[];
  exclude?: string[];
  msgid?: number;
  descriptorSize?: number;
  enumToString?: boolean;
  skipMessage?: boolean;
  fixedLength?: boolean;
  fixedCount?: boolean;
  includePath?: string[];
  defaultOptional?: boolean;
  submsgCallback?: boolean;
  proto3MultipleFiles?: boolean;
  noDescriptor?: boolean;
  enumOriginalNames?: boolean;
  shortEnumNames?: boolean;
  customStyle?: string;
  enumValueCustom?: boolean;
}

/** Source code info for comments */
export interface SourceCodeInfo {
  location: SourceCodeLocation[];
}

/** Source code location */
export interface SourceCodeLocation {
  path: number[];
  span: number[];
  leadingComments?: string;
  trailingComments?: string;
  leadingDetachedComments?: string[];
}

/** FileDescriptorSet for protoc output */
export interface FileDescriptorSet {
  file: FileDescriptorProto[];
}

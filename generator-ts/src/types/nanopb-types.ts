/**
 * Nanopb-specific type definitions
 * Ported from nanopb.proto and nanopb_generator.py
 */

/** Field type allocation strategies */
export enum FieldType {
  FT_DEFAULT = 0, // Automatically decide field type
  FT_CALLBACK = 1, // Always generate callback field
  FT_STATIC = 2,  // Generate static field (inline in structure)
  FT_IGNORE = 3,  // Ignore field completely
  FT_POINTER = 4, // Always generate dynamically allocated field
  FT_INLINE = 5,  // Fixed length option (for strings/bytes)
}

/** Integer size override options */
export enum IntSize {
  IS_DEFAULT = 0, // Default 32/64 bit based on proto type
  IS_8 = 1,       // Force 8-bit integer
  IS_16 = 2,      // Force 16-bit integer
  IS_32 = 4,      // Force 32-bit integer
  IS_64 = 8,      // Force 64-bit integer
}

/** Descriptor size options for field descriptors */
export enum DescriptorSize {
  DS_AUTO = 0,    // Automatically select descriptor size
  DS_1 = 1,       // 1-word descriptor
  DS_2 = 2,       // 2-word descriptor
  DS_4 = 4,       // 4-word descriptor
  DS_8 = 8,       // 8-word descriptor
}

/** Typename mangling options for C name conflicts */
export enum TypenameMangling {
  M_NONE = 0,     // No mangling
  M_PACKAGE_NAME = 1, // Use package.name.MessageName format
  M_FULL_NAME = 2,    // Use fully qualified name
}

/** Nanopb generator options */
export interface NanoPBOptions {
  // Size control options
  maxSize?: number;
  maxLength?: number;
  maxCount?: number;
  fixedLength?: boolean;
  fixedCount?: boolean;

  // Type control
  type?: FieldType;
  fallbackType?: FieldType;
  intSize?: IntSize;
  enumIntSize?: IntSize;
  enumValueCustom?: boolean;

  // Naming and compatibility
  longNames?: boolean;
  packedStruct?: boolean;
  packedEnum?: boolean;
  noUnions?: boolean;
  mangleNames?: TypenameMangling;
  cStyle?: boolean;
  customStyle?: string;

  // Callback control
  callbackDatatype?: string;
  callbackFunction?: string;
  submsgCallback?: boolean;
  callbackOnly?: boolean;

  // Include control
  include?: string[];
  exclude?: string[];

  // Message ID and descriptors
  msgid?: number;
  descriptorSize?: DescriptorSize;
  skipMessage?: boolean;
  noDescriptor?: boolean;

  // Enum options
  enumToString?: boolean;
  enumOriginalNames?: boolean;
  shortEnumNames?: boolean;

  // Other options
  defaultOptional?: boolean;
  proto3MultipleFiles?: boolean;
  includePath?: string[];
}

/** Field allocation strategy with size information */
export interface FieldAllocation {
  type: FieldType;
  dataSize: number;   // Size of data type in bytes
  arraySize?: number;  // For array fields
}

/** C type information */
export interface CTypeInfo {
  cType: string;      // C type name (e.g., "int32_t")
  pbType: string;     // Protobuf type name (e.g., "INT32")
  encodedSize: number; // Maximum encoded size in bytes
  dataSize: number;   // Data size in bytes
}

/** Naming style interface */
export interface NamingStyle {
  makeIdentifier(name: string): string;
  typeName(name: string): string;
  defineName(name: string): string;
  fieldName(name: string): string;
  enumName(name: string): string;
  enumValueName(enumName: string, valueName: string): string;
}

/** Generator options interface */
export interface GeneratorOptions {
  // Input/output options
  inputFile: string;
  outputDir?: string;
  extension?: string;         // Default: ".pb"
  headerExtension?: string;   // Default: ".h"
  sourceExtension?: string;  // Default: ".c"

  // Processing options
  stripPath?: boolean;
  excludePaths?: string[];
  includePaths?: string[];

  // Options file
  optionsFile?: string;
  optionsPaths?: string[];

  // Generator settings
  cStyle?: boolean;
  customStyle?: string;
  errorCallback?: boolean;

  // Performance options
  useCpp?: boolean;
  cppCheck?: boolean;
  verbose?: boolean;
}

/** Type mapping from protobuf type to C type */
export type DataTypeMap = Map<number, CTypeInfo>;

/** Combined type and size mapping */
export type TypeSizeMap = Map<number, FieldAllocation>;

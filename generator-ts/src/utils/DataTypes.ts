/**
 * Data type mappings from protobuf types to C types
 * Ported from nanopb_generator.py datatypes dictionary
 */

import { ProtoFieldType, FieldRule } from '../types/protobuf-types.js';
import { IntSize, CTypeInfo, FieldAllocation, DataTypeMap, TypeSizeMap } from '../types/nanopb-types.js';

/** Core datatype mappings - corresponds to Python datatypes dict */
export const DATATYPES: Map<number, CTypeInfo> = new Map([
  // Basic types (without size override)
  [ProtoFieldType.TYPE_DOUBLE, { cType: 'double', pbType: 'DOUBLE', encodedSize: 8, dataSize: 8 }],
  [ProtoFieldType.TYPE_FLOAT, { cType: 'float', pbType: 'FLOAT', encodedSize: 4, dataSize: 4 }],

  // 64-bit integers
  [ProtoFieldType.TYPE_INT64, { cType: 'int64_t', pbType: 'INT64', encodedSize: 10, dataSize: 8 }],
  [ProtoFieldType.TYPE_UINT64, { cType: 'uint64_t', pbType: 'UINT64', encodedSize: 10, dataSize: 8 }],
  [ProtoFieldType.TYPE_FIXED64, { cType: 'uint64_t', pbType: 'FIXED64', encodedSize: 8, dataSize: 8 }],
  [ProtoFieldType.TYPE_SFIXED64, { cType: 'int64_t', pbType: 'SFIXED64', encodedSize: 8, dataSize: 8 }],
  [ProtoFieldType.TYPE_SINT64, { cType: 'int64_t', pbType: 'SINT64', encodedSize: 10, dataSize: 8 }],

  // 32-bit integers
  [ProtoFieldType.TYPE_INT32, { cType: 'int32_t', pbType: 'INT32', encodedSize: 10, dataSize: 4 }],
  [ProtoFieldType.TYPE_UINT32, { cType: 'uint32_t', pbType: 'UINT32', encodedSize: 10, dataSize: 4 }],
  [ProtoFieldType.TYPE_FIXED32, { cType: 'uint32_t', pbType: 'FIXED32', encodedSize: 4, dataSize: 4 }],
  [ProtoFieldType.TYPE_SFIXED32, { cType: 'int32_t', pbType: 'SFIXED32', encodedSize: 4, dataSize: 4 }],
  [ProtoFieldType.TYPE_SINT32, { cType: 'int32_t', pbType: 'SINT32', encodedSize: 10, dataSize: 4 }],

  // Other primitive types
  [ProtoFieldType.TYPE_BOOL, { cType: 'bool', pbType: 'BOOL', encodedSize: 1, dataSize: 4 }],
  [ProtoFieldType.TYPE_STRING, { cType: 'char', pbType: 'STRING', encodedSize: 0, dataSize: 1 }],
  [ProtoFieldType.TYPE_BYTES, { cType: 'uint8_t', pbType: 'BYTES', encodedSize: 0, dataSize: 1 }],

  // Complex types
  [ProtoFieldType.TYPE_ENUM, { cType: 'uint32_t', pbType: 'ENUM', encodedSize: 4, dataSize: 4 }],
  [ProtoFieldType.TYPE_MESSAGE, { cType: 'void', pbType: 'MESSAGE', encodedSize: 0, dataSize: 0 }],
]);

/** Integer size override mappings - corresponds to Python (type, size) tuples */
export const INT_SIZE_OVERRIDES: Map<number, Map<IntSize, CTypeInfo>> = new Map([
  [ProtoFieldType.TYPE_INT32, new Map([
    [IntSize.IS_8, { cType: 'int8_t', pbType: 'INT32', encodedSize: 10, dataSize: 1 }],
    [IntSize.IS_16, { cType: 'int16_t', pbType: 'INT32', encodedSize: 10, dataSize: 2 }],
    [IntSize.IS_32, { cType: 'int32_t', pbType: 'INT32', encodedSize: 10, dataSize: 4 }],
    [IntSize.IS_64, { cType: 'int64_t', pbType: 'INT32', encodedSize: 10, dataSize: 8 }],
  ])],
  [ProtoFieldType.TYPE_UINT32, new Map([
    [IntSize.IS_8, { cType: 'uint8_t', pbType: 'UINT32', encodedSize: 10, dataSize: 1 }],
    [IntSize.IS_16, { cType: 'uint16_t', pbType: 'UINT32', encodedSize: 10, dataSize: 2 }],
    [IntSize.IS_32, { cType: 'uint32_t', pbType: 'UINT32', encodedSize: 10, dataSize: 4 }],
    [IntSize.IS_64, { cType: 'uint64_t', pbType: 'UINT32', encodedSize: 10, dataSize: 8 }],
  ])],
  [ProtoFieldType.TYPE_INT64, new Map([
    [IntSize.IS_8, { cType: 'int8_t', pbType: 'INT64', encodedSize: 10, dataSize: 1 }],
    [IntSize.IS_16, { cType: 'int16_t', pbType: 'INT64', encodedSize: 10, dataSize: 2 }],
    [IntSize.IS_32, { cType: 'int32_t', pbType: 'INT64', encodedSize: 10, dataSize: 4 }],
    [IntSize.IS_64, { cType: 'int64_t', pbType: 'INT64', encodedSize: 10, dataSize: 8 }],
  ])],
  [ProtoFieldType.TYPE_UINT64, new Map([
    [IntSize.IS_8, { cType: 'uint8_t', pbType: 'UINT64', encodedSize: 10, dataSize: 1 }],
    [IntSize.IS_16, { cType: 'uint16_t', pbType: 'UINT64', encodedSize: 10, dataSize: 2 }],
    [IntSize.IS_32, { cType: 'uint32_t', pbType: 'UINT64', encodedSize: 10, dataSize: 4 }],
    [IntSize.IS_64, { cType: 'uint64_t', pbType: 'UINT64', encodedSize: 10, dataSize: 8 }],
  ])],
  [ProtoFieldType.TYPE_ENUM, new Map([
    [IntSize.IS_8, { cType: 'uint8_t', pbType: 'ENUM', encodedSize: 4, dataSize: 1 }],
    [IntSize.IS_16, { cType: 'uint16_t', pbType: 'ENUM', encodedSize: 4, dataSize: 2 }],
    [IntSize.IS_32, { cType: 'uint32_t', pbType: 'ENUM', encodedSize: 4, dataSize: 4 }],
    [IntSize.IS_64, { cType: 'uint64_t', pbType: 'ENUM', encodedSize: 4, dataSize: 8 }],
  ])],
]);

/**
 * Get C type information for a protobuf field type
 * @param protoType - Protobuf field type
 * @param intSize - Integer size override (optional)
 * @returns C type information
 */
export function getCTypeInfo(protoType: ProtoFieldType, intSize?: IntSize): CTypeInfo | null {
  // For enums with size override
  if (protoType === ProtoFieldType.TYPE_ENUM && intSize && intSize !== IntSize.IS_DEFAULT) {
    const enumOverrides = INT_SIZE_OVERRIDES.get(ProtoFieldType.TYPE_ENUM);
    return enumOverrides?.get(intSize) || null;
  }

  // For integer types with size override
  if (intSize && intSize !== IntSize.IS_DEFAULT && INT_SIZE_OVERRIDES.has(protoType)) {
    const typeOverrides = INT_SIZE_OVERRIDES.get(protoType);
    return typeOverrides?.get(intSize) || null;
  }

  // Default type lookup
  return DATATYPES.get(protoType) || null;
}

/**
 * Get field allocation information
 * @param protoType - Protobuf field type
 * @param fieldRule - Field rule (label)
 * @param intSize - Integer size override (optional)
 * @returns Field allocation information
 */
export function getFieldAllocation(
  protoType: ProtoFieldType,
  fieldRule: FieldRule,
  intSize?: IntSize
): FieldAllocation | null {
  const typeInfo = getCTypeInfo(protoType, intSize);
  if (!typeInfo) return null;

  return {
    type: fieldRule === FieldRule.REPEATED || fieldRule === FieldRule.ONEOF ? 2 : 0, // Simplified, will be expanded
    dataSize: typeInfo.dataSize,
  };
}

/**
 * Get all supported protobuf types
 * @returns Array of supported protobuf field types
 */
export function getSupportedTypes(): ProtoFieldType[] {
  return Array.from(DATATYPES.keys());
}

/**
 * Check if a type is an integer type that supports size override
 * @param protoType - Protobuf field type to check
 * @returns True if type supports integer size override
 */
export function supportsIntSizeOverride(protoType: ProtoFieldType): boolean {
  return INT_SIZE_OVERRIDES.has(protoType);
}

/**
 * Get available integer size overrides for a type
 * @param protoType - Protobuf field type
 * @returns Array of available integer size options
 */
export function getAvailableIntSizes(protoType: ProtoFieldType): IntSize[] {
  const overrides = INT_SIZE_OVERRIDES.get(protoType);
  return overrides ? Array.from(overrides.keys()) : [];
}

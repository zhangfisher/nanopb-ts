/**
 * Varint size calculations for protobuf encoding
 * Ported from nanopb_generator.py varint size calculations
 */

import { ProtoFieldType } from '../types/protobuf-types.js';
import { IntSize } from '../types/nanopb-types.js';

// Import from DataTypes to avoid circular dependency
import { getCTypeInfo as getDataTypeInfo } from './DataTypes.js';

// Use the imported function
const getCTypeInfo = getDataTypeInfo;

/**
 * Calculate the number of bytes required to encode a varint
 * @param value - Integer value to encode
 * @returns Number of bytes required (1-10 for 64-bit, 1-5 for 32-bit)
 */
export function calculateVarintSize(value: number): number {
  if (value <= 0x7F) return 1;
  if (value <= 0x3FFF) return 2;
  if (value <= 0x1FFFFF) return 3;
  if (value <= 0xFFFFFFF) return 4;
  return 5; // Up to 2^28-1
}

/**
 * Calculate varint size for 64-bit values
 * @param value - 64-bit integer value (as number or bigint)
 * @returns Number of bytes required (1-10)
 */
export function calculateVarintSize64(value: number | bigint): number {
  if (typeof value === 'bigint') {
    if (value <= 0x7Fn) return 1;
    if (value <= 0x3FFFn) return 2;
    if (value <= 0x1FFFFFn) return 3;
    if (value <= 0xFFFFFFFn) return 4;
    if (value <= 0x7FFFFFFFFn) return 5;
    if (value <= 0x3FFFFFFFFFFn) return 6;
    if (value <= 0x1FFFFFFFFFFn) return 7;
    if (value <= 0xFFFFFFFFFFFFn) return 8;
    if (value <= 0x7FFFFFFFFFFFFFn) return 9;
    return 10;
  } else {
    // For regular numbers, we need to handle carefully due to precision
    const absValue = Math.abs(value);
    if (absValue <= 0x7F) return 1;
    if (absValue <= 0x3FFF) return 2;
    if (absValue <= 0x1FFFFF) return 3;
    if (absValue <= 0xFFFFFFF) return 4;
    if (absValue <= 0x7FFFFFFF) return 5;
    if (absValue <= 0x3FFFFFFFF) return 6;
    if (absValue <= 0x1FFFFFFFFFF) return 7;
    if (absValue <= 0xFFFFFFFFFFFF) return 8;
    if (absValue <= 0x7FFFFFFFFFFFFF) return 9;
    return 10;
  }
}

/**
 * Get the encoded size for a protobuf field type
 * @param protoType - Protobuf field type
 * @param intSize - Integer size override (for enums/ints)
 * @returns Maximum encoded size in bytes
 */
export function getEncodedSize(protoType: ProtoFieldType, intSize?: IntSize): number {
  const typeInfo = getCTypeInfo(protoType, intSize);
  if (!typeInfo) return 0;

  return typeInfo.encodedSize;
}

/**
 * Calculate the maximum encoded size for a repeated field
 * @param protoType - Protobuf field type
 * @param maxCount - Maximum number of elements in the array
 * @param intSize - Integer size override (optional)
 * @returns Maximum encoded size in bytes
 */
export function getRepeatedEncodedSize(
  protoType: ProtoFieldType,
  maxCount: number,
  intSize?: IntSize
): number {
  const singleSize = getEncodedSize(protoType, intSize);
  const tagSize = calculateVarintSize(1); // Tag size, simplified
  return maxCount * (tagSize + singleSize);
}

/**
 * Calculate the maximum encoded size for a string/bytes field
 * @param maxLength - Maximum length of the string/bytes
 * @returns Maximum encoded size in bytes
 */
export function getStringEncodedSize(maxLength: number): number {
  const tagSize = calculateVarintSize(1); // Tag size
  const lengthSize = calculateVarintSize(maxLength); // Length prefix
  return tagSize + lengthSize + maxLength;
}

/**
 * Calculate the maximum encoded size for a message field
 * @param maxMessageSize - Maximum size of the nested message
 * @returns Maximum encoded size in bytes
 */
export function getMessageEncodedSize(maxMessageSize: number): number {
  const tagSize = calculateVarintSize(1); // Tag size
  const lengthSize = calculateVarintSize(maxMessageSize); // Length prefix
  return tagSize + lengthSize + maxMessageSize;
}

/**
 * Estimate the maximum encoded size for a field
 * @param protoType - Protobuf field type
 * @param fieldRule - Field rule (optional/repeated/etc)
 * @param maxSize - Maximum size parameter (for strings/bytes)
 * @param maxCount - Maximum count parameter (for repeated fields)
 * @param intSize - Integer size override
 * @returns Estimated maximum encoded size
 */
export function estimateEncodedSize(
  protoType: ProtoFieldType,
  fieldRule: number,
  maxSize?: number,
  maxCount?: number,
  intSize?: IntSize
): number {
  switch (protoType) {
    case ProtoFieldType.TYPE_STRING:
    case ProtoFieldType.TYPE_BYTES:
      if (maxSize !== undefined) {
        return getStringEncodedSize(maxSize);
      }
      return 0; // Unknown size

    case ProtoFieldType.TYPE_MESSAGE:
      if (maxSize !== undefined) {
        return getMessageEncodedSize(maxSize);
      }
      return 0; // Unknown size

    default:
      // For primitive types
      if (maxCount !== undefined && maxCount > 1) {
        return getRepeatedEncodedSize(protoType, maxCount, intSize);
      }
      const singleSize = getEncodedSize(protoType, intSize);
      return calculateVarintSize(1) + singleSize;
  }
}

/**
 * Calculate wire type for a protobuf field type
 * @param protoType - Protobuf field type
 * @returns Wire type (0-6)
 */
export function getWireType(protoType: ProtoFieldType): number {
  switch (protoType) {
    case ProtoFieldType.TYPE_DOUBLE:
    case ProtoFieldType.TYPE_FIXED64:
    case ProtoFieldType.TYPE_SFIXED64:
      return 1; // 64-bit

    case ProtoFieldType.TYPE_FLOAT:
    case ProtoFieldType.TYPE_FIXED32:
    case ProtoFieldType.TYPE_SFIXED32:
      return 5; // 32-bit

    case ProtoFieldType.TYPE_STRING:
    case ProtoFieldType.TYPE_BYTES:
    case ProtoFieldType.TYPE_MESSAGE:
      return 2; // Length-delimited

    default:
      // Varint types
      return 0;
  }
}

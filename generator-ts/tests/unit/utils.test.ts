/**
 * Unit tests for utility functions
 */

import { describe, it, expect } from 'bun:test';
import {
  getCTypeInfo,
  getFieldAllocation,
  supportsIntSizeOverride,
  getAvailableIntSizes,
} from '../../src/utils/DataTypes.js';
import { ProtoFieldType, IntSize } from '../../src/types/protobuf-types.js';
import { FieldRule } from '../../src/types/protobuf-types.js';
import {
  calculateVarintSize,
  getEncodedSize,
  getStringEncodedSize,
  getWireType,
} from '../../src/utils/VarintUtils.js';
import {
  isReservedKeyword,
  makeSafeIdentifier,
  isValidCIdentifier,
  toValidCIdentifier,
  camelToSnakeCase,
  snakeToPascalCase,
  toMacroName,
} from '../../src/utils/ReservedWords.js';
import { Globals } from '../../src/core/Globals.js';
import { NamingStyleC } from '../../src/naming/NamingStyle.js';

describe('DataTypes', () => {
  it('should get correct C type info for basic types', () => {
    const doubleInfo = getCTypeInfo(ProtoFieldType.TYPE_DOUBLE);
    expect(doubleInfo).toEqual({
      cType: 'double',
      pbType: 'DOUBLE',
      encodedSize: 8,
      dataSize: 8,
    });

    const int32Info = getCTypeInfo(ProtoFieldType.TYPE_INT32);
    expect(int32Info).toEqual({
      cType: 'int32_t',
      pbType: 'INT32',
      encodedSize: 10,
      dataSize: 4,
    });
  });

  it('should support integer size overrides', () => {
    const int32_8bit = getCTypeInfo(ProtoFieldType.TYPE_INT32, 1); // IS_8
    expect(int32_8bit).toEqual({
      cType: 'int8_t',
      pbType: 'INT32',
      encodedSize: 10,
      dataSize: 1,
    });

    const int32_16bit = getCTypeInfo(ProtoFieldType.TYPE_INT32, 2); // IS_16
    expect(int32_16bit).toEqual({
      cType: 'int16_t',
      pbType: 'INT32',
      encodedSize: 10,
      dataSize: 2,
    });
  });

  it('should detect types supporting integer size override', () => {
    expect(supportsIntSizeOverride(ProtoFieldType.TYPE_INT32)).toBe(true);
    expect(supportsIntSizeOverride(ProtoFieldType.TYPE_STRING)).toBe(false);
    expect(supportsIntSizeOverride(ProtoFieldType.TYPE_MESSAGE)).toBe(false);
  });

  it('should get available integer sizes for types', () => {
    const int32Sizes = getAvailableIntSizes(ProtoFieldType.TYPE_INT32);
    expect(int32Sizes.length).toBeGreaterThan(0);

    const stringSizes = getAvailableIntSizes(ProtoFieldType.TYPE_STRING);
    expect(stringSizes.length).toBe(0);
  });
});

describe('VarintUtils', () => {
  it('should calculate varint sizes correctly', () => {
    expect(calculateVarintSize(0x7F)).toBe(1);
    expect(calculateVarintSize(0x80)).toBe(2);
    expect(calculateVarintSize(0x3FFF)).toBe(2);
    expect(calculateVarintSize(0x4000)).toBe(3);
  });

  it('should get encoded sizes for field types', () => {
    expect(getEncodedSize(ProtoFieldType.TYPE_DOUBLE)).toBe(8);
    expect(getEncodedSize(ProtoFieldType.TYPE_FLOAT)).toBe(4);
    expect(getEncodedSize(ProtoFieldType.TYPE_INT32)).toBe(10);
  });

  it('should calculate string encoded sizes', () => {
    expect(getStringEncodedSize(100)).toBeGreaterThan(100);
    expect(getStringEncodedSize(1000)).toBeGreaterThan(1000);
  });

  it('should get correct wire types', () => {
    expect(getWireType(ProtoFieldType.TYPE_DOUBLE)).toBe(1); // 64-bit
    expect(getWireType(ProtoFieldType.TYPE_FLOAT)).toBe(5); // 32-bit
    expect(getWireType(ProtoFieldType.TYPE_STRING)).toBe(2); // Length-delimited
    expect(getWireType(ProtoFieldType.TYPE_INT32)).toBe(0); // Varint
  });
});

describe('ReservedWords', () => {
  it('should identify C reserved keywords', () => {
    expect(isReservedKeyword('int')).toBe(true);
    expect(isReservedKeyword('return')).toBe(true);
    expect(isReservedKeyword('while')).toBe(true);
    expect(isReservedKeyword('myVariable')).toBe(false);
  });

  it('should make safe identifiers from reserved words', () => {
    expect(makeSafeIdentifier('int')).toBe('_int');
    expect(makeSafeIdentifier('return')).toBe('_return');
    expect(makeSafeIdentifier('myVariable')).toBe('myVariable');
  });

  it('should validate C identifiers', () => {
    expect(isValidCIdentifier('valid_name123')).toBe(true);
    expect(isValidCIdentifier('123invalid')).toBe(false);
    expect(isValidCIdentifier('invalid-name')).toBe(false);
    expect(isValidCIdentifier('int')).toBe(true); // Valid identifier, even if reserved
  });

  it('should convert invalid strings to valid C identifiers', () => {
    expect(toValidCIdentifier('123invalid')).toBe('_23invalid'); // 数字被替换为下划线
    expect(toValidCIdentifier('invalid-name')).toBe('invalid_name');
    expect(toValidCIdentifier('valid_name')).toBe('valid_name');
  });

  it('should convert between naming conventions', () => {
    expect(camelToSnakeCase('camelCase')).toBe('camel_case');
    expect(camelToSnakeCase('PascalCase')).toBe('pascal_case');
    expect(snakeToPascalCase('snake_case')).toBe('SnakeCase');
    expect(toMacroName('camelCase')).toBe('CAMEL_CASE');
    expect(toMacroName('snake_case')).toBe('SNAKE_CASE');
  });
});

describe('Globals', () => {
  it('should manage global state', () => {
    const globals = Globals.getInstance();

    globals.setPackageName('com.example.package');
    expect(globals.packageName).toBe('com.example.package');

    globals.setCurrentFilename('test.proto');
    expect(globals.currentFilename).toBe('test.proto');

    globals.addGeneratedFile('test.pb.h');
    expect(globals.isFileGenerated('test.pb.h')).toBe(true);

    globals.reset();
    expect(globals.packageName).toBe('');
    expect(globals.currentFilename).toBe('');
  });

  it('should manage separate options', () => {
    const globals = Globals.getInstance();

    globals.addSeparateOption('MessageName.*', { maxSize: 100 });
    globals.addSeparateOption('FieldName', { type: 2 });

    expect(globals.separateOptions.length).toBe(2);

    globals.clearSeparateOptions();
    expect(globals.separateOptions.length).toBe(0);

    globals.reset();
  });

  it('should manage include paths', () => {
    const globals = Globals.getInstance();

    globals.setIncludePaths(['/usr/include', '/opt/include']);
    expect(globals.includePaths).toEqual(['/usr/include', '/opt/include']);

    globals.addIncludePath('/usr/local/include');
    expect(globals.includePaths.length).toBe(3);

    globals.reset();
  });
});

describe('NamingStyleC', () => {
  it('should generate C style names', () => {
    const namingStyle = new NamingStyleC(false, '');

    expect(namingStyle.typeName('MessageName')).toBe('Messagename');
    expect(namingStyle.defineName('MessageName')).toBe('MESSAGE_NAME'); // 修复为正确的预期值
    expect(namingStyle.fieldName('fieldName')).toBe('fieldname');
  });

  it('should use long names when enabled', () => {
    const namingStyle = new NamingStyleC(true, 'com_example');

    expect(namingStyle.typeName('MessageName')).toBe('com_example_Messagename'); // 修复大小写
    expect(namingStyle.defineName('MessageName')).toBe('com_example_MESSAGE_NAME'); // 修复为正确的预期值
  });
});

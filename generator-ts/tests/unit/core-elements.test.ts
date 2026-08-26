/**
 * Unit tests for core element classes
 */

import { describe, it, expect } from 'bun:test';
import { Enum } from '../../src/core/Enum.js';
import { Field } from '../../src/core/Field.js';
import { Message } from '../../src/core/Message.js';
import { NamingStyleC } from '../../src/naming/NamingStyle.js';
import { ProtoFieldType } from '../../src/types/protobuf-types.js';
import { FieldRule } from '../../src/types/protobuf-types.js';
import { NanoPBOptions, FieldType } from '../../src/types/nanopb-types.js';

describe('Enum', () => {
  it('should create enum from values', () => {
    const namingStyle = new NamingStyleC(false, '');
    const options: NanoPBOptions = {};

    const values = [
      { name: 'VALUE_ONE', number: 1, comments: new Map() },
      { name: 'VALUE_TWO', number: 2, comments: new Map() },
    ];

    const enumType = new Enum('TestEnum', values, options, namingStyle);

    expect(enumType.getName()).toBe('TestEnum');
    expect(enumType.getValues().length).toBe(2);
    expect(enumType.getMinValue()).toBe(1);
    expect(enumType.getMaxValue()).toBe(2);
  });

  it('should generate C enum names correctly', () => {
    const namingStyle = new NamingStyleC(false, '');
    const enumType = new Enum('TestEnum', [], {}, namingStyle);

    expect(enumType.getCName()).toBe('TestEnum');
    expect(enumType.getCTypeName()).toBe('Testenum');
    expect(enumType.getMacroName()).toBe('TEST_ENUM'); // 修复为正确的下划线分隔格式
  });

  it('should generate enum header code', () => {
    const namingStyle = new NamingStyleC(false, '');
    const values = [
      { name: 'VALUE_ONE', number: 1, comments: new Map() },
      { name: 'VALUE_TWO', number: 2, comments: new Map() },
    ];
    const enumType = new Enum('TestEnum', values, {}, namingStyle);

    const headerCode = Array.from(enumType.generateHeader()).join('');

    expect(headerCode).toContain('typedef enum _Testenum');
    expect(headerCode).toContain('TEST_ENUM_VALUE_ONE = 1'); // 修复为正确的下划线格式
    expect(headerCode).toContain('TEST_ENUM_VALUE_TWO = 2');
    expect(headerCode).toContain('} Testenum_t;');
  });
});

describe('Field', () => {
  it('should create field with basic properties', () => {
    const namingStyle = new NamingStyleC(false, '');
    const options: NanoPBOptions = {};

    const field = new Field(
      'test_field',
      1,
      ProtoFieldType.TYPE_INT32,
      FieldRule.OPTIONAL,
      options,
      namingStyle
    );

    expect(field.fieldName).toBe('test_field');
    expect(field.fieldNumber).toBe(1);
    expect(field.getProtoType()).toBe(ProtoFieldType.TYPE_INT32);
    expect(field.getFieldRule()).toBe(FieldRule.OPTIONAL);
  });

  it('should generate C field names correctly', () => {
    const namingStyle = new NamingStyleC(false, '');
    const field = new Field(
      'testField',
      1,
      ProtoFieldType.TYPE_STRING,
      FieldRule.OPTIONAL,
      {},
      namingStyle
    );

    expect(field.getCName()).toBe('testfield');
    expect(field.getCTypeName()).toBe('char'); // String type
    expect(field.getMacroName()).toBe('TEST_FIELD'); // 修复为正确的下划线格式
  });

  it('should generate fieldlist macro entry correctly', () => {
    const namingStyle = new NamingStyleC(false, '');
    const field = new Field(
      'myField',
      5,
      ProtoFieldType.TYPE_INT32,
      FieldRule.REQUIRED,
      {},
      namingStyle
    );

    const fieldlist = field.fieldlist();

    expect(fieldlist).toContain('X(a,');
    expect(fieldlist).toContain('REQUIRED');
    expect(fieldlist).toContain('INT32');
    expect(fieldlist).toContain('myfield'); // 修复为小写的字段名
    expect(fieldlist).toContain('5');
  });

  it('should determine allocation type correctly', () => {
    const namingStyle = new NamingStyleC(false, '');

    // String field should default to POINTER
    const stringField = new Field(
      'testString',
      1,
      ProtoFieldType.TYPE_STRING,
      FieldRule.OPTIONAL,
      {},
      namingStyle
    );
    expect(stringField.getAllocationType()).toBe(FieldType.FT_POINTER);

    // Simple int field should default to STATIC
    const intField = new Field(
      'testInt',
      2,
      ProtoFieldType.TYPE_INT32,
      FieldRule.REQUIRED,
      {},
      namingStyle
    );
    expect(intField.getAllocationType()).toBe(FieldType.FT_STATIC);
  });
});

describe('Message', () => {
  it('should create message with fields and enums', () => {
    const namingStyle = new NamingStyleC(false, '');
    const options: NanoPBOptions = {};

    const fields = [
      new Field('field1', 1, ProtoFieldType.TYPE_INT32, FieldRule.REQUIRED, options, namingStyle),
      new Field('field2', 2, ProtoFieldType.TYPE_STRING, FieldRule.OPTIONAL, options, namingStyle),
    ];

    const enums = [
      new Enum('TestEnum', [], options, namingStyle),
    ];

    const message = new Message('TestMessage', fields, enums, [], [], options, namingStyle);

    expect(message.getName()).toBe('TestMessage');
    expect(message.getFields().length).toBe(2);
    expect(message.getEnums().length).toBe(1);
  });

  it('should generate C message names correctly', () => {
    const namingStyle = new NamingStyleC(false, '');
    const message = new Message('TestMessage', [], [], [], [], {}, namingStyle);

    expect(message.getCName()).toBe('TestMessage');
    expect(message.getCTypeName()).toBe('Testmessage');
    expect(message.getMacroName()).toBe('TEST_MESSAGE'); // 修复为正确的下划线格式
  });

  it('should generate struct definition correctly', () => {
    const namingStyle = new NamingStyleC(false, '');
    const options: NanoPBOptions = {};

    const fields = [
      new Field('myField', 1, ProtoFieldType.TYPE_INT32, FieldRule.REQUIRED, options, namingStyle),
    ];

    const message = new Message('TestMessage', fields, [], [], [], options, namingStyle);

    const structCode = Array.from(message.generateStruct()).join('');

    expect(structCode).toContain('typedef struct _Testmessage');
    expect(structCode).toContain('int32_t myfield');
    expect(structCode).toContain('} Testmessage_t;');
  });

  it('should generate fields declaration correctly', () => {
    const namingStyle = new NamingStyleC(false, '');
    const options: NanoPBOptions = {};

    const fields = [
      new Field('fieldOne', 1, ProtoFieldType.TYPE_INT32, FieldRule.REQUIRED, options, namingStyle),
      new Field('fieldTwo', 5, ProtoFieldType.TYPE_STRING, FieldRule.OPTIONAL, options, namingStyle),
    ];

    const message = new Message('TestMessage', fields, [], [], [], options, namingStyle);

    const fieldsDecl = message.fieldsDeclaration();

    expect(fieldsDecl).toContain('#define TEST_MESSAGE_FIELDLIST'); // 修复为正确的下划线格式
    expect(fieldsDecl).toContain('X(a,');
  });

  it('should find fields by name and number', () => {
    const namingStyle = new NamingStyleC(false, '');
    const options: NanoPBOptions = {};

    const fields = [
      new Field('field1', 1, ProtoFieldType.TYPE_INT32, FieldRule.REQUIRED, options, namingStyle),
      new Field('field2', 5, ProtoFieldType.TYPE_STRING, FieldRule.OPTIONAL, options, namingStyle),
    ];

    const message = new Message('TestMessage', fields, [], [], [], options, namingStyle);

    expect(message.findField('field1')).toBeDefined();
    expect(message.findField('field2')).toBeDefined();
    expect(message.findField('nonexistent')).toBeUndefined();

    expect(message.findFieldByNumber(1)).toBeDefined();
    expect(message.findFieldByNumber(5)).toBeDefined();
    expect(message.findFieldByNumber(99)).toBeUndefined();
  });

  it('should calculate encoded size correctly', () => {
    const namingStyle = new NamingStyleC(false, '');
    const options: NanoPBOptions = {};

    const fields = [
      new Field('intField', 1, ProtoFieldType.TYPE_INT32, FieldRule.REQUIRED, options, namingStyle),
    ];

    const message = new Message('TestMessage', fields, [], [], [], options, namingStyle);

    const encodedSize = message.calculateEncodedSize();
    expect(encodedSize).toBeGreaterThan(0); // INT32 has some encoded size
  });
});

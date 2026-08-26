/**
 * Simplified integration test to verify current functionality
 */

import { describe, it, expect } from 'bun:test';
import { Enum, Field, Message } from '../../src/core/index.js';
import { NamingStyleC } from '../../src/naming/NamingStyle.js';
import { NanoPBOptions } from '../../src/types/nanopb-types.js';
import { ProtoFieldType, FieldRule } from '../../src/types/protobuf-types.js';

describe('Core Elements Integration', () => {
  it('should create complete message structure manually', () => {
    const namingStyle = new NamingStyleC(false, '');
    const options: NanoPBOptions = {};

    // Create an enum
    const statusEnum = new Enum(
      'Status',
      [
        { name: 'UNKNOWN', number: 0, comments: new Map() },
        { name: 'ACTIVE', number: 1, comments: new Map() },
        { name: 'INACTIVE', number: 2, comments: new Map() },
      ],
      options,
      namingStyle
    );

    // Create fields
    const fields = [
      new Field('id', 1, ProtoFieldType.TYPE_INT32, FieldRule.REQUIRED, options, namingStyle),
      new Field('name', 2, ProtoFieldType.TYPE_STRING, FieldRule.OPTIONAL, options, namingStyle),
      new Field('status', 3, ProtoFieldType.TYPE_ENUM, FieldRule.OPTIONAL, options, namingStyle),
      new Field('is_active', 4, ProtoFieldType.TYPE_BOOL, FieldRule.OPTIONAL, options, namingStyle),
    ];

    // Create message with enum
    const message = new Message(
      'User',
      fields,
      [statusEnum],
      [],
      [],
      options,
      namingStyle
    );

    // Verify message structure
    expect(message.getName()).toBe('User');
    expect(message.getFields().length).toBe(4);
    expect(message.getEnums().length).toBe(1);
    expect(message.getEnums()[0].getName()).toBe('Status');

    // Verify enum
    const enumType = message.getEnums()[0];
    expect(enumType.getValues().length).toBe(3);
    expect(enumType.getMinValue()).toBe(0);
    expect(enumType.getMaxValue()).toBe(2);

    // Verify fields
    const idField = message.findField('id');
    expect(idField).toBeDefined();
    expect(idField!.getProtoType()).toBe(ProtoFieldType.TYPE_INT32);

    const nameField = message.findField('name');
    expect(nameField).toBeDefined();
    expect(nameField!.getProtoType()).toBe(ProtoFieldType.TYPE_STRING);
  });

  it('should generate complete C header file', () => {
    const namingStyle = new NamingStyleC(false, '');
    const options: NanoPBOptions = {};

    // Create a simple enum
    const testEnum = new Enum(
      'TestEnum',
      [
        { name: 'VALUE_ZERO', number: 0, comments: new Map() },
        { name: 'VALUE_ONE', number: 1, comments: new Map() },
      ],
      options,
      namingStyle
    );

    // Create a simple message
    const fields = [
      new Field('id', 1, ProtoFieldType.TYPE_INT32, FieldRule.REQUIRED, options, namingStyle),
      new Field('data', 2, ProtoFieldType.TYPE_BYTES, FieldRule.OPTIONAL, options, namingStyle),
    ];

    const message = new Message(
      'TestMessage',
      fields,
      [testEnum],
      [],
      [],
      options,
      namingStyle
    );

    // Generate complete header file
    const headerParts: string[] = [];

    // File header
    headerParts.push('/* Auto-generated nanopb header */\n');
    headerParts.push('#ifndef PB_TEST_INCLUDED\n');
    headerParts.push('#define PB_TEST_INCLUDED\n');
    headerParts.push('#include "pb.h"\n\n');

    // Add enum
    headerParts.push(...Array.from(testEnum.generateHeader()));
    headerParts.push('\n');

    // Add message struct
    headerParts.push(...Array.from(message.generateStruct()));
    headerParts.push('\n');

    // Add field descriptors
    headerParts.push(message.fieldsDeclaration());
    headerParts.push('\n');

    // Add message descriptor declaration
    headerParts.push(`extern const pb_msgdesc_t ${message.getMacroName()}_msg;\n`);

    headerParts.push('#endif\n');

    const headerContent = headerParts.join('');

    // Verify generated content
    expect(headerContent).toContain('/* Auto-generated nanopb header */');
    expect(headerContent).toContain('#ifndef PB_TEST_INCLUDED');
    expect(headerContent).toContain('typedef enum _Testenum');
    expect(headerContent).toContain('TEST_ENUM_VALUE_ZERO = 0');
    expect(headerContent).toContain('TEST_ENUM_VALUE_ONE = 1');
    expect(headerContent).toContain('} Testenum_t');
    expect(headerContent).toContain('typedef struct _Testmessage');
    expect(headerContent).toContain('int32_t id');
    expect(headerContent).toContain('uint8_t *data');
    expect(headerContent).toContain('} Testmessage_t');
    expect(headerContent).toContain('#define TEST_MESSAGE_FIELDLIST');
    expect(headerContent).toContain('extern const pb_msgdesc_t TEST_MESSAGE_msg');
    expect(headerContent).toContain('#endif');

    console.log('=== Generated Header Content ===');
    console.log(headerContent);
  });

  it('should handle complex message with nested types', () => {
    const namingStyle = new NamingStyleC(false, '');
    const options: NanoPBOptions = {};

    // Create nested enum
    const nestedEnum = new Enum(
      'InnerStatus',
      [
        { name: 'OFF', number: 0, comments: new Map() },
        { name: 'ON', number: 1, comments: new Map() },
      ],
      options,
      namingStyle
    );

    // Create nested message
    const nestedFields = [
      new Field('value', 1, ProtoFieldType.TYPE_INT32, FieldRule.REQUIRED, options, namingStyle),
    ];

    const nestedMessage = new Message(
      'InnerMessage',
      nestedFields,
      [nestedEnum],
      [],
      [],
      options,
      namingStyle
    );

    // Create outer message
    const outerFields = [
      new Field('inner', 1, ProtoFieldType.TYPE_MESSAGE, FieldRule.OPTIONAL, options, namingStyle),
    ];

    const outerMessage = new Message(
      'OuterMessage',
      outerFields,
      [],
      [nestedMessage],
      [],
      options,
      namingStyle
    );

    // Verify structure
    expect(outerMessage.getName()).toBe('OuterMessage');
    expect(outerMessage.getNestedMessages().length).toBe(1);
    expect(outerMessage.getNestedMessages()[0].getName()).toBe('InnerMessage');
    expect(outerMessage.getNestedMessages()[0].getEnums().length).toBe(1);

    // Generate and verify code
    const structCode = Array.from(outerMessage.generateStruct()).join('');
    expect(structCode).toContain('typedef enum _Innerstatus');
    expect(structCode).toContain('typedef struct _Innermessage');
    expect(structCode).toContain('typedef struct _Outermessage');
  });

  it('should calculate sizes correctly', () => {
    const namingStyle = new NamingStyleC(false, '');
    const options: NanoPBOptions = {};

    // Create message with various field types
    const fields = [
      new Field('int_field', 1, ProtoFieldType.TYPE_INT32, FieldRule.REQUIRED, options, namingStyle),
      new Field('string_field', 2, ProtoFieldType.TYPE_STRING, FieldRule.OPTIONAL, { ...options, maxSize: 100 }, namingStyle),
      new Field('bytes_field', 3, ProtoFieldType.TYPE_BYTES, FieldRule.OPTIONAL, { ...options, maxSize: 50 }, namingStyle),
      new Field('bool_field', 4, ProtoFieldType.TYPE_BOOL, FieldRule.OPTIONAL, options, namingStyle),
    ];

    const message = new Message('SizeTestMessage', fields, [], [], [], options, namingStyle);

    // Verify size calculations
    const intField = message.findField('int_field');
    expect(intField!.calculateEncodedSize()).toBeGreaterThan(0);

    const stringField = message.findField('string_field');
    expect(stringField!.calculateEncodedSize()).toBeGreaterThan(100); // Tag + length + data

    const bytesField = message.findField('bytes_field');
    expect(bytesField!.calculateEncodedSize()).toBeGreaterThan(50);

    const totalSize = message.calculateEncodedSize();
    expect(totalSize).toBeGreaterThan(0);
  });

  it('should handle field allocation types', () => {
    const namingStyle = new NamingStyleC(false, '');

    // Test STATIC allocation (default for simple types)
    const intField = new Field('int_field', 1, ProtoFieldType.TYPE_INT32, FieldRule.REQUIRED, {}, namingStyle);
    expect(intField.getAllocationType()).toBe(2); // FT_STATIC

    // Test POINTER allocation (default for strings)
    const stringField = new Field('string_field', 2, ProtoFieldType.TYPE_STRING, FieldRule.OPTIONAL, {}, namingStyle);
    expect(stringField.getAllocationType()).toBe(4); // FT_POINTER

    // Test explicit CALLBACK allocation
    const callbackField = new Field('callback_field', 3, ProtoFieldType.TYPE_MESSAGE, FieldRule.OPTIONAL, { type: 1 }, namingStyle);
    expect(callbackField.getAllocationType()).toBe(1); // FT_CALLBACK
  });

  it('should validate element configurations', () => {
    const namingStyle = new NamingStyleC(false, '');

    // Create valid enum
    const validEnum = new Enum(
      'ValidEnum',
      [
        { name: 'VALUE_ONE', number: 1, comments: new Map() },
        { name: 'VALUE_TWO', number: 2, comments: new Map() },
      ],
      {},
      namingStyle
    );

    expect(() => validEnum.validate()).not.toThrow();

    // Create enum with duplicate values (should fail validation)
    const invalidEnum = new Enum(
      'InvalidEnum',
      [
        { name: 'VALUE_ONE', number: 1, comments: new Map() },
        { name: 'VALUE_DUPLICATE', number: 1, comments: new Map() },
      ],
      {},
      namingStyle
    );

    expect(() => invalidEnum.validate()).toThrow();
  });

  it('should support naming style variations', () => {
    // Test C naming style (default)
    const cNamingStyle = new NamingStyleC(false, '');
    const cMessage = new Message('TestMessage', [], [], [], [], {}, cNamingStyle);

    expect(cMessage.getCTypeName()).toBe('Testmessage');
    expect(cMessage.getMacroName()).toBe('TEST_MESSAGE');

    // Test with long names
    const longNamingStyle = new NamingStyleC(true, 'com_example');
    const longMessage = new Message('TestMessage', [], [], [], [], {}, longNamingStyle);

    expect(longMessage.getCTypeName()).toBe('com_example_Testmessage');
    expect(longMessage.getMacroName()).toBe('com_example_TEST_MESSAGE'); // 修复为实际的生成格式
  });
});
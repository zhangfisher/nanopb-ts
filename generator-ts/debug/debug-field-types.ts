/**
 * Debug script to understand protobufjs field types
 */

import protobuf from 'protobufjs';

const protoContent = `
syntax = "proto3";
package example;

enum Status {
  UNKNOWN = 0;
  ACTIVE = 1;
}

message User {
  int32 id = 1;
  string name = 2;
  Status status = 3;
  bool is_admin = 4;
  repeated string tags = 5;
}`;

try {
  const parsed = protobuf.parse(protoContent);
  const root = parsed.root || parsed;

  // Get the User message
  const userMessage = root.lookupType('example.User');

  console.log('=== Field Types Debug ===\n');
  console.log('User message fields:');

  for (const [fieldName, field] of Object.entries(userMessage.fields)) {
    console.log(`\nField: ${fieldName}`);
    console.log(`  name: ${field.name}`);
    console.log(`  id: ${field.id}`);
    console.log(`  type: ${field.type}`);
    console.log(`  rule: ${field.rule}`);
    console.log(`  resolvedType: ${field.resolvedType ? field.resolvedType.name : 'none'}`);

    // Check if it's a message or enum
    if (field.resolvedType) {
      console.log(`  resolvedType constructor: ${field.resolvedType.constructor?.name}`);
      if (field.resolvedType.values) {
        console.log(`  resolvedType has values -> it's an enum`);
      }
      if (field.resolvedType.fieldsArray) {
        console.log(`  resolvedType has fieldsArray -> it's a message`);
      }
    }
  }

  // Test our type mapping
  console.log('\n=== Type Mapping Test ===');
  const typeMap: Record<string, number> = {
    'double': 1,
    'float': 2,
    'int64': 3,
    'uint64': 4,
    'int32': 5,
    'fixed64': 6,
    'fixed32': 7,
    'bool': 8,
    'string': 9,
    'message': 11,
    'bytes': 12,
    'uint32': 13,
    'enum': 14,
    'sfixed32': 15,
    'sfixed64': 16,
    'sint32': 17,
    'sint64': 18,
  };

  for (const [fieldName, field] of Object.entries(userMessage.fields)) {
    const mappedType = typeMap[field.type];
    console.log(`${field.type} -> ${mappedType || 'UNKNOWN'}`);
  }

} catch (error: any) {
  console.error('Error:', error.message);
}
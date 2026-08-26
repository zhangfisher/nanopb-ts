/**
 * Debug enum structure more deeply
 */

import protobuf from 'protobufjs';

const protoContent = `
syntax = "proto3";
package example;

enum Status {
  UNKNOWN = 0;
  ACTIVE = 1;
  INACTIVE = 2;
}

message User {
  int32 id = 1;
  Status status = 2;
}`;

try {
  const parsed = protobuf.parse(protoContent);
  const root = parsed.root || parsed;

  console.log('=== Detailed Enum Structure ===\n');

  // Get Status using lookup
  const statusEnum = root.lookupEnum('example.Status');
  console.log('Status from lookupEnum:');
  console.log('  Constructor:', statusEnum.constructor.name);
  console.log('  Has values:', !!statusEnum.values);
  console.log('  Has valuesArray:', !!statusEnum.valuesArray);
  console.log('  Values:', statusEnum.values);
  console.log('  ValuesArray:', statusEnum.valuesArray);

  // Get Status directly from namespace
  const statusDirect = root.nested.example.Status;
  console.log('\nStatus from direct access:');
  console.log('  Constructor:', statusDirect.constructor.name);
  console.log('  All properties:', Object.keys(statusDirect));

  // Check if direct Status has valuesArray
  console.log('\nChecking properties:');
  console.log('  Has valuesArray:', !!statusDirect.valuesArray);
  console.log('  Has values:', !!statusDirect.values);
  console.log('  Has fieldsArray:', !!statusDirect.fieldsArray);

  // Look for numeric properties
  console.log('\nProperties with numeric values:');
  for (const [key, value] of Object.entries(statusDirect)) {
    if (typeof value === 'number' && key.toUpperCase() === key) {
      console.log(`  ${key} = ${value}`);
    }
  }

  // Get User message and check its status field
  const userMessage = root.lookupType('example.User');
  const statusField = userMessage.fields.status;

  console.log('\n=== Status Field Analysis ===');
  console.log('Status field:');
  console.log('  type:', statusField.type);
  console.log('  resolvedType:', statusField.resolvedType ? statusField.resolvedType.constructor.name : 'none');

  // Try to resolve the type manually
  const manualResolution = root.nested.example.Status;
  console.log('\nManual type resolution:');
  console.log('  Found:', !!manualResolution);
  console.log('  Has valuesArray:', !!manualResolution.valuesArray);

} catch (error: any) {
  console.error('Error:', error.message);
}
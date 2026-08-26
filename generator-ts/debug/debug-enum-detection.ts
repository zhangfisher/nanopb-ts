/**
 * Debug enum detection specifically
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
  Status status = 3;
}`;

try {
  const parsed = protobuf.parse(protoContent);
  const root = parsed.root || parsed;

  console.log('=== Enum Detection Debug ===\n');

  // Get the example namespace
  const exampleNs = root.nested.example;
  console.log('Example namespace keys:', Object.keys(exampleNs));

  // Check Status specifically
  const statusItem = exampleNs.Status;
  console.log('\nStatus object:');
  console.log('  Has fieldsArray:', !!statusItem.fieldsArray);
  console.log('  Has values:', !!statusItem.values);
  console.log('  Values type:', typeof statusItem.values);
  console.log('  Values content:', statusItem.values);

  // Check if it's an object
  console.log('\nDetailed Status properties:');
  for (const [key, value] of Object.entries(statusItem)) {
    if (key.startsWith('_')) continue;
    console.log(`  ${key}:`, typeof value === 'object' ? '(object)' : value);
  }

  // Test detection logic
  console.log('\n=== Detection Logic Test ===');

  const hasFieldsArray = statusItem.fieldsArray && Array.isArray(statusItem.fieldsArray);
  const hasValues = !hasFieldsArray && statusItem.values && typeof statusItem.values === 'object' && Object.keys(statusItem.values).length > 0;

  console.log('Status detection:');
  console.log('  hasFieldsArray:', hasFieldsArray);
  console.log('  hasValues:', hasValues);
  console.log('  Would be detected as:', hasFieldsArray ? 'Message' : (hasValues ? 'Enum' : 'Unknown'));

} catch (error: any) {
  console.error('Error:', error.message);
}
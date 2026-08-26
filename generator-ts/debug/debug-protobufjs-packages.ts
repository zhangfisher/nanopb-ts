/**
 * Debug protobufjs package name handling
 */

import protobuf from 'protobufjs';

const protoContent = `
syntax = "proto3";
package vimp.restaurant;

enum BatteryStatusEnum {
    CRITICAL = 0;
    LOW      = 1;
}

message TestMessage {
    uint32 id = 1;
}`;

try {
  const parsed = protobuf.parse(protoContent);

  console.log('=== Package Name Handling Debug ===\n');
  console.log('Parsed package string:', parsed.package);
  console.log('Root has nested:', !!parsed.root?.nested);

  // Try to look up the enum
  try {
    const batteryEnum = parsed.root?.lookupEnum('vimp.restaurant.BatteryStatusEnum');
    console.log('✓ lookupEnum with full package path worked:', !!batteryEnum);
  } catch (e: any) {
    console.log('✗ lookupEnum with full package path failed:', e.message);
  }

  // Try different lookup methods
  const lookupAttempts = [
    'vimp.restaurant.BatteryStatusEnum',
    'BatteryStatusEnum',
    'vimp.BatteryStatusEnum',
    'restaurant.BatteryStatusEnum'
  ];

  for (const attempt of lookupAttempts) {
    try {
      const result = parsed.root?.lookupEnum(attempt);
      console.log(`✓ lookupEnum("${attempt}"): ${result ? 'found' : 'not found'}`);
    } catch (e: any) {
      console.log(`✗ lookupEnum("${attempt}"): ${e.message}`);
    }
  }

  // Check root structure
  console.log('\nRoot nested structure:');
  if (parsed.root?.nested) {
    for (const [key, value] of Object.entries(parsed.root.nested)) {
      console.log(`  ${key}: ${value.constructor?.name}`);
      if (value.nested) {
        console.log(`    Contains: ${Object.keys(value.nested).filter(k =>
          !k.startsWith('_') && !['options', 'parsedOptions', 'name', 'parent', 'resolved', 'comment', 'filename', 'nested', '_nestedArray'].includes(k)
        )}`);
      }
    }
  }

  // Try using lookupType for message
  try {
    const testMessage = parsed.root?.lookupType('vimp.restaurant.TestMessage');
    console.log('\n✓ lookupType for message worked:', !!testMessage);
  } catch (e: any) {
    console.log('\n✗ lookupType for message failed:', e.message);
  }

} catch (error: any) {
  console.error('Error:', error.message);
}
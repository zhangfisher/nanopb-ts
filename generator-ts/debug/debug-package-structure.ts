/**
 * Debug exact package structure access
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

  console.log('=== Package Structure Access Debug ===\n');

  const root = parsed.root || parsed;
  const packageName = parsed.package;

  // Check how our code currently accesses it
  console.log('Current code approach:');
  console.log(`root.nested["${packageName}"] exists:`, !!root.nested?.[packageName]);

  if (root.nested) {
    console.log('Root.nested keys:', Object.keys(root.nested));

    if (root.nested.vimp) {
      console.log('✓ Found vimp namespace');
      console.log('vimp constructor:', root.nested.vimp.constructor?.name);
      console.log('vimp keys:', Object.keys(root.nested.vimp));

      if (root.nested.vimp.restaurant) {
        console.log('✓ Found vimp.restaurant namespace');
        console.log('restaurant constructor:', root.nested.vimp.restaurant.constructor?.name);
        console.log('restaurant keys:', Object.keys(root.nested.vimp.restaurant));
      } else {
        console.log('✗ No vimp.restaurant found');
      }
    }
  }

  // The correct approach: split package name
  console.log('\nCorrect approach (split package name):');
  const packageParts = packageName.split('.');
  let currentNamespace = root;

  for (const part of packageParts) {
    if (currentNamespace.nested && currentNamespace.nested[part]) {
      console.log(`✓ Navigate to: ${part}`);
      currentNamespace = currentNamespace.nested[part];
    } else {
      console.log(`✗ Cannot find: ${part}`);
      break;
    }
  }

  console.log('Final namespace constructor:', currentNamespace.constructor?.name);
  console.log('Final namespace keys:', Object.keys(currentNamespace).filter(k =>
    !k.startsWith('_') && !['options', 'parsedOptions', 'name', 'parent', 'resolved', 'comment', 'filename', 'nested', '_nestedArray'].includes(k)
  ));

} catch (error: any) {
  console.error('Error:', error.message);
}
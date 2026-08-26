/**
 * Debug enum detection in caller.proto
 */

import protobuf from 'protobufjs';

const protoContent = `
syntax = "proto3";
package vimp.restaurant;

enum BatteryStatusEnum {
    CRITICAL = 0;
    LOW      = 1;
    NORMAL   = 2;
    CHARGING = 3;
}

message CallerEvent {
    uint32 code = 10;
    oneof params {
        ButtonPressParams button_press = 1;
    }
}`;

try {
  const parsed = protobuf.parse(protoContent);
  const root = parsed.root || parsed;

  console.log('=== Caller.proto Enum Detection Debug ===\n');

  const packageName = parsed.package;
  console.log('Package:', packageName);
  console.log('Root nested:', !!root.nested);
  console.log('Root nested keys:', root.nested ? Object.keys(root.nested) : 'none');

  // Handle dotted package names like "vimp.restaurant"
  let packageNested = root.nested;

  if (packageName && packageNested) {
    console.log(`\nLooking for package: ${packageName}`);

    // Split by dots and navigate nested structure
    const packageParts = packageName.split('.');

    for (const part of packageParts) {
      if (packageNested && packageNested[part]) {
        console.log(`✓ Found namespace part: ${part}`);
        packageNested = packageNested[part];
      } else {
        console.log(`✗ Missing namespace part: ${part}`);
        console.log(`Available in current level:`, Object.keys(packageNested || {}));

        // Try to see if the types are directly in this namespace
        if (packageNested && packageNested.name === part) {
          console.log(`Found direct namespace match: ${part}`);
          // This might be the actual namespace containing our types
          break;
        }

        packageNested = null;
        break;
      }
    }

    if (packageNested) {
      console.log('✓ Found complete package namespace');
      console.log('Package keys:', Object.keys(packageNested));
    } else {
      console.log('✗ Failed to navigate full package path');
      console.log('Checking if types are in first namespace part...');

      // Fallback: check if types are in the first namespace part
      const firstPart = packageParts[0];
      if (root.nested && root.nested[firstPart]) {
        packageNested = root.nested[firstPart];
        console.log(`✓ Using ${firstPart} namespace directly`);
        console.log('Available types:', Object.keys(packageNested).filter(k =>
          !k.startsWith('_') && !['options', 'parsedOptions', 'name', 'parent', 'resolved', 'comment', 'filename', 'nested', '_nestedArray'].includes(k)
        ));
      }
    }
  } else {
    console.log('✗ Failed to find package namespace');
  }

  if (packageNested) {
    for (const typeName of Object.keys(packageNested)) {
      const typeDef = packageNested[typeName];

      // Skip internal properties
      if (typeName.startsWith('_') || ['options', 'parsedOptions', 'name', 'parent',
          'resolved', 'comment', 'filename', 'nested', '_nestedArray'].includes(typeName)) {
        continue;
      }

      console.log(`\nType: ${typeName}`);
      console.log(`  Constructor: ${typeDef.constructor?.name}`);
      console.log(`  Has fieldsArray: ${!!typeDef.fieldsArray}`);
      console.log(`  Has values: ${!!typeDef.values}`);

        // Try lookup as enum
        try {
          const asEnum = root.lookupEnum(`${packageName}.${typeName}`);
          if (asEnum) {
            console.log(`  ✓ lookupEnum found: ${asEnum.name}`);
            console.log(`  Values: ${JSON.stringify(asEnum.values)}`);
          }
        } catch (e: any) {
          console.log(`  ✗ lookupEnum failed: ${e.message}`);
        }

      // Check if it's an enum by properties
      let enumValueCount = 0;
      for (const key of Object.keys(typeDef)) {
        if (key.startsWith('_') || ['options', 'parsedOptions', 'name', 'parent',
            'resolved', 'comment', 'filename', 'nested', '_nestedArray'].includes(key)) {
          continue;
        }
        if (key === key.toUpperCase() && typeof typeDef[key] === 'number' && typeDef[key] >= 0) {
          enumValueCount++;
          console.log(`    Enum value: ${key} = ${typeDef[key]}`);
        }
      }
      console.log(`  Enum-like property count: ${enumValueCount}`);
    }
  }

} catch (error: any) {
  console.error('Error:', error.message);
}
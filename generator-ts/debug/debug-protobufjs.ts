/**
 * Debug script to understand protobufjs API structure
 */

import protobuf from 'protobufjs';

const protoContent = `
syntax = "proto3";
package example;

enum Status {
  UNKNOWN = 0;
  ACTIVE = 1;
  INACTIVE = 2;
  PENDING = 3;
}

message User {
  int32 id = 1;
  string name = 2;
  string email = 3;
  Status status = 4;
  bool is_admin = 5;
}`;

console.log('=== Starting protobufjs debug ===\n');

try {
  const parsed = protobuf.parse(protoContent);

  console.log('1. Top-level parsed object keys:', Object.keys(parsed));
  console.log('   Package:', parsed.package);
  console.log('   Has root:', !!parsed.root);

  const root = parsed.root || parsed;
  console.log('\n2. Root object keys:', Object.keys(root));
  console.log('   Root package:', root.package);
  console.log('   Has nested:', !!root.nested);

  if (root.nested) {
    console.log('\n3. Root.nested keys:', Object.keys(root.nested));

    if (root.nested.example) {
      console.log('\n4. Found example package namespace');
      const exampleNs = root.nested.example;
      console.log('   example keys:', Object.keys(exampleNs));
      console.log('   example constructor.name:', exampleNs.constructor?.name);

      // Try to iterate through the package
      console.log('\n5. Iterating through example package (filtered):');

      // Filter out internal properties and only get real types/enums
      const internalKeys = ['options', 'parsedOptions', 'name', '_edition', '_defaultEdition',
                           '_features', '_featuresResolved', 'parent', 'resolved', 'comment',
                           'filename', 'nested', '_nestedArray', '_lookupCache',
                           '_needsRecursiveFeatureResolution', '_needsRecursiveResolve'];

      const typeKeys = Object.keys(exampleNs).filter(key => !internalKeys.includes(key));
      console.log('   Type keys (filtered):', typeKeys);

      for (const key of typeKeys) {
        const item = exampleNs[key];
        console.log(`   ${key}:`);
        console.log(`     Constructor: ${item.constructor?.name}`);
        console.log(`     Has fieldsArray: ${!!item.fieldsArray}`);
        console.log(`     Has valuesArray: ${!!item.valuesArray}`);
        console.log(`     Has nested: ${!!item.nested}`);

        // If it's a Type (message), show fields
        if (item.fieldsArray && item.fieldsArray.length > 0) {
          console.log(`     Fields count: ${item.fieldsArray.length}`);
          console.log(`     First field:`, {
            name: item.fieldsArray[0].name,
            id: item.fieldsArray[0].id,
            type: item.fieldsArray[0].type
          });
        }

        // If it's an Enum, show values
        if (item.valuesArray && item.valuesArray.length > 0) {
          console.log(`     Values count: ${item.valuesArray.length}`);
          console.log(`     First value:`, item.valuesArray[0]);
        }
      }
    } else {
      console.log('\n4. example package not found in root.nested');
    }
  }

  // Try using nestedArray
  if (root.nestedArray) {
    console.log('\n6. Using nestedArray:');
    console.log(`   nestedArray length: ${root.nestedArray.length}`);
    root.nestedArray.forEach((item: any, index: number) => {
      console.log(`   [${index}] ${item.name}:`);
      console.log(`     Constructor: ${item.constructor?.name}`);
    });
  }

  // Try lookup methods
  console.log('\n7. Trying lookup methods:');
  try {
    const statusEnum = root.lookupEnum('example.Status');
    console.log('   lookupEnum("example.Status"):', statusEnum ? 'found' : 'not found');
    if (statusEnum) {
      console.log('   Status values:', statusEnum.values);
    }
  } catch (e: any) {
    console.log(`   lookupEnum failed: ${e.message}`);
  }

  try {
    const userMessage = root.lookupType('example.User');
    console.log('   lookupType("example.User"):', userMessage ? 'found' : 'not found');
    if (userMessage) {
      console.log('   User fields:', userMessage.fields);
    }
  } catch (e: any) {
    console.log(`   lookupType failed: ${e.message}`);
  }

} catch (error: any) {
  console.error('Error during parsing:', error.message);
  console.error('Stack:', error.stack);
}

console.log('\n=== Debug complete ===');
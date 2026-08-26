/**
 * Working test to understand protobufjs API and extract messages/enums
 */

import { describe, it, expect } from 'bun:test';
import protobuf from 'protobufjs';

describe('protobufjs detailed investigation', () => {
  it('should understand protobufjs structure and extract types', async () => {
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
  string name = 2;
  Status status = 3;
}`;

    const parsed = protobuf.parse(protoContent);

    console.log('=== Parsed Structure ===');
    console.log('Top level keys:', Object.keys(parsed));
    console.log('Parsed package:', parsed.package);
    console.log('Parsed root:', parsed.root ? 'yes' : 'no');

    // Try to access the root
    const root = parsed.root || parsed;
    console.log('Root keys:', Object.keys(root));
    console.log('Root package:', root.package);

    // Check nested structure
    if (root.nested) {
      console.log('Root nested keys:', Object.keys(root.nested));

      // Try to access the package namespace
      if (root.nested.example) {
        console.log('Found example package!');
        console.log('Package content:', Object.keys(root.nested.example));

        // Look for Status enum
        if (root.nested.example.Status) {
          console.log('Found Status enum:', root.nested.example.Status);
          console.log('Status constructor:', root.nested.example.Status.constructor.name);
          console.log('Status values:', root.nested.example.Status.valuesArray);
        }

        // Look for User message
        if (root.nested.example.User) {
          console.log('Found User message:', root.nested.example.User);
          console.log('User constructor:', root.nested.example.User.constructor.name);
          console.log('User fields:', root.nested.example.User.fieldsArray);
        }
      }
    }

    // Try using nestedArray getter
    if (root.nestedArray) {
      console.log('Has nestedArray:', 'yes');
      console.log('NestedArray length:', root.nestedArray.length);
      root.nestedArray.forEach((nested: any, index: number) => {
        console.log(`Nested ${index}:`, nested.name, 'Type:', nested.constructor?.name);
      });
    }

    expect(parsed).toBeDefined();
  });

  it('should use lookup method correctly', async () => {
    const protoContent = `
syntax = "proto3";
package test;

message TestMessage {
  int32 id = 1;
  string name = 2;
}`;

    const parsed = protobuf.parse(protoContent);
    const root = parsed.root || parsed;

    // Try using lookup method
    try {
      const messageType = root.lookupType('TestMessage');
      console.log('Lookup result:', messageType);
      expect(messageType).toBeDefined();
    } catch (error) {
      console.log('Lookup failed:', error);
    }
  });

  it('should access fully qualified objects', async () => {
    const protoContent = `
syntax = "proto3";
package test;

enum Status {
  UNKNOWN = 0;
  ACTIVE = 1;
}

message TestMessage {
  int32 id = 1;
  Status status = 2;
}`;

    const parsed = protobuf.parse(protoContent);
    const root = parsed.root || parsed;

    console.log('=== Fully Qualified Objects ===');
    console.log('_fullyQualifiedObjects keys:', Object.keys(root._fullyQualifiedObject || {}));

    if (root._fullyQualifiedObjects) {
      const fqn = root._fullyQualifiedObject;
      console.log('Available FQNs:', Object.keys(fqn));

      // Try to access .test.Status
      if (fqn['.test.Status']) {
        console.log('Found .test.Status');
        const statusEnum = fqn['.test.Status'];
        console.log('Status enum:', statusEnum);
        console.log('Status values:', statusEnum.valuesArray);
      }

      // Try to access .test.TestMessage
      if (fqn['.test.TestMessage']) {
        console.log('Found .test.TestMessage');
        const message = fqn['.test.TestMessage'];
        console.log('TestMessage:', message);
        console.log('TestMessage fields:', message.fieldsArray);
      }
    }

    expect(parsed).toBeDefined();
  });
});
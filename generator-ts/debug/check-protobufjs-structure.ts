/**
 * 检查protobufjs如何解析嵌套消息
 */

import { createWorkingProtoParser } from '../src/proto/ProtoParserWorking.js';

async function checkStructure() {
  const parser = createWorkingProtoParser();
  const descriptor = await parser.parseFile('../generator/proto/google/protobuf/descriptor.proto', []);

  console.log('=== Top Level Message Types ===');
  descriptor.messageType.forEach(msg => {
    console.log(`  ${msg.name}`);

    if (msg.nestedType && msg.nestedType.length > 0) {
      console.log(`    Nested messages: ${msg.nestedType.map(n => n.name).join(', ')}`);
    }
  });

  console.log('\n=== Checking for duplicate message names ===');
  const allMessages = [];

  function collectMessages(msgs) {
    msgs.forEach(msg => {
      allMessages.push(msg.name);
      if (msg.nestedType) {
        collectMessages(msg.nestedType);
      }
    });
  }

  collectMessages(descriptor.messageType);

  const duplicates = allMessages.filter((item, index) => allMessages.indexOf(item) !== index);
  if (duplicates.length > 0) {
    console.log('Found duplicate message names:');
    duplicates.forEach(name => console.log(`  - ${name}`));
  } else {
    console.log('No duplicate message names found');
  }
}

checkStructure().catch(console.error);
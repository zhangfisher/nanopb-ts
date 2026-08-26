/**
 * 检查protobufjs解析器中哪些消息被认为是顶级消息
 */

import { createWorkingProtoParser } from '../src/proto/ProtoParserWorking.js';

async function checkTopLevelMessages() {
  const parser = createWorkingProtoParser();
  const descriptor = await parser.parseFile('../generator/proto/google/protobuf/descriptor.proto', []);

  console.log('=== All Top-Level Messages ===');
  descriptor.messageType.forEach(msg => {
    console.log(`${msg.name}`);
  });

  console.log('\n=== Checking if nested messages appear at top level ===');
  const problematicNames = ['Annotation', 'Declaration', 'Location', 'NamePart', 'EditionDefault', 'FeatureSupport', 'EnumReservedRange', 'ExtensionRange', 'ReservedRange', 'FeatureSetEditionDefault'];

  problematicNames.forEach(name => {
    const foundAtTop = descriptor.messageType.some(msg => msg.name === name);
    if (foundAtTop) {
      console.log(`⚠️  ${name} found as top-level message (should be nested)`);
    } else {
      console.log(`✅ ${name} correctly nested`);
    }
  });
}

checkTopLevelMessages().catch(console.error);
/**
 * 检查字段类型名称的处理过程
 */

import { createWorkingProtoParser } from '../src/proto/ProtoParserWorking.js';
import { Field } from '../src/core/Field.js';
import { NamingStyleC } from '../src/naming/NamingStyle.js';

async function checkFieldTypes() {
  const parser = createWorkingProtoParser();
  const descriptor = await parser.parseFile('../generator/proto/google/protobuf/descriptor.proto', []);

  const namingStyle = new NamingStyleC(true, 'google.protobuf');

  // 找到GeneratedCodeInfo消息
  const generatedCodeInfo = descriptor.messageType.find(msg => msg.name === 'GeneratedCodeInfo');

  if (generatedCodeInfo) {
    console.log('=== GeneratedCodeInfo Fields ===');

    for (const fieldDesc of generatedCodeInfo.field || []) {
      console.log(`\nField: ${fieldDesc.name}`);
      console.log(`  Type: ${fieldDesc.type}`);
      console.log(`  TypeName: ${fieldDesc.typeName}`);
      console.log(`  FullTypeName: ${fieldDesc.typeName || 'N/A'}`);

      const field = Field.fromDescriptor(fieldDesc, {}, namingStyle);
      console.log(`  C TypeName: ${field.getCTypeName()}`);
    }
  }

  // 找到UninterpretedOption消息
  const uninterpretedOption = descriptor.messageType.find(msg => msg.name === 'UninterpretedOption');

  if (uninterpretedOption) {
    console.log('\n=== UninterpretedOption Fields ===');

    for (const fieldDesc of uninterpretedOption.field || []) {
      if (fieldDesc.name === 'name') {
        console.log(`\nField: ${fieldDesc.name}`);
        console.log(`  Type: ${fieldDesc.type}`);
        console.log(`  TypeName: ${fieldDesc.typeName}`);

        const field = Field.fromDescriptor(fieldDesc, {}, namingStyle);
        console.log(`  C TypeName: ${field.getCTypeName()}`);
      }
    }
  }
}

checkFieldTypes().catch(console.error);
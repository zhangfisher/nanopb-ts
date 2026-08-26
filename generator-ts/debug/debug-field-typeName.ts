/**
 * 调试Field对象的typeName
 */

import { createWorkingProtoParser } from '../src/proto/ProtoParserWorking.js';
import { readFileSync } from 'fs';

async function debugFieldTypeName() {
  const parser = createWorkingProtoParser();

  const protoFile = 'examples/caller-fixed.proto';
  const protoContent = readFileSync(protoFile, 'utf-8');

  const descriptor = parser.parseContentWorking(protoContent, protoFile);

  // 找到CallerEvent消息
  const callerEventMsg = descriptor.messageType.find(msg => msg.name === 'CallerEvent');

  if (callerEventMsg) {
    console.log('=== 检查FieldDescriptor中的typeName ===');

    callerEventMsg.field.forEach(field => {
      console.log(`Field ${field.name}:`);
      console.log(`  type: ${field.type}`);
      console.log(`  typeName: ${field.typeName || 'UNDEFINED'}`);
      console.log(`  number: ${field.number}`);
      console.log('---');
    });

    // 现在创建Field对象并检查
    console.log('\n=== 检查Field对象中的getCTypeName() ===');

    const { Field } = await import('../src/core/Field.js');
    const { NamingStyleC } = await import('../src/naming/NamingStyle.js');

    const namingStyle = new NamingStyleC(true, 'vimp.restaurant');

    callerEventMsg.field.forEach(fieldDesc => {
      const field = Field.fromDescriptor(fieldDesc, {}, namingStyle);
      console.log(`Field ${fieldDesc.name}:`);
      console.log(`  getCTypeName(): ${field.getCTypeName()}`);
      console.log(`  fieldDescriptor.typeName: ${field['fieldDescriptor'].typeName || 'UNDEFINED'}`);
      console.log(`  protoType: ${field.getProtoType()}`);
      console.log('---');
    });
  }
}

debugFieldTypeName().catch(console.error);
/**
 * 调试Field对象中的注释
 */

import { createWorkingProtoParser } from '../src/proto/ProtoParserWorking.js';
import { readFileSync } from 'fs';
import { Field } from '../src/core/Field.js';
import { NamingStyleC } from '../src/naming/NamingStyle.js';

async function debugFieldComments() {
  const parser = createWorkingProtoParser();
  const namingStyle = new NamingStyleC(true, 'vimp.restaurant');

  const protoFile = 'examples/caller-fixed.proto';
  const protoContent = readFileSync(protoFile, 'utf-8');

  const descriptor = parser.parseContentWorking(protoContent, protoFile);

  // 找到ButtonPressParams消息
  const buttonParamsMsg = descriptor.messageType.find(msg => msg.name === 'ButtonPressParams');

  if (buttonParamsMsg) {
    console.log('=== 检查Field对象中的注释 ===');

    buttonParamsMsg.field.forEach(fieldDesc => {
      const field = Field.fromDescriptor(fieldDesc, {}, namingStyle);
      console.log(`Field "${fieldDesc.name}":`);
      console.log(`  fieldDescriptor.comments: ${fieldDesc.comments || '无'}`);
      console.log(`  field.comments.get('leading'): ${field.comments.get('leading') || '无'}`);
      console.log(`  field.formatComments(): "${field.formatComments()}"`);
      console.log('---');
    });
  }
}

debugFieldComments().catch(console.error);
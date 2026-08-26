/**
 * 检查字段描述符中的typeName设置
 */

import { createWorkingProtoParser } from '../src/proto/ProtoParserWorking.js';
import { readFileSync } from 'fs';

async function debugTypeName() {
  const parser = createWorkingProtoParser();

  const protoFile = 'examples/caller-fixed.proto';
  const protoContent = readFileSync(protoFile, 'utf-8');

  const descriptor = parser.parseContentWorking(protoContent, protoFile);

  // 找到CallerEvent消息
  const callerEventMsg = descriptor.messageType.find(msg => msg.name === 'CallerEvent');

  if (callerEventMsg) {
    console.log('=== 字段描述符中的typeName ===\n');

    callerEventMsg.field.forEach((fieldDesc, index) => {
      console.log(`字段 ${index}: ${fieldDesc.name}`);
      console.log(`  type: ${fieldDesc.type}`);
      console.log(`  typeName: ${fieldDesc.typeName}`);
      console.log(`  oneofName: ${fieldDesc.oneofName}`);
    });
  }
}

debugTypeName().catch(console.error);
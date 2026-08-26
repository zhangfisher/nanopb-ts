/**
 * 检查实际消息对象中的Oneof信息
 */

import { createWorkingProtoParser } from '../src/proto/ProtoParserWorking.js';
import { createWorkingNanopbGenerator } from '../src/core/NanopbGeneratorWorking.js';
import { readFileSync } from 'fs';

const protoFile = 'examples/caller-fixed.proto';
const protoContent = readFileSync(protoFile, 'utf-8');

async function debugOneofInfo() {
  const parser = createWorkingProtoParser();
  const descriptor = parser.parseContentWorking(protoContent, protoFile);

  // 找到CallerEvent消息
  const callerEventMsg = descriptor.messageType.find(msg => msg.name === 'CallerEvent');

  if (callerEventMsg) {
    console.log('=== CallerEvent消息字段信息 ===\n');
    callerEventMsg.field.forEach((field, index) => {
      console.log(`字段 ${index}: ${field.name}`);
      console.log(`  oneofName: ${field.oneofName}`);
      console.log(`  oneofIndex: ${field.oneofIndex}`);
    });
  }
}

debugOneofInfo().catch(console.error);
/**
 * 直接测试Message类的generateStruct方法
 */

import { createWorkingProtoParser } from '../src/proto/ProtoParserWorking.js';
import { readFileSync } from 'fs';

async function testGenerateStruct() {
  const parser = createWorkingProtoParser();

  const protoFile = 'examples/caller-fixed.proto';
  const protoContent = readFileSync(protoFile, 'utf-8');

  const descriptor = parser.parseContentWorking(protoContent, protoFile);

  // 找到CallerEvent消息
  const callerEventMsg = descriptor.messageType.find(msg => msg.name === 'CallerEvent');

  if (callerEventMsg) {
    console.log('=== 测试Message.generateStruct() ===\n');

    const { Message } = await import('../src/core/Message.js');
    const { NamingStyleC } = await import('../src/naming/NamingStyle.js');
    const { Field } = await import('../src/core/Field.js');

    const namingStyle = new NamingStyleC(true, 'vimp.restaurant');

    // 创建字段
    const fields = callerEventMsg.field.map(fieldDesc => {
      const field = Field.fromDescriptor(fieldDesc, {}, namingStyle);
      if (fieldDesc.oneofName) {
        field.setOneof(fieldDesc.oneofName, -1);
      }
      return field;
    });

    const message = new Message(
      'CallerEvent',
      fields,
      [],
      [],
      callerEventMsg.oneofDecl?.map(o => o.name) || [],
      callerEventMsg.oneofDecl || [],
      {},
      namingStyle
    );

    console.log('调用generateStruct():');
    const structGenerator = message.generateStruct();
    let chunk = structGenerator.next();
    while (!chunk.done) {
      process.stdout.write(chunk.value);
      chunk = structGenerator.next();
    }
  }
}

testGenerateStruct().catch(console.error);
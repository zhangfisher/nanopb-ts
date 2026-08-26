/**
 * 调试Message类的getOneofGroups方法
 */

import { createWorkingProtoParser } from '../src/proto/ProtoParserWorking.js';
import { createWorkingNanopbGenerator } from '../src/core/NanopbGeneratorWorking.js';
import { readFileSync } from 'fs';

async function debugGetOneofGroups() {
  const parser = createWorkingProtoParser();
  const generator = createWorkingNanopbGenerator();

  const protoFile = 'examples/caller-fixed.proto';
  const protoContent = readFileSync(protoFile, 'utf-8');

  const descriptor = parser.parseContentWorking(protoContent, protoFile);

  // 找到CallerEvent消息
  const callerEventMsg = descriptor.messageType.find(msg => msg.name === 'CallerEvent');

  if (callerEventMsg) {
    console.log('=== 调试getOneofGroups ===\n');

    // 创建一个模拟的Message对象
    const { Message } = await import('../src/core/Message.js');
    const { NamingStyleC } = await import('../src/naming/NamingStyle.js');
    const { Field } = await import('../src/core/Field.js');

    const namingStyle = new NamingStyleC(true, 'vimp.restaurant');

    // 创建字段
    const fields = callerEventMsg.field.map(fieldDesc => {
      const field = Field.fromDescriptor(fieldDesc, {}, namingStyle);
      if (fieldDesc.oneofName) {
        field.setOneof(fieldDesc.oneofName, -1); // 暂时设为-1
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

    console.log('字段信息:');
    fields.forEach(f => {
      console.log(`  ${f.fieldName}: isOneof=${f.isOneof()}, oneofName=${f.getOneofName()}`);
    });

    console.log('\nOneof groups:');
    const groups = message.getOneofGroups();
    console.log(JSON.stringify(groups, null, 2));

    console.log('\n检查字段:');
    const buttonPress = fields.find(f => f.fieldName === 'buttonPress');
    if (buttonPress) {
      console.log('buttonPress字段:');
      console.log(`  isOneof(): ${buttonPress.isOneof()}`);
      console.log(`  getOneofName(): ${buttonPress.getOneofName()}`);
      console.log(`  oneofName: ${buttonPress['oneofName']}`);
    }
  }
}

debugGetOneofGroups().catch(console.error);
/**
 * 检查Field类的getCTypeName()方法
 */

import { createWorkingProtoParser } from '../src/proto/ProtoParserWorking.js';
import { readFileSync } from 'fs';

async function debugGetCTypeName() {
  const parser = createWorkingProtoParser();

  const protoFile = 'examples/caller-fixed.proto';
  const protoContent = readFileSync(protoFile, 'utf-8');

  const descriptor = parser.parseContentWorking(protoContent, protoFile);

  // 找到CallerEvent消息
  const callerEventMsg = descriptor.messageType.find(msg => msg.name === 'CallerEvent');

  if (callerEventMsg) {
    console.log('=== 检查Field.getCTypeName() ===\n');

    const { Field } = await import('../src/core/Field.js');
    const { NamingStyleC } = await import('../src/naming/NamingStyle.js');

    const namingStyle = new NamingStyleC(true, 'vimp.restaurant');

    // 检查buttonPress字段
    const buttonPressDesc = callerEventMsg.field.find(f => f.name === 'buttonPress');
    if (buttonPressDesc) {
      const buttonPress = Field.fromDescriptor(buttonPressDesc, {}, namingStyle);

      console.log('buttonPress字段分析:');
      console.log(`  protoType: ${buttonPress.protoType}`);
      console.log(`  TYPE_MESSAGE值: ${11}`);
      console.log(`  fieldDescriptor.typeName: ${buttonPress.fieldDescriptor.typeName}`);
      console.log(`  dataTypeInfo.cType: ${buttonPress.dataTypeInfo?.cType}`);

      console.log('\n调用getCTypeName():');
      console.log(`  结果: ${buttonPress.getCTypeName()}`);

      console.log('\ngetCTypeName()逻辑分析:');
      console.log(`  protoType === TYPE_MESSAGE: ${buttonPress.protoType === 11}`);
      console.log(`  fieldDescriptor.typeName存在: ${!!buttonPress.fieldDescriptor.typeName}`);

      if (buttonPress.protoType === 11 && buttonPress.fieldDescriptor.typeName) {
        const messageName = buttonPress.fieldDescriptor.typeName.split('.').pop() || '';
        console.log(`  提取的messageName: ${messageName}`);
        console.log(`  namingStyle.typeName('${messageName}'): ${namingStyle.typeName(messageName)}`);
      }
    }
  }
}

debugGetCTypeName().catch(console.error);
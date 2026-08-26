/**
 * 调试嵌套枚举解析
 */

import { createWorkingProtoParser } from '../src/proto/ProtoParserWorking.js';
import { readFileSync } from 'fs';

async function debugNestedEnumsParsing() {
  const parser = createWorkingProtoParser();

  const protoFile = '../generator/proto/google/protobuf/descriptor.proto';
  const protoContent = readFileSync(protoFile, 'utf-8');

  const descriptor = parser.parseContentWorking(protoContent, protoFile);

  console.log('=== 解析的枚举数量 ===');
  console.log(`顶层枚举: ${descriptor.enumType?.length || 0}`);

  const topEnums = descriptor.enumType || [];
  topEnums.forEach((enumDef, i) => {
    console.log(`${i + 1}. ${enumDef.name} (${enumDef.value?.length || 0} 个值)`);
  });

  console.log(`\n消息数量: ${descriptor.messageType?.length || 0}`);

  // 检查每个消息的嵌套枚举
  descriptor.messageType?.forEach((msg, i) => {
    const nestedEnums = msg.enumType || [];
    const nestedMessages = msg.nestedType || [];
    console.log(`\n消息 ${i + 1}: ${msg.name}`);
    console.log(`  嵌套枚举: ${nestedEnums.length}`);
    nestedEnums.forEach((enumDef, j) => {
      console.log(`    ${j + 1}. ${msg.name}_${enumDef.name}`);
    });

    // 递归检查嵌套消息
    if (nestedMessages.length > 0) {
      console.log(`  嵌套消息: ${nestedMessages.length}`);
      nestedMessages.forEach((nestedMsg, j) => {
        const nestedMsgEnums = nestedMsg.enumType || [];
        console.log(`    ${j + 1}. ${nestedMsg.name} (${nestedMsgEnums.length} 个嵌套枚举)`);
      });
    }
  });

  // 统计总枚举数
  let totalEnums = (descriptor.enumType?.length || 0);

  function countNestedEnums(messages: any[]): number {
    let count = 0;
    messages.forEach(msg => {
      count += (msg.enumType?.length || 0);
      if (msg.nestedType) {
        count += countNestedEnums(msg.nestedType);
      }
    });
    return count;
  }

  const nestedCount = countNestedEnums(descriptor.messageType || []);
  totalEnums += nestedCount;

  console.log(`\n=== 枚举总数统计 ===`);
  console.log(`顶层枚举: ${descriptor.enumType?.length || 0}`);
  console.log(`嵌套枚举: ${nestedCount}`);
  console.log(`总计: ${totalEnums}`);
}

debugNestedEnumsParsing().catch(console.error);
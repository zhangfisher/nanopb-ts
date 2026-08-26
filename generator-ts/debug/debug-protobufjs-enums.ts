/**
 * 检查protobufjs是否正确解析嵌套枚举
 */

import protobuf from 'protobufjs';
import { readFileSync } from 'fs';

const protoFile = '../generator/proto/google/protobuf/descriptor.proto';
const protoContent = readFileSync(protoFile, 'utf-8');

const parsed = protobuf.parse(protoContent);

// 获取根命名空间
let currentNamespace = parsed.root;

console.log('=== protobufjs解析的顶层枚举 ===');
const topLevelEnums = Object.keys(currentNamespace.nested || {}).filter(key => {
  const item = currentNamespace.nested[key];
  return item && item.values && typeof item.values === 'object';
});

console.log(`找到 ${topLevelEnums.length} 个顶层枚举:`);
topLevelEnums.forEach((enumName, i) => {
  console.log(`${i + 1}. ${enumName}`);
});

console.log('\n=== protobufjs解析的消息类型 ===');
const messageTypes = Object.keys(currentNamespace.nested || {}).filter(key => {
  const item = currentNamespace.nested[key];
  return item && item.fields && typeof item.fields === 'object';
});

console.log(`找到 ${messageTypes.length} 个消息:`);
messageTypes.slice(0, 5).forEach((msgName, i) => {
  console.log(`${i + 1}. ${msgName}`);
  const msg = currentNamespace.nested[msgName];
  console.log(`   字段: ${Object.keys(msg.fields || {}).length}`);
});

// 检查FileDescriptorProto的嵌套枚举
const fileDescriptorProto = currentNamespace.nested['FileDescriptorProto'];
if (fileDescriptorProto) {
  console.log('\n=== FileDescriptorProto的嵌套内容 ===');
  console.log(`嵌套项: ${Object.keys(fileDescriptorProto.nested || {}).length}`);
  Object.keys(fileDescriptorProto.nested || {}).forEach((nestedName, i) => {
    const nested = fileDescriptorProto.nested[nestedName];
    if (nested.values) {
      console.log(`${i + 1}. 枚举: ${nestedName} (${Object.keys(nested.values).length / 2} 个值)`);
    } else if (nested.fields) {
      console.log(`${i + 1}. 消息: ${nestedName} (${Object.keys(nested.fields).length} 个字段)`);
    } else {
      console.log(`${i + 1}. 其他: ${nestedName} (${typeof nested})`);
    }
  });
}
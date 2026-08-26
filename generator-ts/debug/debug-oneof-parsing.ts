/**
 * 调试Oneof字段解析信息
 */

import protobuf from 'protobufjs';
import { readFileSync } from 'fs';

const protoFile = 'examples/caller-fixed.proto';
const protoContent = readFileSync(protoFile, 'utf-8');

const parsed = protobuf.parse(protoContent);

// 获取CallerEvent消息
let currentNamespace = parsed.root;
const packageParts = parsed.package.split('.');
for (const part of packageParts) {
  currentNamespace = currentNamespace.nested[part];
}

const callerEvent = currentNamespace.nested['CallerEvent'];

console.log('=== CallerEvent Oneof解析详情 ===\n');
console.log('Oneofs数量:', callerEvent.oneofsArray?.length);
console.log('Oneofs详情:');
callerEvent.oneofsArray?.forEach((oneof, index) => {
  console.log(`  Oneof ${index}: ${oneof.name}`);
  console.log(`    字段: ${oneof.oneof?.map(f => `${f.name}(ID:${f.id})`).join(', ')}`);
});

console.log('\n字段Oneof归属:');
callerEvent.fieldsArray?.forEach(field => {
  console.log(`${field.name} (ID:${field.id}):`);
  console.log(`  partOf: ${field.partOf}`);
  console.log(`  parent.oneofsArray包含此字段: ${
    callerEvent.oneofsArray?.some(o =>
      o.name === field.partOf && o.oneof?.some(f => f.name === field.name)
    )
  }`);

  // 检查是否能找到对应的oneof索引
  if (field.partOf) {
    const oneofIndex = callerEvent.oneofsArray?.findIndex(o => o.name === field.partOf);
    console.log(`  对应的oneof索引: ${oneofIndex}`);
  }
});

console.log('\n=== 当前解析器中的处理 ===');
// 模拟当前解析器的逻辑
const fieldDesc = callerEvent.fieldsArray?.find(f => f.name === 'buttonPress');
if (fieldDesc) {
  console.log('buttonPress字段分析:');
  console.log(`  原始字段:`, {
    name: fieldDesc.name,
    id: fieldDesc.id,
    partOf: fieldDesc.partOf,
    parent: fieldDesc.parent?.name
  });

  // 检查是否包含oneofIndex信息
  console.log(`  是否有oneofIndex: ${fieldDesc.hasOwnProperty('oneofIndex')}`);
  if (fieldDesc.hasOwnProperty('oneofIndex')) {
    console.log(`  oneofIndex值: ${fieldDesc.oneofIndex}`);
  }
}
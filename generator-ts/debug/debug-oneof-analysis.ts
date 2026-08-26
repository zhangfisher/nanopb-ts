/**
 * 调试Oneof字段处理 - 分析Python版本如何处理Oneof
 */

import protobuf from 'protobufjs';
import { readFileSync } from 'fs';

const protoFile = 'examples/caller-fixed.proto';
const protoContent = readFileSync(protoFile, 'utf-8');

console.log('=== 分析Oneof字段处理 ===\n');

const parsed = protobuf.parse(protoContent);

// 获取CallerEvent消息
let currentNamespace = parsed.root;
const packageParts = parsed.package.split('.');
for (const part of packageParts) {
  currentNamespace = currentNamespace.nested[part];
}

const callerEvent = currentNamespace.nested['CallerEvent'];
console.log('CallerEvent消息:');
console.log('Oneofs定义:', callerEvent.oneofsArray?.map(o => ({
  name: o.name,
  fields: o.oneof?.map(f => ({ name: f.name, id: f.id }))
})));

console.log('\n字段详细信息:');
callerEvent.fieldsArray?.forEach(field => {
  console.log(`字段: ${field.name}`);
  console.log('  ID:', field.id);
  console.log('  Oneof归属:', field.partOf);
  console.log('  Oneof组:', field.parent?.oneofsArray?.find(o => o.name === field.partOf));
});

console.log('\n=== Python版本Oneof处理逻辑 ===');
console.log('1. 检测到oneof字段时，生成union结构');
console.log('2. 为每个oneof组生成pb_size_t which_X变量');
console.log('3. 字段描述符使用ONEOF标签和特殊格式');
console.log('4. union包含所有oneof成员的完整结构体');

console.log('\n=== TypeScript需要实现的功能 ===');
console.log('1. Message类检测oneof字段');
console.log('2. 为每个oneof组生成union类型定义');
console.log('3. 生成which_变量声明');
console.log('4. 修改字段描述符为ONEOF格式');
console.log('5. 处理oneof字段的union路径引用');
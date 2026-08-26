/**
 * 调试protobufjs注释解析
 */

import protobuf from 'protobufjs';
import { readFileSync } from 'fs';

const protoFile = 'examples/caller-fixed.proto';
const protoContent = readFileSync(protoFile, 'utf-8');

// 尝试启用注释解析
const parsed = protobuf.parse(protoContent, {
  keepCase: false,  // 保持原始大小写
  comments: true    // 保留注释
});

// 获取CallerEvent消息
let currentNamespace = parsed.root;
const packageParts = parsed.package.split('.');
for (const part of packageParts) {
  currentNamespace = currentNamespace.nested[part];
}

const callerEvent = currentNamespace.nested['CallerEvent'];

console.log('=== 检查注释信息 ===');
console.log('CallerEvent注释:', callerEvent.comment);

callerEvent.fieldsArray?.forEach(field => {
  console.log(`\n字段 ${field.name}:`);
  console.log(`  注释: ${field.comment || '无'}`);
  console.log(`  parent.comment: ${field.parent?.comment || '无'}`);
});

console.log('\n=== 检查源文件位置 ===');
console.log('Filename:', callerEvent.filename);

// 检查是否有源代码信息
if (callerEvent.hasOwnProperty('sourceStart')) {
  console.log('Source start:', callerEvent.sourceStart);
}
if (callerEvent.hasOwnProperty('sourceEnd')) {
  console.log('Source end:', callerEvent.sourceEnd);
}
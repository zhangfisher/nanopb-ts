/**
 * 尝试不同的protobufjs解析方法
 */

import protobuf from 'protobufjs';
import { readFileSync } from 'fs';

const protoFile = '../generator/proto/google/protobuf/descriptor.proto';
const protoContent = readFileSync(protoFile, 'utf-8');

console.log('=== 尝试1: 使用protobuf.parse ===');
try {
  const parsed = protobuf.parse(protoContent);
  console.log(`解析成功，包含: ${Object.keys(parsed).length} 个顶级属性`);
  console.log('顶级属性:', Object.keys(parsed));

  if (parsed.root) {
    console.log(`\nroot包含: ${Object.keys(parsed.root).length} 个属性`);
    console.log('root属性:', Object.keys(parsed.root).slice(0, 10));

    const nestedCount = Object.keys(parsed.root.nested || {}).length;
    console.log(`\nroot.nested包含: ${nestedCount} 个项目`);

    if (nestedCount > 0) {
      console.log('前10个nested项目:');
      Object.keys(parsed.root.nested).slice(0, 10).forEach((name, i) => {
        const item = parsed.root.nested[name];
        const type = item.values ? 'Enum' : (item.fields ? 'Message' : 'Other');
        console.log(`${i + 1}. ${name} (${type})`);
      });
    }
  }
} catch (e) {
  console.log(`解析失败: ${e.message}`);
}

console.log('\n=== 尝试2: 使用protobuf.loadSync ===');
try {
  // 尝试直接加载文件
  const root = protobuf.loadSync(protoFile);
  console.log(`加载成功，包含: ${Object.keys(root).length} 个属性`);
  console.log('属性:', Object.keys(root));

  const nestedCount = Object.keys(root.nested || {}).length;
  console.log(`\nnested包含: ${nestedCount} 个项目`);

  if (nestedCount > 0) {
    console.log('前10个nested项目:');
    Object.keys(root.nested).slice(0, 10).forEach((name, i) => {
      const item = root.nested[name];
      const type = item.values ? 'Enum' : (item.fields ? 'Message' : 'Other');
      console.log(`${i + 1}. ${name} (${type})`);
    });
  }
} catch (e) {
  console.log(`加载失败: ${e.message}`);
}
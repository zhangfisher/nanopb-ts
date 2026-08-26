/**
 * 检查嵌套枚举的处理
 */

import { readFileSync } from 'fs';

const pyHeader = readFileSync('../generator/proto/google/protobuf/descriptor.pb.h', 'utf-8');
const tsHeader = readFileSync('descriptor.pb.h', 'utf-8');

console.log('=== Python版本的枚举定义 ===');
const pyEnums = pyHeader.match(/typedef enum _google_protobuf[\w_]+ \{[^}]+\}/g) || [];
pyEnums.slice(0, 5).forEach((enumDef, i) => {
  const name = enumDef.match(/typedef enum _google_protobuf([\w_]+)/);
  console.log(`${i + 1}. ${name ? name[1] : 'unknown'}`);
  const values = (enumDef.match(/[\w_]+ = \d+/g) || []).length;
  console.log(`   包含 ${values} 个值`);
});

console.log('\n=== TypeScript版本的枚举定义 ===');
const tsEnums = tsHeader.match(/typedef enum _google\.protobuf[\w.]+ \{[^}]+\}/g) || [];
tsEnums.forEach((enumDef, i) => {
  const name = enumDef.match(/typedef enum _google\.protobuf([\w.]+)/);
  console.log(`${i + 1}. ${name ? name[1] : 'unknown'}`);
  const values = (enumDef.match(/[\w.]+ = \d+/g) || []).length;
  console.log(`   包含 ${values} 个值`);
});

console.log('\n=== 检查是否有内联枚举定义 ===');
const pyInlineEnums = pyHeader.match(/\{[^}]*[\w_]+ = \d+[^}]*\}/g) || [];
console.log(`Python版本可能包含内联枚举: ${pyInlineEnums.length} 个`);
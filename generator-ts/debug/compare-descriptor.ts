/**
 * 对比TS和Python版本生成的descriptor.pb.h文件
 */

import { readFileSync } from 'fs';

const tsHeader = readFileSync('descriptor.pb.h', 'utf-8');
const pyHeader = readFileSync('../generator/proto/google/protobuf/descriptor.pb.h', 'utf-8');

console.log('=== 文件大小对比 ===');
console.log(`TypeScript版本: ${(tsHeader.length / 1024).toFixed(2)} KB`);
console.log(`Python版本: ${(pyHeader.length / 1024).toFixed(2)} KB`);

console.log('\n=== 结构体数量对比 ===');
const tsStructs = (tsHeader.match(/typedef struct/g) || []).length;
const pyStructs = (pyHeader.match(/typedef struct/g) || []).length;
console.log(`TypeScript版本: ${tsStructs} 个结构体`);
console.log(`Python版本: ${pyStructs} 个结构体`);

console.log('\n=== 枚举数量对比 ===');
const tsEnums = (tsHeader.match(/typedef enum/g) || []).length;
const pyEnums = (pyHeader.match(/typedef enum/g) || []).length;
console.log(`TypeScript版本: ${tsEnums} 个枚举`);
console.log(`Python版本: ${pyEnums} 个枚举`);

console.log('\n=== 字段描述符数量对比 ===');
const tsFieldlist = (tsHeader.match(/#define.*FIELDLIST/g) || []).length;
const pyFieldlist = (pyHeader.match(/#define.*FIELDLIST/g) || []).length;
console.log(`TypeScript版本: ${tsFieldlist} 个字段描述符`);
console.log(`Python版本: ${pyFieldlist} 个字段描述符`);

console.log('\n=== 消息定义对比 ===');
const tsMessages = (tsHeader.match(/typedef struct _google\.protobuf_\w+/g) || []);
const pyMessages = (pyHeader.match(/typedef struct _google_protobuf_\w+/g) || []);

console.log(`TypeScript消息数: ${tsMessages.length}`);
console.log(`Python消息数: ${pyMessages.length}`);

console.log('\n=== TypeScript独有的消息 ===');
const tsOnly = tsMessages.filter(msg => !pyMessages.some(py => py.replace(/_/g, '.').includes(msg.replace(/_/g, '.'))));
tsOnly.slice(0, 5).forEach(msg => console.log(`  ${msg}`));
if (tsOnly.length > 5) console.log(`  ... 还有 ${tsOnly.length - 5} 个`);

console.log('\n=== Python独有的消息 ===');
const pyOnly = pyMessages.filter(msg => !tsMessages.some(ts => msg.replace(/_/g, '.').includes(ts.replace(/_/g, '.'))));
pyOnly.slice(0, 5).forEach(msg => console.log(`  ${msg}`));
if (pyOnly.length > 5) console.log(`  ... 还有 ${pyOnly.length - 5} 个`);

console.log('\n=== 字段类型对比 ===');
const tsCallbacks = (tsHeader.match(/pb_callback_t/g) || []).length;
const pyCallbacks = (pyHeader.match(/pb_callback_t/g) || []).length;
console.log(`TypeScript回调字段: ${tsCallbacks}`);
console.log(`Python回调字段: ${pyCallbacks}`);

const tsPointers = (tsHeader.match(/\w+\s*\*\s*\w+/g) || []).length;
const pyPointers = (pyHeader.match(/\w+\s*\*\s*\w+/g) || []).length;
console.log(`TypeScript指针字段: ${tsPointers}`);
console.log(`Python指针字段: ${pyPointers}`);

console.log('\n=== 注释对比 ===');
const tsComments = (tsHeader.match(/\/\*.*?\*\//g) || []).length;
const pyComments = (pyHeader.match(/\/\*.*?\*\//g) || []).length;
console.log(`TypeScript注释块: ${tsComments}`);
console.log(`Python注释块: ${pyComments}`);
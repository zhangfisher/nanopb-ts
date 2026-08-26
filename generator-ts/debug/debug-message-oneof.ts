/**
 * 调试Message类中的Oneof处理
 */

import { Message } from '../src/core/Message.js';
import { Field } from '../src/core/Field.js';
import { NamingStyleC } from '../src/naming/NamingStyle.js';
import { Globals } from '../src/core/Globals.js';

// 模拟一些oneof字段
const namingStyle = new NamingStyleC(true, 'vimp.restaurant');

// 创建测试字段
const buttonPressField = new Field(
  'buttonPress',
  1,
  11, // MESSAGE
  0, // OPTIONAL
  {},
  namingStyle
);
buttonPressField.setOneof('params', 2); // params oneof, index 2

const deviceStatusField = new Field(
  'deviceStatus',
  2,
  11, // MESSAGE
  0, // OPTIONAL
  {},
  namingStyle
);
deviceStatusField.setOneof('params', 2); // params oneof, index 2

const codeField = new Field(
  'code',
  10,
  5, // UINT32
  0, // OPTIONAL
  {},
  namingStyle
);

const testMessage = new Message(
  'CallerEvent',
  [buttonPressField, deviceStatusField, codeField],
  [],
  [],
  ['params'],
  {},
  namingStyle
);

console.log('=== 测试Message类Oneof处理 ===\n');

console.log('Oneof groups:', testMessage.getOneofGroups());
console.log('Is buttonPress oneof?', buttonPressField.isOneof());
console.log('Is deviceStatus oneof?', deviceStatusField.isOneof());
console.log('Is code oneof?', codeField.isOneof());

console.log('\n=== 生成结构体 ===');
const structGenerator = testMessage.generateStruct();
let chunk = structGenerator.next();
while (!chunk.done) {
  console.log(chunk.value);
  chunk = structGenerator.next();
}

console.log('\n=== 检查字段描述符 ===');
console.log('buttonPress fieldlist():', buttonPressField.fieldlist());
console.log('deviceStatus fieldlist():', deviceStatusField.fieldlist());
console.log('code fieldlist():', codeField.fieldlist());
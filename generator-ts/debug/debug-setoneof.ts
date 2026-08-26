/**
 * 调试setOneof方法
 */

import { Field } from '../src/core/Field.js';
import { NamingStyleC } from '../src/naming/NamingStyle.js';
import { ProtoFieldType, FieldRule } from '../src/types/protobuf-types.js';

function testSetOneof() {
  const namingStyle = new NamingStyleC(true, 'vimp.restaurant');

  // 创建一个字段
  const field = new Field(
    'buttonPress',
    1,
    ProtoFieldType.TYPE_MESSAGE,
    FieldRule.OPTIONAL,
    {},
    namingStyle
  );

  console.log('Before setOneof:');
  console.log('  isOneof:', field.isOneof());
  console.log('  getOneofName:', field.getOneofName());
  console.log('  getRuleString:', field['getRuleString']());

  // 调用setOneof
  field.setOneof('params', 0);

  console.log('\nAfter setOneof:');
  console.log('  isOneof:', field.isOneof());
  console.log('  getOneofName:', field.getOneofName());
  console.log('  getRuleString:', field['getRuleString']());
  console.log('  fieldRule:', (field as any).fieldRule);
}

testSetOneof();
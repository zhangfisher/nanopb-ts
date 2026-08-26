/**
 * 调试字段解析和标签映射问题
 */

import protobuf from 'protobufjs';
import { readFileSync } from 'fs';

const protoFile = 'examples/caller-fixed.proto';
const protoContent = readFileSync(protoFile, 'utf-8');

console.log('=== 解析Proto文件 ===');
const parsed = protobuf.parse(protoContent);
console.log('包名:', parsed.package);
console.log('Root nested keys:', Object.keys(parsed.root.nested || {}));

// 获取包命名空间
const packageNested = parsed.root.nested[parsed.package] || parsed.root.nested['vimp']?.nested['restaurant'];
console.log('\n包命名空间:', packageNested ? '找到' : '未找到');

// 逐级导航
let currentNamespace = parsed.root;
const packageParts = parsed.package.split('.');
console.log('包名部分:', packageParts);

for (const part of packageParts) {
  if (currentNamespace.nested && currentNamespace.nested[part]) {
    console.log(`找到命名空间部分: ${part}`);
    currentNamespace = currentNamespace.nested[part];
  } else {
    console.log(`未找到命名空间部分: ${part}`);
    break;
  }
}

// 检查ButtonPressParams消息
console.log('\n=== ButtonPressParams消息 ===');
const buttonPressParams = currentNamespace.nested['ButtonPressParams'];
if (buttonPressParams) {
  console.log('消息名称:', buttonPressParams.name);
  console.log('字段数组长度:', buttonPressParams.fieldsArray?.length);

  if (buttonPressParams.fieldsArray) {
    for (const field of buttonPressParams.fieldsArray) {
      console.log(`\n字段: ${field.name}`);
      console.log('  ID:', field.id);
      console.log('  类型:', field.type);
      console.log('  规则 (rule):', field.rule);
      console.log('  规则类型:', typeof field.rule);
      console.log('  Oneof:', field.partOf);
      console.log('  默认值:', field.defaultValue);

      // 测试字段标签映射
      let fieldRuleLabel = 0; // OPTIONAL
      if (field.rule === 'required') {
        fieldRuleLabel = 1;
      } else if (field.rule === 'repeated') {
        fieldRuleLabel = 2;
      } else if (!field.rule) {
        // proto3没有显式规则的情况
        fieldRuleLabel = 0; // 在nanopb中应该是SINGULAR
      }

      console.log('  映射后的字段标签:', fieldRuleLabel, '(0=OPTIONAL/SINGULAR, 1=REQUIRED, 2=REPEATED)');
    }
  }
} else {
  console.log('未找到ButtonPressParams消息');
}

console.log('\n=== 检查CallerEvent消息的oneof字段 ===');
const callerEvent = currentNamespace.nested['CallerEvent'];
if (callerEvent && callerEvent.fieldsArray) {
  for (const field of callerEvent.fieldsArray) {
    console.log(`字段: ${field.name}, ID: ${field.id}, 规则: ${field.rule}, Oneof: ${field.partOf}`);
  }

  console.log('\nOneof定义:');
  console.log('Oneofs数组:', callerEvent.oneofsArray?.map(o => o.name));
}

console.log('\n=== 检查枚举 ===');
const batteryEnum = currentNamespace.nested['BatteryStatusEnum'];
if (batteryEnum) {
  console.log('枚举名称:', batteryEnum.name);
  console.log('枚举值:', batteryEnum.values);
}

console.log('\n=== 检查protobufjs字段规则 ===');
console.log('proto3语法字段通常没有rule属性，或者rule为空字符串');
console.log('proto2语法字段有明确的required/optional/repeated规则');

/**
 * 深入检查google命名空间的内容
 */

import protobuf from 'protobufjs';
import { readFileSync } from 'fs';

const protoFile = '../generator/proto/google/protobuf/descriptor.proto';
const protoContent = readFileSync(protoFile, 'utf-8');

const parsed = protobuf.parse(protoContent);
const googleNamespace = parsed.root.nested['google'];

console.log('=== google命名空间分析 ===');
console.log(`google类型: ${googleNamespace ? typeof googleNamespace : 'undefined'}`);
console.log(`google属性: ${googleNamespace ? Object.keys(googleNamespace).length : 0} 个`);

if (googleNamespace && googleNamespace.nested) {
  console.log(`\ngoogle.nested包含: ${Object.keys(googleNamespace.nested).length} 个项目`);
  const items = Object.keys(googleNamespace.nested);

  console.log('\n=== 所有nested项目 ===');
  items.forEach((itemName, i) => {
    const item = googleNamespace.nested[itemName];
    let type = 'Unknown';

    if (item.values && typeof item.values === 'object') {
      const valueKeys = Object.keys(item.values).filter(k => !/^\d+$/.test(k));
      type = `Enum (${valueKeys.length} 个值)`;
    } else if (item.fields && typeof item.fields === 'object') {
      type = `Message (${Object.keys(item.fields).length} 个字段)`;
    } else if (item.nested && typeof item.nested === 'object') {
      type = `Namespace (${Object.keys(item.nested).length} 个嵌套项)`;
    }

    console.log(`${i + 1}. ${itemName} - ${type}`);

    // 对于namespace，递归显示其内容
    if (item.nested && typeof item.nested === 'object' && Object.keys(item.nested).length > 0 && Object.keys(item.nested).length < 20) {
      Object.keys(item.nested).forEach((nestedName, j) => {
        const nestedItem = item.nested[nestedName];
        let nestedType = 'Unknown';

        if (nestedItem.values) {
          const valueKeys = Object.keys(nestedItem.values).filter(k => !/^\d+$/.test(k));
          nestedType = `Enum (${valueKeys.length} 个值)`;
        } else if (nestedItem.fields) {
          nestedType = `Message (${Object.keys(nestedItem.fields).length} 个字段)`;
        }

        console.log(`   ${j + 1}. ${nestedName} - ${nestedType}`);
      });
    }
  });

  // 统计总枚举数
  let totalEnums = 0;
  let totalMessages = 0;

  function countTypes(namespace, level = 0) {
    if (!namespace || !namespace.nested) return { enums: 0, messages: 0 };

    let enums = 0;
    let messages = 0;

    Object.values(namespace.nested).forEach(item => {
      if (item.values) {
        enums++;
      } else if (item.fields) {
        messages++;
        // 递归检查消息中的嵌套枚举
        if (item.nested) {
          const nested = countTypes({ nested: item.nested }, level + 1);
          enums += nested.enums;
          messages += nested.messages;
        }
      } else if (item.nested) {
        const nested = countTypes(item, level + 1);
        enums += nested.enums;
        messages += nested.messages;
      }
    });

    return { enums, messages };
  }

  const totals = countTypes(googleNamespace);
  console.log(`\n=== 类型总计 ===`);
  console.log(`枚举总数: ${totals.enums}`);
  console.log(`消息总数: ${totals.messages}`);
}
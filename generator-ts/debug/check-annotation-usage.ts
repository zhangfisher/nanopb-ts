/**
 * 检查哪些字段使用了Annotation类型
 */

import { createWorkingProtoParser } from '../src/proto/ProtoParserWorking.js';
import { Field } from '../src/core/Field.js';
import { NamingStyleC } from '../src/naming/NamingStyle.js';

async function checkAnnotationUsage() {
  const parser = createWorkingProtoParser();
  const descriptor = await parser.parseFile('../generator/proto/google/protobuf/descriptor.proto', []);

  const namingStyle = new NamingStyleC(true, 'google.protobuf');

  console.log('=== Fields using Annotation type ===');

  function searchFields(msgDesc, parentPath = '') {
    const qualifiedParentName = parentPath ? `${parentPath}_${msgDesc.name}` : msgDesc.name;

    for (const fieldDesc of msgDesc.field || []) {
      if (fieldDesc.typeName && fieldDesc.typeName.includes('Annotation')) {
        console.log(`\nMessage: ${qualifiedParentName}`);
        console.log(`  Field: ${fieldDesc.name}`);
        console.log(`  TypeName: ${fieldDesc.typeName}`);

        const field = Field.fromDescriptor(fieldDesc, {}, namingStyle);
        field.setParentMessageName(qualifiedParentName);
        console.log(`  C TypeName: ${field.getCTypeName()}`);
      }
    }

    // Check nested messages
    for (const nestedMsg of msgDesc.nestedType || []) {
      searchFields(nestedMsg, qualifiedParentName);
    }
  }

  for (const msgDesc of descriptor.messageType || []) {
    searchFields(msgDesc);
  }
}

checkAnnotationUsage().catch(console.error);
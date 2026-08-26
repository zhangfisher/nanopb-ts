/**
 * 检查messages数组的实际内容
 */

import { createWorkingNanopbGenerator } from '../src/core/NanopbGeneratorWorking.js';
import { readFileSync } from 'fs';

async function checkMessagesArray() {
  // 修改生成器来检查messages数组
  const { NanopbGeneratorWorking } = await import('../src/core/NanopbGeneratorWorking.js');
  const { ProtoParserWorking } = await import('../src/proto/ProtoParserWorking.js');
  const { NamingStyleC } = await import('../src/naming/NamingStyle.js');
  const { Globals } = await import('../src/core/Globals.js');

  const parser = new ProtoParserWorking();
  const descriptor = await parser.parseFile('../generator/proto/google/protobuf/descriptor.proto', []);

  const globals = Globals.getInstance();
  globals.setPackageName(descriptor.package);

  const namingStyle = new NamingStyleC(true, descriptor.package);

  // 手动提取消息来查看数组内容
  const messages = [];
  const processedKeys = new Set();

  function extractMessages(msgDesc, parentPath = '') {
    const qualifiedName = parentPath ? `${parentPath}_${msgDesc.name}` : msgDesc.name;

    if (processedKeys.has(qualifiedName)) {
      console.log(`🔄 SKIP DUPLICATE: ${qualifiedName}`);
      return;
    }
    processedKeys.add(qualifiedName);

    console.log(`✅ ADD MESSAGE: ${qualifiedName}`);
    messages.push({ name: qualifiedName, originalName: msgDesc.name });

    const nestedMessages = msgDesc.nestedType || [];
    for (const nestedMsg of nestedMessages) {
      extractMessages(nestedMsg, qualifiedName);
    }
  }

  for (const msgDesc of descriptor.messageType || []) {
    extractMessages(msgDesc);
  }

  console.log(`\n=== MESSAGES ARRAY (${messages.length} items) ===`);
  messages.forEach(msg => console.log(`  ${msg.name} (original: ${msg.originalName})`));

  console.log('\n=== Checking for Annotation duplicates ===');
  const annotations = messages.filter(m => m.name.includes('Annotation'));
  console.log(`Found ${annotations.length} Annotation-related messages:`);
  annotations.forEach(m => console.log(`  - ${m.name}`));
}

checkMessagesArray().catch(console.error);
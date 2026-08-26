/**
 * 检查消息提取过程中的具体名称
 */

import { createWorkingNanopbGenerator } from '../src/core/NanopbGeneratorWorking.js';

async function checkMessageNames() {
  const generator = createWorkingNanopbGenerator();

  // 重写generate方法来查看消息提取过程
  const { ProtoParserWorking } = await import('../src/proto/ProtoParserWorking.js');
  const { NamingStyleC } = await import('../src/naming/NamingStyle.js');
  const { Globals } = await import('../src/core/Globals.js');

  const parser = new ProtoParserWorking();
  const descriptor = await parser.parseFile('../generator/proto/google/protobuf/descriptor.proto', []);

  const globals = Globals.getInstance();
  globals.setPackageName(descriptor.package);

  const namingStyle = new NamingStyleC(true, descriptor.package);

  // 手动提取消息并显示名称
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
    messages.push(qualifiedName);

    const nestedMessages = msgDesc.nestedType || [];
    for (const nestedMsg of nestedMessages) {
      extractMessages(nestedMsg, qualifiedName);
    }
  }

  for (const msgDesc of descriptor.messageType || []) {
    extractMessages(msgDesc);
  }

  console.log('\n=== FINAL MESSAGE LIST ===');
  messages.sort().forEach(name => console.log(name));

  console.log(`\nTotal: ${messages.length} messages`);
}

checkMessageNames().catch(console.error);
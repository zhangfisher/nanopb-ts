/**
 * 调试注释与字段名匹配
 */

import { createWorkingProtoParser } from '../src/proto/ProtoParserWorking.js';
import { parseProtoComments } from '../src/utils/CommentParser.js';
import { readFileSync } from 'fs';

async function debugCommentMatching() {
  const protoFile = 'examples/caller-fixed.proto';
  const protoContent = readFileSync(protoFile, 'utf-8');

  // 解析注释
  const parsedComments = parseProtoComments(protoContent);

  console.log('=== 所有解析的注释 ===');
  parsedComments.comments.forEach((comment, key) => {
    console.log(`"${key}": ${comment.trailing || comment.leading}`);
  });

  const parser = createWorkingProtoParser();
  const descriptor = parser.parseContentWorking(protoContent, protoFile);

  // 找到ButtonPressParams消息
  const buttonParamsMsg = descriptor.messageType.find(msg => msg.name === 'ButtonPressParams');

  if (buttonParamsMsg) {
    console.log('\n=== ButtonPressParams字段和注释匹配 ===');

    buttonParamsMsg.field.forEach(field => {
      console.log(`Field "${field.name}":`);
      console.log(`  number: ${field.number}`);
      console.log(`  comments: ${field.comments || '无注释'}`);
      console.log(`  尝试查找: "${field.name}" -> ${parsedComments.comments.get(field.name)?.trailing || '未找到'}`);
      console.log('---');
    });
  }
}

debugCommentMatching().catch(console.error);
/**
 * 测试注释解析器
 */

import { readFileSync } from 'fs';
import { parseProtoComments, getCommentForElement, formatCommentForC } from '../src/utils/CommentParser.js';

const protoContent = readFileSync('examples/caller-fixed.proto', 'utf-8');

const parsed = parseProtoComments(protoContent);

console.log('=== 解析到的注释 ===');
parsed.comments.forEach((commentInfo, elementName) => {
  console.log(`\n元素: ${elementName}`);
  console.log(`  行号: ${commentInfo.line}`);
  console.log(`  注释: ${commentInfo.leading}`);
  console.log(`  格式化C注释: ${formatCommentForC(commentInfo)}`);
});

console.log('\n=== 测试特定元素 ===');
const testElements = ['code', 'level', 'message', 'button_press', 'key_id', 'function_name'];
testElements.forEach(elementName => {
  const comment = getCommentForElement(parsed, elementName);
  console.log(`${elementName}: ${comment ? formatCommentForC(comment) : '无注释'}`);
});
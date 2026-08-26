/**
 * 测试命名转换的具体过程
 */

import { NamingStyleC } from '../src/naming/NamingStyle.js';

const naming = new NamingStyleC(true, 'google.protobuf');

console.log('Testing typeName conversions:');
console.log('DescriptorProto ->', naming.typeName('DescriptorProto'));
console.log('FileOptions ->', naming.typeName('FileOptions'));
console.log('GeneratedCodeInfo ->', naming.typeName('GeneratedCodeInfo'));
console.log('GeneratedCodeInfo_Annotation ->', naming.typeName('GeneratedCodeInfo_Annotation'));
console.log('Annotation ->', naming.typeName('Annotation'));
console.log('Declaration ->', naming.typeName('Declaration'));

console.log('\n\nTesting intermediate steps:');
// Test the splitting logic
const testNames = ['DescriptorProto', 'FileOptions', 'GeneratedCodeInfo_Annotation'];
for (const name of testNames) {
  if (name.includes('_')) {
    const parts = name.split('_');
    console.log(`\n${name}:`);
    for (const part of parts) {
      const isLower = part === part.toLowerCase();
      const converted = isLower
        ? part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
        : part;
      console.log(`  Part: ${part} (all lowercase: ${isLower}) -> ${converted}`);
    }
  }
}
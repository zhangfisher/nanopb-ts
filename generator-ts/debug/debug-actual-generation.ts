/**
 * 调试实际生成过程中的Message对象
 */

import { createWorkingNanopbGenerator } from '../src/core/NanopbGeneratorWorking.js';

async function debugActualGeneration() {
  const generator = createWorkingNanopbGenerator();

  // 修改生成过程，添加调试信息
  const result = await generator.generate('../generator/proto/google/protobuf/descriptor.proto', {
    outputDir: '.'
  });

  console.log('\n=== 实际生成结果 ===');
  console.log(result);
}

debugActualGeneration().catch(console.error);
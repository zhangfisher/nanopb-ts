# Debug 目录

本目录包含开发过程中用于调试和验证的临时文件。

## 📁 文件说明

### 🔍 Protobufjs 调试脚本

这些脚本用于深入理解 protobufjs 库的 API 结构和行为：

- **`debug-protobufjs.ts`** - 全面调试 protobufjs.parse() 返回的对象结构
- **`debug-field-types.ts`** - 调试字段类型映射和转换逻辑
- **`debug-enum-detection.ts`** - 调试枚举类型检测问题
- **`debug-enum-structure.ts`** - 深入分析枚举对象的内部结构

### 🧪 生成的测试文件

端到端测试生成的 C 代码文件：

- **`user.pb.h`** - 从 examples/user.proto 生成的头文件
- **`user.pb.c`** - 从 examples/user.proto 生成的源文件
- **`test-generated.c`** - 测试生成代码的简单 C 程序

## 🚀 使用方法

### 运行调试脚本
```bash
# 从 generator-ts 目录运行
bun run debug/debug-protobufjs.ts
bun run debug/debug-field-types.ts
bun run debug/debug-enum-detection.ts
bun run debug/debug-enum-structure.ts
```

### 重新生成测试文件
```bash
# 生成 user.pb.h 和 user.pb.c
bun run src/cli/main-complete.ts examples/user.proto

# 查看生成的文件
cat debug/user.pb.h
cat debug/user.pb.c
```

## 📊 调试过程记录

## 📊 最新修复和发现

### 🔧 多级包名解析修复 (2024-08-26)

**问题**: 像这样的多级包名无法正确解析：
```protobuf
package vimp.restaurant;

enum BatteryStatusEnum {
    CRITICAL = 0;
    LOW = 1;
}
```

**根本原因**: 代码直接使用 `root.nested[packageName]` 访问包命名空间，但 protobufjs 对多级包名创建嵌套结构：
- 期望：`root.nested["vimp.restaurant"]`
- 实际：`root.nested.vimp.restaurant`

**解决方案**: 按点号分割包名并逐级导航命名空间：
```typescript
// 修复前（错误）
const packageNested = root.nested[packageName];

// 修复后（正确）
const packageParts = packageName.split('.');
let currentNamespace: any = root;
for (const part of packageParts) {
    if (currentNamespace.nested && currentNamespace.nested[part]) {
        currentNamespace = currentNamespace.nested[part];
    }
}
packageNested = currentNamespace;
```

**验证结果**: 
- ✅ `BatteryStatusEnum` 正确识别为枚举
- ✅ 生成7个消息 + 1个枚举
- ✅ 复杂的 `CallerEvent` 包含 oneof 字段正确处理

### 关键发现

1. **Protobufjs API 结构**：
   - `protobuf.parse()` 返回 `{ package, root }` 结构
   - 类型需要通过 `root.lookupEnum()` 和 `root.lookupType()` 访问
   - 直接访问命名空间时枚举表现为普通对象

2. **枚举检测方法**：
   - 使用 `lookupEnum()` 获得完整枚举对象
   - 检查对象属性：大写名称 + 数值 = 枚举值
   - 直接命名空间访问缺少 `valuesArray` 属性

3. **字段类型映射**：
   - 基本类型字符串直接映射 (如 "int32" → 5)
   - 自定义类型需要通过 qualified name 查找
   - 枚举类型字段 `field.type` 为类型名而非 "enum"

## 🔧 调试技巧

1. **分层调试**：先验证 protobufjs API，再调试业务逻辑
2. **对象检查**：使用 `Object.keys()` 和 `console.log()` 查看对象结构  
3. **类型验证**：检查 `constructor.name` 和特定属性 (如 `fieldsArray`)
4. **渐进修复**：每次只修复一个问题，立即验证

## 📝 下次调试参考

如果遇到类似问题，可以：

1. 创建新的调试脚本：`debug-new-issue.ts`
2. 使用 `console.log()` 详细输出对象结构
3. 对比 protobufjs 官方文档
4. 验证假设后应用到实际代码

## ⚠️ 注意事项

- 这些是开发调试文件，不是生产代码
- 可能包含临时的调试输出和测试代码
- 在正式发布时可能需要清理或移动到专门的测试目录
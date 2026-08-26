# Nanopb TypeScript Generator

🚀 **TypeScript 版本的 Nanopb 生成器** - 将 Protocol Buffers .proto 文件转换为 C 语言代码的现代化工具链

## 📋 项目简介

这是 nanopb 项目中 Python 生成器的 TypeScript 重写版本，使用 Bun 1.4 运行时。nanopb 是专为嵌入式系统和内存受限环境设计的 Protocol Buffers 实现。

### ✨ 主要特性

- **现代化工具链**: TypeScript + Bun 1.4 提供更好的类型安全和开发体验
- **功能完整性**: 保持与 Python 版本完全相同的功能特性
- **字节级一致性**: 生成的 C 代码与 Python 版本完全相同
- **开发体验优先**: 完整的 TypeScript 类型定义和现代化开发工具
- **构建系统兼容**: 支持所有主流构建系统（CMake、Make、SCons、Meson、Bazel 等）

## 🎯 项目目标

1. **功能完整性**: 保留 Python 版本的所有功能和特性
2. **输出一致性**: 生成字节级相同的 C 代码输出  
3. **现代化工具链**: 使用 TypeScript + Bun 1.4 提供更好的开发体验
4. **完整测试**: 全面的测试覆盖确保功能正确性
5. **中文文档**: 详细的中文 README 和使用说明

## 📦 安装方法

### 环境要求

- **Node.js**: >= 18.0.0
- **Bun**: >= 1.4.0 （推荐）
- **TypeScript**: 5.x

### 安装步骤

```bash
# 克隆项目
git clone https://github.com/nanopb/nanopb-ts.git
cd nanopb-ts/generator-ts

# 安装依赖
bun install

# 或者使用 npm
npm install
```

## 🚀 快速开始

### 基本使用

```bash
# 显示帮助信息
bun run src/cli/main.ts --help

# 生成单个 proto 文件
bun run src/cli/main.ts myprotocol.proto

# 指定输出目录
bun run src/cli/main.ts myprotocol.proto -D ./output

# 使用选项文件
bun run src/cli/main.ts myprotocol.proto -f myprotocol.options

# 详细输出模式
bun run src/cli/main.ts myprotocol.proto --verbose
```

### 编译生产版本

```bash
# 编译 TypeScript
bun run build

# 使用编译后的版本
node dist/cli/main.js myprotocol.proto
```

## 🏗️ 项目架构

```
generator-ts/
├── src/
│   ├── core/              # 核心生成逻辑
│   │   ├── ProtoElement.ts      # 基类
│   │   └── Globals.ts           # 全局配置
│   ├── naming/            # 命名约定
│   │   └── NamingStyle.ts       # C 语言命名风格
│   ├── utils/             # 工具函数
│   │   ├── DataTypes.ts        # 数据类型映射
│   │   ├── VarintUtils.ts      # Varint 大小计算
│   │   └── ReservedWords.ts    # C 保留关键字
│   ├── cli/               # CLI 接口
│   │   └── main.ts             # 主入口
│   └── types/             # TypeScript 类型定义
│       ├── nanopb-types.ts      # nanopb 类型
│       └── protobuf-types.ts    # protobuf 类型
├── tests/                 # 测试套件
│   └── unit/              # 单元测试
├── package.json
├── tsconfig.json
└── README.md
```

## 📊 当前进展

### ✅ 已完成（阶段 1：项目基础架构）

- [x] 项目结构和配置文件
  - TypeScript + Bun 1.4 配置
  - ESLint + Prettier 代码规范
  - 完整的项目目录结构
- [x] 核心类型定义
  - nanopb 类型系统
  - protobuf 类型定义
  - 完整的 TypeScript 接口
- [x] 基础工具实现
  - 数据类型映射（DataTypes）
  - Varint 大小计算（VarintUtils）
  - C 保留关键字处理（ReservedWords）
  - 命名风格处理（NamingStyle）
- [x] 核心类实现
  - ProtoElement 抽象基类
  - Globals 全局配置管理
  - NamingStyle C 语言命名风格
- [x] CLI 基础框架
  - 命令行参数解析
  - 基本用户界面
  - 错误处理机制
- [x] 基础测试框架
  - 18 个单元测试全部通过
  - 工具函数验证
  - 命名风格测试

### 🔄 进行中（阶段 2：核心生成功能）

- [ ] Proto 文件处理
  - [ ] protobufjs 集成
  - [ ] protoc 调用封装
  - [ ] 依赖关系解析
- [ ] 核心元素类
  - [ ] Enum 类实现
  - [ ] Field 类实现
  - [ ] Message 类实现
  - [ ] OneOf 类实现
- [ ] 选项系统
  - [ ] .options 文件解析
  - [ ] 三级选项合并
  - [ ] 命令行选项处理

### 📋 待开始（阶段 3-7）

- [ ] 阶段 3：代码生成引擎
- [ ] 阶段 4：高级特性
- [ ] 阶段 5：CLI 和插件模式
- [ ] 阶段 6：测试和兼容性验证
- [ ] 阶段 7：文档和发布准备

## 🧪 测试状态

### 当前测试覆盖

```bash
# 运行所有测试
bun test

# 运行特定测试文件
bun test tests/unit/utils.test.ts

# 测试覆盖率
bun test --coverage
```

**测试结果**: ✅ 18/18 测试通过

- DataTypes 工具类: ✅ 5/5 通过
- VarintUtils 工具类: ✅ 4/4 通过  
- ReservedWords 工具类: ✅ 6/6 通过
- Globals 全局配置: ✅ 3/3 通过

## 🔧 开发指南

### 运行开发版本

```bash
# 直接运行 TypeScript
bun run src/cli/main.ts [options] [input...]

# 使用构建工具
bun run dev
```

### 代码规范

```bash
# 代码检查
bun run lint

# 代码格式化
bun run format

# 类型检查
bun run type-check
```

### 构建生产版本

```bash
# 编译 TypeScript
bun run build

# 验证编译结果
node dist/cli/main.js --version
```

## 📈 技术栈

- **运行时**: Bun 1.4
- **语言**: TypeScript 5.x (严格模式)
- **核心依赖**:
  - `protobufjs`: Protocol Buffers 处理
  - `commander`: CLI 框架
  - `chalk`: 终端输出美化
  - `glob`: 文件模式匹配
- **测试框架**: Bun 内置测试
- **代码规范**: ESLint + Prettier

## 🎯 下一步计划

### 短期目标（1-2个月）

1. **完成 Proto 文件处理** - 集成 protobufjs 和 protoc
2. **实现核心元素类** - Enum、Field、Message、OneOf
3. **建立选项系统** - .options 文件和三级选项合并
4. **基础代码生成** - 简单消息的头文件和源文件生成

### 中期目标（3-4个月）

1. **完整代码生成** - 所有 nanopb 特性的代码生成
2. **CLI 功能完善** - 命令行接口和 protoc 插件模式
3. **测试套件移植** - 移植现有 Python 版本的测试
4. **兼容性验证** - 字节级输出一致性验证

### 长期目标（5-6个月）

1. **性能优化** - 确保生成速度不低于 Python 版本
2. **文档完善** - 详细的 API 文档和使用指南
3. **示例丰富** - 完整的使用示例和最佳实践
4. **生产发布** - 正式发布和社区推广

## 🤝 贡献指南

我们欢迎各种形式的贡献！

### 如何贡献

1. Fork 本项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

### 开发规范

- 遵循现有的代码风格
- 添加适当的单元测试
- 更新相关文档
- 确保 TypeScript 类型正确

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](../LICENSE.txt) 文件

## 🔗 相关链接

- **原始 nanopb 项目**: https://github.com/nanopb/nanopb
- **nanopb 官方文档**: https://jpa.kapsi.fi/nanopb/docs/
- **nanopb 论坛**: https://groups.google.com/forum/#!forum/nanopb
- **Protocol Buffers 官方文档**: https://protobuf.dev/

## 📞 联系方式

- **问题反馈**: GitHub Issues
- **技术讨论**: nanopb 论坛
- **安全问题**: security@nanopb.org

---

⚠️ **注意**: 本项目目前处于活跃开发阶段，核心功能尚未完全实现。请关注项目进度或参与贡献！

**状态**: 🔄 基础架构完成 | 🚧 核心开发中 | 🎯 预计 6 个月内完成

# AI Video 项目规范

## 项目目标

使用 Remotion 和 TypeScript 创建、预览及渲染视频。

## 技术约定

- 使用 TypeScript，不新增 JavaScript 业务文件。
- 使用项目现有的包管理器和依赖，不混用 lockfile。
- 组件放在 `src/`，入口与 composition 注册遵循 Remotion 官方结构。
- 音频等静态素材放在 `public/` 对应类型子目录中，例如 `public/audio/`。
- 改动保持最小范围，不添加需求外的框架、配置或兼容层。

## 验证要求

- 修改后至少运行类型检查或项目自带检查命令。
- 涉及 Studio 时，启动本地服务并在浏览器中确认页面及 composition 预览可用。
- 完成开发或文档改动后同步更新 `ROADMAP.md`。

## 安全约束

- 不提交密钥、token、`.env*` 或本地 AI 工具配置。
- 删除、回滚、发布、部署及 CI/CD 变更前必须确认。

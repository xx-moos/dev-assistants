# 仓库指南

## 项目结构与模块组织

本仓库是由 Turborepo 管理的 pnpm workspace。应用代码放在 `apps/`，共享库应放在 `packages/`。当前主要应用是 `apps/ai-tools`，它是一个 Vite + React 企业工具平台。入口文件是 `apps/ai-tools/src/main.jsx`，页面位于 `apps/ai-tools/src/pages/`，可复用 UI 组件放在 `apps/ai-tools/src/components/`，路由配置位于 `apps/ai-tools/src/routes/`，工具数据与通用函数位于 `apps/ai-tools/src/utils/`。

## 构建、测试与开发命令

- `pnpm install`：按锁定版本安装 workspace 依赖。
- `pnpm dev`：运行 `turbo dev`，启动工作区开发任务。
- `pnpm build`：运行所有已配置构建任务，输出如 `dist/` 等产物。
- `pnpm test`：运行各包定义的测试任务。
- `pnpm lint`：运行各包定义的代码检查任务。
- `pnpm --filter @x-dev-assistants/ai-tools dev`：仅启动 AI Tools 的 Vite 开发服务。
- `pnpm --filter @x-dev-assistants/ai-tools preview`：本地预览已构建的 Vite 应用。

## 编码风格与命名约定

使用 JavaScript ES modules 与 React 函数组件。React 组件使用 `PascalCase`，hooks 与工具函数使用 `camelCase`，常量使用 `UPPER_SNAKE_CASE`。组件目录应保持聚焦，优先采用 `ComponentName/index.jsx`，必要时同目录放置 `index.module.less`。配置文件沿用现有两个空格缩进的 JSON 风格。实现功能或修复问题时避免大范围重构。

## 测试规范

`apps/ai-tools` 当前未配置专用测试框架。如需添加测试，请将测试文件放在被测代码附近，并使用清晰命名，例如 `ComponentName.test.jsx` 或 `utilityName.test.js`；依赖 `pnpm test` 前，应先补充对应包的测试脚本。前端改动交付前，至少在可行时执行针对性的语法或类型检查，并运行 `git diff --check`。

## 提交与 Pull Request 规范

近期提交历史没有体现严格规范，因此提交信息应简洁、可描述变更。建议使用祈使句主题，并可加范围前缀，例如 `ai-tools: add dashboard layout`。Pull Request 应包含变更目的、关键修改、已执行的验证、关联 issue；涉及可见 UI 改动时，应附截图或简短录屏。

## 安全与配置提示

不要提交密钥、API key、token 或仅本地使用的设置。环境差异配置应放在源码外，并在相关 README 中记录必需的环境变量。

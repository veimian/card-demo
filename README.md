# 智能知识卡片系统

一个基于 React、TypeScript、Vite 和 Supabase 构建的智能知识卡片管理系统。项目支持知识卡片创建、AI 摘要、分类标签管理、公开分享、评论互动、间隔重复复习和学习数据看板。

## 主要功能

- 用户注册、登录和资料管理
- 知识卡片创建、编辑、搜索和批量删除
- 分类和标签管理
- DeepSeek AI 摘要、标题、分类和标签生成
- 文件内容解析，支持图片、PDF、TXT、Markdown、DOCX、PPTX
- 基于 SM-2 的间隔重复复习
- 主动复习和到期复习
- 学习连续天数、成就和仪表盘统计
- 卡片公开分享和评论
- 深色模式与响应式布局

## 技术栈

- 前端：React 18、TypeScript、Vite、Tailwind CSS
- 路由：React Router
- 状态管理：Zustand、TanStack Query
- 后端服务：Supabase Auth、PostgreSQL、Storage、RLS、RPC
- AI：DeepSeek API，兼容 OpenAI SDK
- 图表：Recharts
- 文件解析：PDF.js、Mammoth、Tesseract.js、JSZip

## 本地运行

安装依赖：

```bash
npm install
```

启动开发服务器：

```bash
npm run dev
```

常用检查命令：

```bash
npm run check
npm run lint
npm test -- --run
npm run build
```

## 环境变量

项目需要配置 Supabase 连接信息。可在本地创建 `.env.local`：

```env
VITE_SUPABASE_URL=你的 Supabase 项目地址
VITE_SUPABASE_ANON_KEY=你的 Supabase anon key
VITE_DEEPSEEK_API_KEY=可选，默认 DeepSeek API Key
```

也可以在应用的“设置”页面保存个人 DeepSeek API Key，该 Key 会保存在当前浏览器本地。

## 数据库迁移

Supabase 相关 SQL 位于 `supabase/migrations/`。将代码推送到 GitHub 不会自动更新 Supabase 数据库，需要手动执行迁移。

如果已配置 Supabase CLI，可运行：

```bash
supabase db push
```

也可以在 Supabase Dashboard 的 SQL Editor 中手动执行迁移 SQL。

## 项目结构

```text
src/
  components/      通用组件和仪表盘组件
  hooks/           React Query、复习统计、成就等 hooks
  lib/             Supabase、AI、SRS、文件处理等核心逻辑
  pages/           登录、首页、编辑器、复习、设置等页面
  store/           Zustand 状态
  types/           类型定义
  workers/         文件解析 Web Worker
supabase/
  migrations/      数据库表结构、策略和 RPC 迁移
scripts/           数据生成和维护脚本
```

## 测试账号

仓库中的脚本包含若干演示账号创建逻辑。实际可用账号取决于当前 Supabase 项目中的数据，请以数据库中的用户为准。

## 说明

本项目是一个演示型知识管理应用。生产环境使用时，请重点检查 Supabase RLS 策略、Storage 权限、AI Key 管理方式和数据库迁移执行状态。

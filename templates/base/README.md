# __PROJECT_NAME__

后台管理基线项目，基于 Next.js App Router Monorepo。

## 默认包含

- `apps/__APP_NAME__`：单个后台应用
- `packages/ui`：基础 UI 组件和全局样式
- `packages/request`：通用请求封装
- `packages/config`：环境变量校验
- `packages/db`：Prisma + PostgreSQL 数据层
- `packages/security`：密码哈希等基础安全能力

## 基础能力

- 登录页
- 基础登录态
- 用户 / 角色 / 菜单三张基础表
- 左侧菜单 + 顶部导航的后台 layout
- 默认一条工作台菜单和一个管理员种子账号

## 启动

```bash
pnpm install
cp .env.example .env
cp apps/__APP_NAME__/.env.example apps/__APP_NAME__/.env
docker compose up -d
pnpm db:setup
pnpm dev
```

打开 http://localhost:__APP_PORT__ 进入登录页。

默认种子账号：

- 账号：`admin`
- 密码：`ChangeMe!123`

## 可选模块

- `redis`
- `i18n`
- `storage`

## 常用命令

```bash
pnpm dev
pnpm db:setup
pnpm db:studio
pnpm build
pnpm lint
```

# Community Contacts MVP

一个面向本地社区团队的轻量联系人管理系统。居民通过 `/form` 提交信息，团队成员登录后可在后台查看、筛选、备注、跟进并导出 CSV。

## 项目结构

```txt
src/
  app/
    form/page.tsx                    # 居民公开表单
    login/page.tsx                   # 后台登录
    (admin)/layout.tsx               # 后台统一导航与登出
    (admin)/dashboard/page.tsx       # 统计首页
    (admin)/contacts/page.tsx        # 联系人列表入口
    (admin)/contacts/ContactsClient.tsx
    (admin)/contacts/[id]/page.tsx   # 联系人详情入口
    (admin)/contacts/[id]/ContactDetailClient.tsx
    globals.css
    layout.tsx
    page.tsx
  components/
    AdminShell.tsx
    StatCard.tsx
  lib/
    constants.ts
    csv.ts
    types.ts
    supabase/browser.ts
    supabase/server.ts
    supabase/middleware.ts
  proxy.ts
supabase/
  schema.sql
```

## 环境变量

复制 `.env.example` 为 `.env.local`：

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

只使用 Supabase anon key。不要把 service role key 放到前端、Vercel public 环境变量或浏览器代码中。

## Supabase 数据库

在 Supabase SQL Editor 运行 `supabase/schema.sql`。它会创建：

- `contacts`
- `interactions`
- `updated_at` 触发器
- Row Level Security policies

`contacts.location_detail` 用于保存居民填写的 “Street or nearby location, optional”。

RLS 策略要点：

- 匿名用户只能向 `contacts` 插入已勾选 consent 的记录。
- 匿名用户不能读取联系人。
- 登录用户可以读取、更新、删除 `contacts`。
- 登录用户可以新增、读取、更新、删除 `interactions`。

## 本地运行

```bash
npm install
npm run dev
```

打开：

- 居民表单：`http://localhost:3000/form`
- 后台登录：`http://localhost:3000/login`
- Dashboard：`http://localhost:3000/dashboard`
- 联系人列表：`http://localhost:3000/contacts`

## Vercel 部署

1. 将代码推送到 GitHub。
2. 在 Vercel 新建项目并连接仓库。
3. 在 Vercel Project Settings 添加环境变量：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. 在 Supabase Auth 设置里添加站点 URL 和 Redirect URL：
   - `https://your-vercel-domain.vercel.app`
   - `https://your-vercel-domain.vercel.app/login`
   - `https://your-vercel-domain.vercel.app/dashboard`
5. 部署后先用 Supabase Auth 创建后台用户，再登录后台。

## CSV 导出

`/contacts` 的 Export CSV 会导出当前页面筛选后的联系人。导出逻辑在 `src/lib/csv.ts` 和 `src/app/(admin)/contacts/ContactsClient.tsx`。

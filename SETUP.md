# PMO Insights - 快速启动指南

## 前置要求

确保你的系统已安装以下软件:

- **Node.js** 18+ (推荐使用 Node.js 20 LTS)
- **PostgreSQL** 14+ (或使用云数据库如 Supabase、Neon 等)
- **npm** 或 **yarn**

## 启动步骤

### 步骤 1: 安装依赖

打开终端,进入项目目录:

```bash
cd "C:\Users\igloohome\Work space\Poject\AI\PMO-Test"
```

安装所有依赖:

```bash
npm install
```

### 步骤 2: 配置数据库

#### 选项 A: 使用本地 PostgreSQL

1. 确保 PostgreSQL 已安装并正在运行
2. 创建新数据库:

```bash
# 在 PostgreSQL 中执行
CREATE DATABASE pmo_insights;
```

3. 更新 `.env.local` 中的 `DATABASE_URL`:

```env
DATABASE_URL="postgresql://你的用户名:你的密码@localhost:5432/pmo_insights?schema=public"
```

#### 选项 B: 使用云数据库 (推荐)

使用 Supabase 或 Neon 等云数据库服务:

1. 注册账号并创建新项目
2. 获取数据库连接字符串
3. 更新 `.env.local` 中的 `DATABASE_URL`

### 步骤 3: 初始化数据库

```bash
# 生成 Prisma Client
npx prisma generate

# 创建数据库表
npx prisma migrate dev --name init
```

### 步骤 4: 启动开发服务器

```bash
npm run dev
```

成功启动后,终端会显示:

```
ready - started server on 0.0.0.0:3000, url: http://localhost:3000
```

### 步骤 5: 访问应用

在浏览器中打开: [http://localhost:3000](http://localhost:3000)

## 创建第一个项目

1. 点击首页的 "新增项目" 按钮
2. 填写项目信息:
   - **项目名称**: 例如 "项目 Alpha"
   - **Smartsheet 链接**: 输入你的 Smartsheet 项目计划 URL
   - **Google Sheet ID**: 如果有 Google Sheet,输入其 ID
   - **总预算**: 例如 100000
   - **销售预测**: 例如 150000
3. 点击 "创建项目"

## 录入花费

1. 进入项目详情页
2. 切换到 "花费录入" 标签
3. 手动录入:
   - 选择日期
   - 输入金额
   - 选择类别 (Tooling, Test Setup, Certification, BOM, Logistics)
   - (可选) 添加备注
   - 点击 "添加花费"

4. 或使用 Excel 导入:
   - 点击 "上传 Excel 文件"
   - 选择包含花费数据的 Excel 文件
   - 系统自动导入所有记录

## Excel 导入模板

创建一个 Excel 文件,包含以下列:

| 日期        | 金额    | 类别         | 备注         |
|-------------|---------|--------------|--------------|
| 2026-03-25  | 5000    | Tooling      | 初始工具费用 |
| 2026-03-26  | 2000    | Test Setup   | 测试设备     |
| 2026-03-27  | 3000    | Certification | 认证费用     |

注意:
- 日期格式: YYYY-MM-DD 或 Excel 日期格式
- 类别必须是以下之一: Tooling, Test Setup, Certification, BOM, Logistics
- 金额必须是数字

## 环境变量说明

### 数据库配置
```env
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"
```

### NextAuth 配置
```env
NEXTAUTH_SECRET="your-secret-key-change-in-production"
NEXTAUTH_URL="http://localhost:3000"
```

### Google Sheets 配置
```env
GOOGLE_SERVICE_ACCOUNT_EMAIL="your-service-account@your-project.iam.gserviceaccount.com"
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----..."
```

**重要**: 使用 Google Sheets 功能时,需要:
1. 将服务账号 email 添加到 Google Sheet 的共享列表
2. 给予服务账号编辑权限

### Smartsheet 配置
```env
SMARTSHEET_ACCESS_TOKEN="your-smartsheet-api-token"
```

### Google Drive 配置 (可选)
```env
GOOGLE_DRIVE_FOLDER_ID="your-folder-id"
```

## 常见问题排查

### 问题 1: npm install 失败
**解决方案**:
```bash
# 清除缓存
npm cache clean --force

# 删除 node_modules
rm -rf node_modules package-lock.json

# 重新安装
npm install
```

### 问题 2: 数据库连接失败
**解决方案**:
- 检查 PostgreSQL 是否正在运行
- 确认数据库用户名和密码正确
- 检查数据库是否已创建

### 问题 3: Prisma migrate 失败
**解决方案**:
```bash
# 重置数据库 (谨慎使用,会删除所有数据)
npx prisma migrate reset

# 或手动创建表
npx prisma db push
```

### 问题 4: Smartsheet 进度无法显示
**解决方案**:
- 确认 Smartsheet URL 格式正确
- 检查 API Token 是否有效
- 确保该 Token 有访问该 Sheet 的权限

### 问题 5: Google Sheets 数据无法读取
**解决方案**:
- 确认 Google Sheet ID 正确
- 将服务账号 email 添加到 Sheet 共享列表
- 给予服务账号编辑权限
- 检查私钥格式是否正确

## 开发提示

### 查看数据库内容
```bash
npx prisma studio
```

这会打开一个可视化界面,可以查看和编辑数据库中的数据。

### 生成 API 文档
使用 Postman 或类似工具测试 API 端点:

- `GET http://localhost:3000/api/projects`
- `POST http://localhost:3000/api/projects`
- `GET http://localhost:3000/api/projects/[id]`

### 热重载
Next.js 支持热重载,修改文件后页面会自动刷新。

## 生产部署

### 构建
```bash
npm run build
```

### 启动生产服务器
```bash
npm start
```

### 部署到 Vercel (推荐)
1. 将代码推送到 GitHub
2. 在 Vercel 中导入项目
3. 配置环境变量
4. 自动部署

## 需要帮助?

如果遇到问题:
1. 检查本指南的常见问题部分
2. 查看 README.md 了解更多技术细节
3. 提交 Issue 或 Pull Request

祝你使用愉快! 🚀

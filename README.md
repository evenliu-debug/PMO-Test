# PMO Insights - 智能化管理平台

一个基于 Next.js 的项目管理看板,实现数据的统一管理与 ROI 实时可视化。

## 功能特性

- 📊 **项目总览 Dashboard**: 多项目对比表格,展示状态、进度、预算、花费及 ROI
- 💰 **ROI 实时计算**: 自动计算 ROI = (销售预测 - 实际花费) / 实际花费
- 📈 **可视化图表**: 使用 Recharts 展示预算 vs 实际花费、花费分类等
- 🔗 **第三方集成**:
  - **Google Sheets**: 读取预算模板和销售预测数据
  - **Smartsheet**: 关联项目计划,自动获取进度和里程碑
- 💵 **花费管理**: 支持手动录入和 Excel 批量导入
- 🚨 **智能预警**: ROI 低于 100% 标红预警,预算超支提醒

## 技术栈

- **前端**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **图表**: Recharts
- **数据库**: Prisma + PostgreSQL
- **认证**: NextAuth.js (已配置框架)
- **API 集成**:
  - Google Sheets API (google-spreadsheet)
  - Smartsheet API (smartsheet-sheet)
- **Excel 处理**: node-xlsx

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

已创建 `.env.local` 文件,包含以下配置:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/pmo_insights?schema=public"

# NextAuth
NEXTAUTH_SECRET="your-secret-key-change-in-production"
NEXTAUTH_URL="http://localhost:3000"

# Google Sheets
GOOGLE_SERVICE_ACCOUNT_EMAIL="even-liu000@teak-store-490709-d1.iam.gserviceaccount.com"
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----..."

# Smartsheet
SMARTSHEET_ACCESS_TOKEN="h8w7IL68nq8FazJS2u6goPPVJ6lcNsnfN1dkL"

# Google Drive Folder ID
GOOGLE_DRIVE_FOLDER_ID="122xSmmkQwG95qFXAd746jjuWd_d_WqLY"
```

### 3. 设置数据库

确保 PostgreSQL 已安装并运行,然后:

```bash
# 生成 Prisma Client
npx prisma generate

# 创建数据库迁移
npx prisma migrate dev --name init

# (可选) 填充测试数据
npx prisma db seed
```

### 4. 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

## 项目结构

```
PMO-Test/
├── app/                          # Next.js App Router
│   ├── api/                      # API 路由
│   │   ├── projects/             # 项目 CRUD API
│   │   └── spend/               # 花费 API 和批量导入
│   ├── projects/                # 项目页面
│   │   ├── [id]/               # 项目详情页
│   │   └── new/                # 新建项目页
│   ├── globals.css             # 全局样式
│   ├── layout.tsx              # 根布局
│   ├── page.tsx                # 首页 Dashboard
│   └── providers.tsx           # NextAuth Providers
├── lib/                         # 工具类和类型
│   ├── db.ts                   # Prisma 客户端
│   ├── google-sheets.ts        # Google Sheets API 集成
│   ├── smartsheet.ts           # Smartsheet API 集成
│   └── types.ts                # TypeScript 类型定义
├── prisma/
│   └── schema.prisma           # 数据库模型
├── .env.local                  # 环境变量
└── package.json                # 项目配置
```

## API 端点

### 项目管理
- `GET /api/projects` - 获取所有项目
- `POST /api/projects` - 创建新项目
- `GET /api/projects/[id]` - 获取项目详情
- `PUT /api/projects/[id]` - 更新项目
- `DELETE /api/projects/[id]` - 删除项目

### 花费管理
- `GET /api/spend?projectId=xxx` - 获取花费记录
- `POST /api/spend` - 创建新的花费记录
- `POST /api/spend/import` - Excel 批量导入

## 数据模型

### Project (项目)
- `id`: 唯一标识符
- `name`: 项目名称
- `smartsheetUrl`: Smartsheet 链接
- `googleSheetId`: Google Sheet ID (可选)
- `totalBudget`: 总预算
- `salesForecast`: 销售预测
- `status`: 项目状态 (PLANNING, ACTIVE, COMPLETED, ON_HOLD)

### ActualSpend (实际花费)
- `id`: 唯一标识符
- `projectId`: 关联的项目 ID
- `date`: 花费日期
- `amount`: 金额
- `category`: 类别 (Tooling, Test Setup, Certification, BOM, Logistics)
- `notes`: 备注

## 使用指南

### 1. 创建新项目
1. 点击首页的 "新增项目" 按钮
2. 填写项目信息:
   - 项目名称
   - Smartsheet 链接 (用于自动获取进度)
   - Google Sheet ID (可选,用于读取预算和销售预测)
   - 总预算
   - 销售预测 (可选)
3. 点击 "创建项目"

### 2. 录入花费
1. 进入项目详情页
2. 切换到 "花费录入" 标签
3. 选择录入方式:
   - **手动录入**: 填写日期、金额、类别、备注
   - **Excel 导入**: 上传包含花费数据的 Excel 文件

### 3. 查看数据
- **首页 Dashboard**: 查看所有项目的概览,包括进度条、ROI 警报
- **项目详情页**:
  - 顶部: 四个 KPI 卡片 (总预算、已花费、剩余预算、实时 ROI)
  - 中间: Recharts 图表 (预算 vs 实际花费、花费分类)
  - 底部: Tabs 切换不同功能模块

### 4. Excel 导入格式
Excel 文件应包含以下列:
- 日期 (必需)
- 金额 (必需)
- 类别 (必需): Tooling, Test Setup, Certification, BOM, Logistics
- 备注 (可选)

## 开发说明

### Google Sheets 集成
- 使用服务账号认证
- 支持 MS2 Readout 格式的表格解析
- 自动提取 Unit Cost、Tooling Cost 和 Volume Forecasts

### Smartsheet 集成
- 通过 URL 提取 Sheet ID
- 自动计算整体进度百分比
- 提取关键里程碑信息

### 数据库
- 使用 Prisma ORM
- PostgreSQL 作为主数据库
- 支持项目级联删除

## 常见问题

### Q: 如何修改数据库连接字符串?
A: 编辑 `.env.local` 文件中的 `DATABASE_URL`。

### Q: 如何添加新的花费类别?
A: 编辑 `prisma/schema.prisma` 中的 `SpendCategory` 枚举,然后运行 `npx prisma migrate dev`。

### Q: Smartsheet 进度不显示?
A: 检查 Smartsheet URL 是否正确,确保包含有效的 Sheet ID,并且该账号有访问权限。

### Q: Google Sheets 数据无法读取?
A: 确保:
- 服务账号 email 已添加到 Google Sheet 的共享列表中
- 服务账号有编辑权限
- Google Sheet ID 正确

## 部署

### 1. 构建项目

```bash
npm run build
```

### 2. 启动生产服务器

```bash
npm start
```

### 3. 环境变量
确保在生产环境中设置所有必需的环境变量。

## 许可证

MIT

## 联系方式

如有问题或建议,请提交 Issue 或 Pull Request。

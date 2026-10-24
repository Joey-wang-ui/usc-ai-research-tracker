# USC AI Research Tracker

Research Opportunities & Application Management — 面向个人的 AI 科研、RA、Student Worker、实习机会申请管理工具。

**个人工具，非 USC 官方网站。** 初始 21 条数据来自用户提供的历史线索，未经实时招聘核验，不代表机会当前开放。不推测截止日期、薪资、资格、技能要求或未提供的邮箱。

## 本地启动

使用 Node.js 24 LTS（也兼容 Vite 所支持的 Node 22.12+）。无需 Python、后端、数据库服务器、账户或 API Key。

```bash
npm install
npm run dev
```

首次打开会在 IndexedDB 中初始化全部 21 条线索。后续刷新保留自己的编辑、删除及清空状态。部署安装或 CI 推荐使用锁文件：`npm ci`。

```bash
npm run typecheck       # TypeScript 严格类型检查
npm test                # Vitest + fake-indexeddb：数据、持久化与业务逻辑
npm run build           # 生成 dist/ 生产文件
npm run preview         # 检查生产构建
npx playwright install chromium
npm run test:e2e        # 自动构建，再通过生产 preview 运行 Chromium 浏览器测试
```

Linux CI 安装浏览器及系统依赖：`npx playwright install --with-deps chromium`。若已安装系统 Chromium，可使用 `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e`。测试启用独立浏览器上下文，不操作日常浏览器数据。

`npm run format` 使用 Prettier 格式化项目。

## 已实现

- **Dashboard**：6 项实时统计、8 阶段概览、优先 5 项、近期行动、动态、最近 6 个月提交申请趋势。
- **Opportunities**：列表 / 卡片、关键词和导师搜索、方向 / 优先级 / 阶段 / 类别 / 薪酬 / 核实筛选、两字段排序、新建、编辑、备注、重点标记、来源链接、归档、确认删除。
- **Pipeline**：8 阶段 Kanban，桌面拖放和适用于触屏、键盘的阶段菜单；更新自动持久化并记录动态。
- **Detail**：完整岗位信息、官方来源、研究匹配、技术要求、可编辑清单、沟通记录、笔记、关联任务及动态时间线。笔记和清单文本离开输入框时自动保存，其他输入通过明确的保存按钮提交。
- **Research CRM**：联系人管理、一位导师关联多个机会、沟通和跟进日期、回复、英文 Inquiry / Follow-up 可编辑邮件草稿、复制与 mailto。不会自动发送邮件，打开客户端也不视为已发送。
- **Timeline & Tasks**：月度日历、任意年份导航、跨月待办列表、个人准备 / 计划联系 / 跟进 / 面试任务、完成状态、编辑、删除和过期提示。官方截止、个人目标及 CRM 跟进分别标注。
- **Settings**：默认深色与持久化浅色主题、完整 JSON 备份 / 结构验证 / 确认恢复、带 UTF-8 BOM 的 Excel CSV、持久存储请求、补回缺失默认线索、二次确认清空。
- 响应式导航、键盘搜索快捷键 Ctrl/Cmd + K、弹窗焦点约束、通知与空状态。

### 日期与统计口径

- 所有默认 `deadline`、`targetDate` 和发布日期为空；目标日期由本人设置。
- “即将截止”仅统计未来 30 天内的**官方截止日期**，不使用个人计划日期。
- 高优先级为 S/A；已提交为 Applied / Interviewing / Offer；等待回复为 Contacted / Applied。归档机会不计入 Dashboard。
- 趋势根据本工具记录的进入 Applied 阶段的时间按月去重；它表示本地记录时间，不推测历史实际投递日期。
- 个人任务和跟进允许任意未来日期，不限制在 2026–2028。

## 数据与备份

数据保存在当前源（origin）的 IndexedDB：数据库 `usc-research-tracker`，版本 1，`workspace` object store 内一个原子快照。所有变更经过串行写入、完整校验，写入失败时显示错误并保留原状态。支持 Web Locks 的浏览器只允许第一个标签页编辑，其他标签页只读，防止旧快照覆盖；关闭其他标签页并刷新可重新获得编辑权。

**不会跨设备或浏览器同步，也不上传个人数据。** GitHub Pages 只提供静态文件。隐私模式、浏览器数据清理、存储回收、换设备或变更站点 origin 都可能导致找不到原数据。IndexedDB 不能代替备份。一个 origin 下的多个项目路径共享此工具的数据库，建议一个 origin 只使用一个本工具实例。

在设置页导出 JSON 后妥善保存。新设备在设置页导入并确认替换即可恢复。备份包含机会、联系人、任务、沟通、清单、动态和主题，使用 `schemaVersion: 1`；导入前校验每个字段、HTTP(S) URL、邮箱、有效日期、重复 ID 和关联关系。无效文件不会改动已有数据。最大文件 15 MB。恢复是完整替换而非合并，恢复前可先导出当前快照。

CSV 为机会主要字段与导师名的表格导出，采用 BOM、CSV 引号转义及公式注入防护；CSV 不包含全部关联记录，不作为恢复格式。默认线索恢复仅补回缺失记录，不覆盖已有编辑。删除机会同时删除关联任务、沟通与动态，保留联系人；删除联系人只解除关联。

## GitHub Pages 部署

已提供 `.github/workflows/deploy.yml`，不需要自己配置服务器：

1. 将代码提交并推送到 GitHub 仓库的 `main` 分支。
2. 在仓库 **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**。
3. 推送 `main` 或在 Actions 手动运行 **Test and deploy to GitHub Pages**。
4. workflow 执行 `npm ci`、Vitest、生产构建、Chromium 浏览器测试，然后上传 `dist/` 并部署。通过后从 workflow 的 `github-pages` environment 获取真实地址。

需要仓库启用 Pages，Actions 可以使用 `pages: write` 和 `id-token: write`，以及仓库/组织允许该 workflow。若有环境保护规则，应由仓库维护者审批。

Vite 使用相对 `base: './'`，适用于 `https://<user>.github.io/<repository>/`、用户根站点和自定义域名。使用 `HashRouter`，例如 `/<repository>/#/opportunities/USC-01`，详情页刷新不会请求服务器上的虚构路由，无需 404 重定向。

**配置 workflow 不等于发布成功。** 当前交付以本地测试和生产构建为准；只有 GitHub Actions 实际成功后网站才公开可访问。不要把开发服务器地址当成线上地址。

## 目录

```text
.github/workflows/deploy.yml   # 自动测试与 Pages 部署
src/
  App.tsx                     # 布局、导航、HashRouter
  main.tsx
  styles.css                  # Tailwind + 深浅主题设计系统与响应式样式
  components/
    ui.tsx                    # 弹窗、状态、空状态等
    forms.tsx                 # 机会 / 联系人 / 任务 / 沟通表单
  data/
    leads.json                # 完整 21 条用户提供的线索及来源
    seed.ts                   # 一次性初始化，不覆盖用户数据
  lib/
    model.ts                  # 纯业务命令、筛选、统计和导入导出
    db.ts                     # IndexedDB 原子读写
    store.tsx                 # 写队列、错误处理与多标签页保护
    dates.ts / files.ts
    model.test.ts             # 单元与持久化测试
  pages/                      # 7 类页面（含独立详情页）
  types/index.ts              # Zod 结构与 TypeScript 类型
public/favicon.svg
e2e/tracker.spec.ts            # 真浏览器完整流程与手机布局
```

## 已知边界与下一步

当前没有服务端、账号、同步、邮件投递、附件存储或招聘页面抓取；邮件中的方括号需要自己填写。官方招聘状态和资格仍需要人工核实。后续可以扩展 IndexedDB schema 迁移、材料附件、重复记录合并和可选加密同步，不影响现有 JSON 备份边界。

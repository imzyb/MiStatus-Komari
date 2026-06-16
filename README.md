# MiStatus Komari

一个基于 Next.js 15 + React 19 的现代化服务器监控主题，专为 Komari 服务端设计，使用 TypeScript、Tailwind CSS 4 和现代 React 技术栈构建。

## 功能特点

- **现代技术栈**：Next.js 15 + React 19 + TypeScript + Tailwind CSS 4
- **实时监控**：CPU、内存、硬盘、SWAP、网络流量实时监控
- **IPv4/IPv6 支持**：智能识别和显示双栈网络状态
- **数据可视化**：折线图 + 渐变面积图、进度条和统计面板
- **风格 UI**：简洁扁平设计，Geist 字体，深色/浅色模式
- **响应式设计**：完美适配桌面、平板和移动设备
- **高性能**：Turbopack 开发模式，优化的生产构建
- **实时更新**：支持 WebSocket 连接
- **地区分组**：支持按地区分组显示服务器（Flag emoji → 中文名称映射）
- **模块化架构**：组件化设计，易于定制和扩展

## 快速开始

```bash
# 安装依赖
bun install

# 开发模式
bun run dev

# 生产构建
bun run build

# 构建主题包
bun run build:theme
```

## 项目结构

```
src/
├── app/                # Next.js App Router 页面
│   ├── layout.tsx      # 根布局
│   ├── page.tsx        # 首页（监控面板）
│   ├── error.tsx       # 错误页面
│   ├── not-found.tsx   # 404 页面
│   └── globals.css     # 全局样式（Vercel 色彩体系）
├── components/         # UI 组件
│   ├── client-navbar.tsx        # 导航栏
│   ├── server-card.tsx          # 服务器卡片
│   ├── server-metric.tsx        # 指标进度条
│   ├── server-dashboard-stats.tsx # 监控概览统计
│   ├── server-list.tsx          # 服务器列表
│   ├── server-load-chart.tsx    # 历史负载折线图
│   ├── region-filter.tsx        # 地区筛选（Flag → 中文名）
│   ├── region-group-view.tsx    # 地区分组视图
│   ├── client-theme-toggle.tsx  # 主题切换（浅色/深色/系统）
│   ├── dashboard/               # 仪表板子组件
│   └── ui/                      # 基础 UI 组件
├── contexts/           # React Context
│   ├── servers-context.tsx      # 服务器数据上下文
│   └── site-info-context.tsx    # 站点信息上下文
├── hooks/              # 自定义 Hooks
│   └── use-region-data.ts       # 地区数据 Hook
├── lib/                # 工具库
│   ├── api.ts                   # API 客户端
│   ├── node-helpers.ts          # 节点数据处理
│   ├── websocket-helpers.ts     # WebSocket 客户端
│   ├── rpc-client.ts            # RPC 客户端
│   └── utils.ts                 # 通用工具函数
└── styles/
    └── fonts.css       # Geist 字体
```

## 自定义主题

- **`src/lib/config.ts`**：全局配置（网站标题、刷新间隔等）
- **`src/app/globals.css`**：全局 CSS 变量（--background、--foreground 等）
- **`src/styles/fonts.css`**：字体配置（Geist + Inter）

## 技术栈

- **框架**：Next.js 15 + React 19
- **语言**：TypeScript
- **样式**：Tailwind CSS 4
- **状态管理**：React Context + Custom Hooks
- **数据获取**：RPC 客户端 + REST API 回退
- **实时通信**：WebSocket + JSON-RPC2
- **图标**：Lucide React
- **字体**：Geist + Inter
- **包管理器**：bun（推荐）

## 许可证

MIT License

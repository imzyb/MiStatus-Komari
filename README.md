# MiStatus Komari

基于 Next.js 15 + React 19 的 Komari 监控主题，Binance 风格 UI，深色为主，支持卡片/列表双视图、实时数据、延迟监测。

## 功能

- **双视图模式**：卡片视图 / 列表视图，支持 localStorage 持久化
- **服务器搜索**：按名称/位置实时过滤，`/` 快捷键聚焦
- **延迟监测**：点击服务器卡片弹出延迟历史图表（联通/电信/移动），支持 1H/6H/12H/24H 时间范围
- **WebSocket 实时状态**：导航栏连接指示灯（绿=实时 / 红=离线）
- **地区筛选**：下拉选择器，显示国旗 emoji + 中文名 + 服务器数量
- **进度条监控**：CPU、内存、硬盘、SWAP 使用率
- **网络面板**：实时网速 + 总流量
- **深色/浅色主题**：三态切换（深色/浅色/跟随系统）
- **响应式设计**：桌面/平板/移动端自适应

## 快速开始

```bash
bun install
bun run dev          # 开发模式
bun run build        # 生产构建
bun run build:theme  # 主题包
```

## 项目结构

```
src/
├── app/
│   ├── page.tsx              # 首页（监控面板）
│   ├── layout.tsx            # 根布局
│   ├── globals.css           # Binance 色彩体系
│   ├── error.tsx             # 错误页
│   └── not-found.tsx         # 404 页
├── components/
│   ├── client-navbar.tsx     # 导航栏（连接状态）
│   ├── server-card.tsx       # 服务器卡片
│   ├── server-list.tsx       # 卡片视图
│   ├── server-list-item.tsx  # 列表行
│   ├── server-list-view.tsx  # 列表视图
│   ├── server-search.tsx     # 搜索框
│   ├── view-toggle.tsx       # 卡片/列表切换
│   ├── ping-chart.tsx        # 延迟折线图
│   ├── server-detail-drawer.tsx # 详情抽屉
│   ├── region-filter.tsx     # 地区选择
│   ├── server-metric.tsx     # 进度条
│   ├── server-load-chart.tsx # 历史负载图
│   ├── dashboard/            # 仪表板组件
│   ├── server/               # 服务器详情组件
│   └── ui/                   # 基础 UI 组件
├── contexts/
│   ├── servers-context.tsx   # 服务器数据上下文
│   ├── site-info-context.tsx # 站点信息上下文
│   └── server-detail-context.tsx # 详情面板上下文
├── hooks/
│   └── use-region-data.ts    # 地区数据 Hook
├── lib/
│   ├── api.ts                # API 客户端
│   ├── node-helpers.ts       # 节点数据处理
│   ├── websocket-helpers.ts  # WebSocket 客户端
│   ├── rpc-adapter.ts        # RPC 适配器
│   └── utils.ts              # 通用工具函数
└── styles/
    └── fonts.css             # BinanceNova / BinancePlex 字体
```

## 自定义

- **`src/lib/config.ts`**：站点标题、刷新间隔等
- **`src/app/globals.css`**：CSS 变量（--background、--primary、--trading-up 等）
- **`src/styles/fonts.css`**：字体配置

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Next.js 15 + React 19 |
| 语言 | TypeScript |
| 样式 | Tailwind CSS 4 |
| 状态管理 | React Context + Custom Hooks |
| 数据获取 | RPC + REST API 回退 |
| 实时通信 | WebSocket + JSON-RPC2 |
| 图标 | Lucide React |
| 字体 | BinanceNova (Geist) + BinancePlex (GeistMono) |

## 许可证

MIT License

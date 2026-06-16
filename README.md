# MiStatus - 现代化服务器监控面板

一个基于 Next.js 15 + React 19 的现代化服务器监控主题，专为 Komari 服务端设计，使用 TypeScript、Tailwind CSS 4 和现代 React 技术栈构建。

## ✨ 功能特点

- 🚀 **现代技术栈**：Next.js 15 + React 19 + TypeScript + Tailwind CSS 4
- 📊 **实时监控**：CPU、内存、硬盘、SWAP、网络流量实时监控
- 🌐 **IPv4/IPv6 支持**：智能识别和显示双栈网络状态
- 📈 **数据可视化**：直观的进度条、图表和统计面板
- 🎨 **现代 UI**：基于 Shadcn UI 的优雅设计，支持深色/浅色模式
- 📱 **响应式设计**：完美适配桌面、平板和移动设备
- ⚡ **高性能**：Turbopack 开发模式，优化的生产构建
- 🔄 **实时更新**：支持 WebSocket 连接
- 🏷️ **地区分组**：支持按地区分组显示服务器
- 🧩 **模块化架构**：组件化设计，易于定制和扩展

### API 接口说明

本主题支持多种数据获取方式，优先使用 RPC2 接口，失败时自动回退到 REST API：

#### WebSocket 连接

- **`/api/clients`**: WebSocket 客户端连接，用于实时数据推送

## 🎨 自定义主题

您可以根据需要修改主题，调整颜色、布局等：

### 配置文件

- **`src/lib/config.ts`**: 全局配置（网站标题、刷新间隔等）
- **`src/app/globals.css`**: 全局样式和 CSS 变量
- **`tailwind.config.ts`**: Tailwind CSS 配置
- **`src/components/`**: UI 组件库

### 主要组件

#### 核心组件

- **`ServerCard`**: 服务器卡片组件，显示服务器基本信息
- **`ServerMetric`**: 指标显示组件，展示 CPU、内存、网络等数据
- **`ServerList`**: 服务器列表组件，支持分组和筛选
- **`RegionFilter`**: 地区筛选组件
- **`DynamicTitle`**: 动态标题组件，从 API 获取站点信息

#### 仪表板组件

- **`ClientDashboardStats`**: 客户端监控概览面板
- **`ServerDashboardStats`**: 服务端监控概览面板
- **`StatCard`**: 统计卡片组件
- **`LastUpdated`**: 最后更新时间显示
- **`TrafficComponents`**: 流量统计组件

#### 服务器详情组件

- **`NetworkPanel`**: 网络面板组件
- **`StatusBadge`**: 状态徽章组件
- **`StatusIndicator`**: 状态指示器组件
- **`ServerLoadChart`**: 服务器负载图表

#### UI 组件

- **`Card`**: 基础卡片组件
- **`Badge`**: 徽章组件
- **`Progress`**: 进度条组件
- **`ThemeIcons`**: 主题图标组件

#### 客户端组件

- **`ClientNavbar`**: 客户端导航栏
- **`ClientServerSection`**: 客户端服务器区域
- **`ClientThemeToggle`**: 客户端主题切换

### 样式定制

项目使用 Tailwind CSS 4 和 CSS 变量，支持：

- 深色/浅色主题切换
- 自定义颜色方案
- 响应式布局调整
- 动画效果定制

## 📚 技术栈

- **框架**: Next.js 15 + React 19
- **语言**: TypeScript
- **样式**: Tailwind CSS 4
- **UI 组件**: Shadcn UI + Radix UI
- **状态管理**: React Context + Custom Hooks
- **数据获取**: 自定义 RPC 客户端 + REST API 回退
- **实时通信**: WebSocket + JSON-RPC2
- **图标**: Lucide React + Radix UI Icons
- **字体**: HarmonyOS Sans SC
- **包管理器**: bun（推荐）
- **构建工具**: Turbopack（开发模式）

## 📄 许可证

MIT License

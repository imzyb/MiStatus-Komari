# CLAUDE.md

## Project Overview

MiStatus Komari is a Next.js 15 + React 19 monitoring dashboard for ServerStatus-Rust/Komari. Binance-style dark UI with real-time server monitoring.

## Development

```bash
bun install          # Install dependencies (preferred)
bun run dev          # Development server (Turbopack)
bun run build        # Production build
bun run build:theme  # Build theme ZIP for Komari
```

## Architecture

### Tech Stack

- **Next.js 15** with App Router, static export (`output: 'export'`)
- **React 19** with Strict Mode
- **TypeScript** strict
- **Tailwind CSS 4** with `@tailwindcss/postcss` plugin
- **React Context + Custom Hooks** for state management (no TanStack Query)
- **Custom RPC Client** (`rpc-adapter.ts`) with REST API fallback

### Data Flow

1. WebSocket (`websocket-helpers.ts`) connects to Komari backend for real-time data
2. `servers-context.tsx` manages global server data state via `ServersProvider`
3. Components consume data via `useServers()` hook
4. `node-helpers.ts` converts raw WebSocket data to `Server` objects
5. Region data computed via `selectors/region.ts` pure functions, memoized in `use-region-data.ts`

### Key Files

| File | Purpose |
|------|---------|
| `src/lib/config.ts` | Site title, refresh interval, API URL |
| `src/lib/api.ts` | `Server` type, `convertClientToServer`, `getKomariPublicInfo` |
| `src/lib/rpc-adapter.ts` | RPC/REST adapter with fallback |
| `src/lib/websocket-helpers.ts` | WebSocket parsing, connection handler |
| `src/lib/node-helpers.ts` | `WsNodeRealtime` type, `createServerFromRealtimeData`, `sortServers` |
| `src/contexts/servers-context.tsx` | Global server data context + WebSocket lifecycle |
| `src/components/server-card.tsx` | Card view server component |
| `src/components/server-list-item.tsx` | List view row component |
| `src/components/ping-chart.tsx` | Latency history chart |

### UI Design

- Binance-style dark-first design (canvas: #0b0e11, accent: #fcd535)
- Trading semantics: green (#0ecb81) = up/online, red (#f6465d) = down/offline
- Font stack: BinanceNova (Geist) + BinancePlex (GeistMono)
- Flat surfaces with hairline borders (#2b3139), no glassmorphism
- `rounded-xl` for cards, `rounded-md` for buttons/inputs
- All animations respect `prefers-reduced-motion`

### Component Patterns

- `React.memo` with custom comparator for server cards (prevents re-render on unrelated data changes)
- `LazyRender` (IntersectionObserver) for offscreen card unmounting
- `lazy()` + `Suspense` for code splitting large components
- View mode persistence via `localStorage`

## Environment Variables

- `NEXT_PUBLIC_API_URL` - ServerStatus-Rust/Komari API URL
- `NEXT_PUBLIC_SITE_URL` / `KOMARI_BASE_URL` - Base URL for server-side requests

## Deployment

Static export for Komari theme system:
- `bun run build:theme` generates `komari-theme-server-sentry.zip`
- `scripts/build-theme.js` handles packaging

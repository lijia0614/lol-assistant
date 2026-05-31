# LOL Assistant v1.0.0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个 Electron 透明覆盖层应用，在 LOL 对局中实时显示 10 名玩家的段位、KDA、胜率和常用英雄。

**Architecture:** Electron 主进程负责 LCU 连接、Riot API 调用、窗口管理和全局快捷键；React 渲染进程通过 IPC 接收数据并渲染半透明覆盖层 UI。数据流：LCU WebSocket 推送游戏状态 → 主进程拉取 PUUID → Riot API 批量查询 → 聚合推送 → 覆盖层渲染。

**Tech Stack:** Electron + electron-vite + React 18 + TypeScript + Tailwind CSS + electron-builder

---
```

## File Structure

```
lol-assistant/
├── package.json
├── electron-builder.yml
├── electron.vite.config.ts
├── tsconfig.json
├── tsconfig.node.json
├── tsconfig.web.json
├── tailwind.config.ts
├── postcss.config.js
├── src/
│   ├── main/                          # Electron 主进程
│   │   ├── index.ts                   # 入口：启动窗口、注册 IPC
│   │   ├── window-manager.ts          # 透明覆盖层窗口 + 托盘
│   │   ├── shortcut.ts                # 全局快捷键 Ctrl+Tab
│   │   ├── lcu-connector.ts           # LCU 进程发现 + API 调用
│   │   ├── riot-client.ts             # Riot API HTTP 客户端
│   │   ├── data-aggregator.ts         # 数据聚合 + 缓存
│   │   └── ipc-handlers.ts            # IPC 通道注册
│   ├── preload/                       # Preload 脚本
│   │   └── index.ts                   # contextBridge 暴露 API
│   ├── renderer/                      # React 渲染进程
│   │   ├── index.html
│   │   ├── main.tsx                   # React 入口
│   │   ├── App.tsx                    # 根组件
│   │   ├── components/
│   │   │   ├── OverlayPanel.tsx       # 覆盖层主面板
│   │   │   ├── PlayerCard.tsx         # 玩家卡片
│   │   │   ├── TeamRow.tsx            # 队伍行
│   │   │   ├── DetailPanel.tsx        # 详情展开面板
│   │   │   ├── LoadingSkeleton.tsx    # 加载骨架屏
│   │   │   └── SettingsPage.tsx       # 设置页面
│   │   ├── hooks/
│   │   │   ├── useGameState.ts        # 游戏状态 hook
│   │   │   └── usePlayerData.ts       # 玩家数据 hook
│   │   ├── types/
│   │   │   └── index.ts               # 共享类型
│   │   └── styles/
│   │       └── index.css              # Tailwind 入口
│   └── shared/                        # 主进程/渲染进程共享
│       └── types.ts                   # 共享类型定义
└── resources/
    └── icon.png                       # 应用图标 (256x256)
```

---

### Task 1: 项目脚手架初始化

**Files:**
- Create: `package.json`, `electron.vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `tsconfig.web.json`, `tailwind.config.ts`, `postcss.config.js`, `electron-builder.yml`
- Create: `src/main/index.ts`, `src/preload/index.ts`, `src/renderer/index.html`, `src/renderer/main.tsx`, `src/renderer/App.tsx`, `src/renderer/styles/index.css`
- Create: `.gitignore`

- [ ] **Step 1: 初始化 package.json**

```bash
mkdir -p /Users/lijia/workspaces/work/lol-assistant
cd /Users/lijia/workspaces/work/lol-assistant
npm init -y
```

- [ ] **Step 2: 安装依赖**

```bash
cd /Users/lijia/workspaces/work/lol-assistant
npm install react react-dom
npm install -D electron electron-vite @vitejs/plugin-react typescript @types/react @types/react-dom
npm install -D tailwindcss @tailwindcss/vite postcss autoprefixer
npm install -D electron-builder
```

- [ ] **Step 3: 配置 package.json — 写入完整内容**

```json
{
  "name": "lol-assistant",
  "version": "1.0.0",
  "description": "英雄联盟战绩覆盖层工具",
  "main": "./out/main/index.js",
  "scripts": {
    "dev": "electron-vite dev",
    "build": "electron-vite build",
    "preview": "electron-vite preview",
    "package": "electron-vite build && electron-builder"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.0",
    "autoprefixer": "^10.4.20",
    "electron": "^33.0.0",
    "electron-builder": "^25.0.0",
    "electron-vite": "^2.9.0",
    "postcss": "^8.4.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.6.0"
  }
}
```

- [ ] **Step 4: 配置 electron.vite.config.ts**

```typescript
import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from 'tailwindcss'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: { index: resolve(__dirname, 'src/main/index.ts') }
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: { index: resolve(__dirname, 'src/preload/index.ts') }
      }
    }
  },
  renderer: {
    root: resolve(__dirname, 'src/renderer'),
    build: {
      rollupOptions: {
        input: { index: resolve(__dirname, 'src/renderer/index.html') }
      }
    },
    plugins: [react()],
    css: {
      postcss: {
        plugins: [tailwindcss(), autoprefixer()]
      }
    }
  }
})
```

- [ ] **Step 5: 配置 tsconfig 文件**

`tsconfig.json`:
```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.node.json" },
    { "path": "./tsconfig.web.json" }
  ]
}
```

`tsconfig.node.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "strict": true,
    "outDir": "./out",
    "declaration": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  },
  "include": ["src/main/**/*", "src/preload/**/*", "src/shared/**/*", "electron.vite.config.ts"]
}
```

`tsconfig.web.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "esModuleInterop": true,
    "strict": true,
    "outDir": "./out",
    "skipLibCheck": true,
    "resolveJsonModule": true
  },
  "include": ["src/renderer/**/*", "src/shared/**/*"]
}
```

- [ ] **Step 6: 配置 Tailwind**

`tailwind.config.ts`:
```typescript
import type { Config } from 'tailwindcss'

export default {
  content: ['./src/renderer/**/*.{html,tsx,ts}'],
  theme: {
    extend: {
      colors: {
        blue: { team: '#4da6ff' },
        red: { team: '#ff4d4d' },
        surface: 'rgba(10, 12, 16, 0.85)',
      }
    }
  },
  plugins: []
} satisfies Config
```

`postcss.config.js`:
```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}
  }
}
```

- [ ] **Step 7: 配置 electron-builder.yml**

```yaml
appId: com.lol-assistant.app
productName: LOL Assistant
directories:
  output: dist
  buildResources: resources
files:
  - out/**/*
mac:
  target: dmg
  artifactName: "${name}-${version}-mac.${ext}"
  category: public.app-category.utilities
win:
  target: nsis
  artifactName: "${name}-${version}-win.${ext}"
linux:
  target: AppImage
  artifactName: "${name}-${version}-linux.${ext}"
```

- [ ] **Step 8: 创建 .gitignore**

```gitignore
node_modules/
out/
dist/
*.log
.DS_Store
```

- [ ] **Step 9: 创建最小骨架文件**

`src/main/index.ts`:
```typescript
import { app, BrowserWindow } from 'electron'
import { join } from 'path'

function createWindow(): void {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })
  if (process.env.ELECTRON_RENDERER_URL) {
    win.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(createWindow)
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() })
```

`src/preload/index.ts`:
```typescript
import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  getGameState: () => ipcRenderer.invoke('get-game-state'),
  getPlayerData: () => ipcRenderer.invoke('get-player-data'),
  onGameStateChange: (callback: (data: unknown) => void) => {
    ipcRenderer.on('game-state-changed', (_event, data) => callback(data))
  },
  onPlayerDataUpdate: (callback: (data: unknown) => void) => {
    ipcRenderer.on('player-data-update', (_event, data) => callback(data))
  },
  toggleOverlay: () => ipcRenderer.invoke('toggle-overlay'),
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings: unknown) => ipcRenderer.invoke('save-settings', settings),
})
```

`src/renderer/index.html`:
```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>LOL Assistant</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="./main.tsx"></script>
</body>
</html>
```

`src/renderer/main.tsx`:
```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><App /></React.StrictMode>
)
```

`src/renderer/App.tsx`:
```tsx
import { useState, useEffect } from 'react'

export default function App() {
  const [phase, setPhase] = useState<string>('等待 LOL 客户端连接...')

  useEffect(() => {
    const api = (window as any).electronAPI
    if (api) {
      api.onGameStateChange((data: any) => {
        setPhase(data?.phase ?? '未知')
      })
    }
  }, [])

  return (
    <div className="min-h-screen bg-transparent text-white flex items-center justify-center">
      <p className="text-lg opacity-60">{phase}</p>
    </div>
  )
}
```

`src/renderer/styles/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  padding: 0;
  background: transparent;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

#root {
  width: 100vw;
  min-height: 100vh;
}
```

- [ ] **Step 10: 验证 dev 模式启动**

```bash
cd /Users/lijia/workspaces/work/lol-assistant && npm run dev
```

Expected: Electron 窗口打开，显示 "等待 LOL 客户端连接..."

- [ ] **Step 11: 提交**

```bash
cd /Users/lijia/workspaces/work/lol-assistant && git init && git add -A && git commit -m "chore: scaffold Electron + React + Vite + Tailwind project"
```

---

### Task 2: 共享类型定义

**Files:**
- Create: `src/shared/types.ts`
- Modify: `src/renderer/types/index.ts`

- [ ] **Step 1: 创建 src/shared/types.ts**

```typescript
/** 游戏阶段 */
export type GamePhase =
  | 'None'
  | 'Lobby'
  | 'Matchmaking'
  | 'ReadyCheck'
  | 'ChampSelect'
  | 'GameStart'
  | 'InProgress'
  | 'EndOfGame'

/** 段位信息 */
export interface RankInfo {
  tier: string        // IRON, BRONZE, SILVER, GOLD, PLATINUM, EMERALD, DIAMOND, MASTER, GRANDMASTER, CHALLENGER
  division: string    // I, II, III, IV (MASTER+ 为空)
  lp: number
}

/** 近期战绩统计 */
export interface RecentStats {
  kda: number         // KDA 比率: (K+A)/D, D=0 时 = K+A
  winRate: number     // 0.0 - 1.0
  gamesPlayed: number
}

/** 常用英雄 */
export interface TopChampion {
  championId: number
  championName: string
  masteryPoints: number
}

/** 单个玩家完整数据 */
export interface PlayerData {
  puuid: string
  summonerName: string
  summonerId: string
  team: 'blue' | 'red'
  championId: number | null       // 选人阶段未确定时为空
  championName: string | null
  rank: RankInfo | null           // 无段位时为空
  recentStats: RecentStats | null // Riot API 不可用时为空
  topChampions: TopChampion[]     // 最多 3 个
}

/** 游戏会话 */
export interface GameSession {
  phase: GamePhase
  gameMode: string
  mapId: number
  players: PlayerData[]
  lastUpdated: number
}

/** LCU 连接状态 */
export interface LcuConnection {
  host: string       // https://127.0.0.1:<port>
  token: string      // remoting-auth-token
  connected: boolean
}

/** 应用设置 */
export interface AppSettings {
  riotApiKey: string
  hotkey: string     // 默认 'Ctrl+Tab'
  autoShow: boolean  // 进入游戏自动显示覆盖层
  opacity: number    // 0.0 - 1.0, 默认 0.85
}

/** IPC 通道名称常量 */
export const IPC_CHANNELS = {
  GAME_STATE_CHANGED: 'game-state-changed',
  PLAYER_DATA_UPDATE: 'player-data-update',
  GET_GAME_STATE: 'get-game-state',
  GET_PLAYER_DATA: 'get-player-data',
  TOGGLE_OVERLAY: 'toggle-overlay',
  GET_SETTINGS: 'get-settings',
  SAVE_SETTINGS: 'save-settings',
} as const

/** 覆盖层窗口配置 */
export const OVERLAY_CONFIG = {
  width: 1000,
  height: 500,
  opacity: 0.85,
  alwaysOnTop: true,
  frame: false,
  transparent: true,
} as const
```

- [ ] **Step 2: 创建 src/renderer/types/index.ts（重导出共享类型）**

```typescript
export type {
  GamePhase,
  RankInfo,
  RecentStats,
  TopChampion,
  PlayerData,
  GameSession,
  AppSettings,
} from '../../shared/types'

export { IPC_CHANNELS, OVERLAY_CONFIG } from '../../shared/types'
```

- [ ] **Step 3: 提交**

```bash
cd /Users/lijia/workspaces/work/lol-assistant && git add -A && git commit -m "feat: add shared type definitions"
```

---

### Task 3: LCU 连接器

**Files:**
- Create: `src/main/lcu-connector.ts`

LCU 连接器通过查找 LOL 客户端进程获取认证信息，建立 HTTPS 连接并监听游戏状态。

- [ ] **Step 1: 创建 src/main/lcu-connector.ts**

```typescript
import { exec } from 'child_process'
import { promisify } from 'util'
import https from 'https'
import { EventEmitter } from 'events'
import type { GamePhase, LcuConnection } from '../shared/types'

const execAsync = promisify(exec)

/** 通过进程名查找 LCU 端口和认证令牌 */
async function findLcuProcess(): Promise<LcuConnection | null> {
  const platform = process.platform

  try {
    if (platform === 'darwin') {
      // macOS: 通过 lsof 查找 LeagueClientUx 进程
      const { stdout } = await execAsync(
        `lsof -nP -iTCP -sTCP:LISTEN | grep LeagueClientUx | awk '{print $9}' | head -1`
      )
      const port = stdout.trim().split(':').pop()
      if (!port) return null

      // 查找启动参数中的 remoting-auth-token
      const { stdout: argsOut } = await execAsync(
        `ps aux | grep LeagueClientUx | grep -v grep | head -1`
      )
      const tokenMatch = argsOut.match(/--remoting-auth-token=([^\s]+)/)
      if (!tokenMatch) return null

      return {
        host: `https://127.0.0.1:${port}`,
        token: tokenMatch[1],
        connected: false
      }
    } else if (platform === 'win32') {
      // Windows: 通过 WMIC 查找进程命令行参数
      const { stdout } = await execAsync(
        `wmic process where "name='LeagueClientUx.exe'" get commandline /format:csv`
      )
      const portMatch = stdout.match(/--app-port=(\d+)/)
      const tokenMatch = stdout.match(/--remoting-auth-token=([^\s]+)/)
      if (!portMatch || !tokenMatch) return null

      return {
        host: `https://127.0.0.1:${portMatch[1]}`,
        token: tokenMatch[1],
        connected: false
      }
    }

    return null
  } catch {
    return null
  }
}

/** 对 LCU API 发起 HTTPS 请求（忽略自签名证书） */
async function lcuRequest(
  connection: LcuConnection,
  method: string,
  path: string,
  body?: unknown
): Promise<unknown> {
  const url = new URL(path, connection.host)
  const auth = Buffer.from(`riot:${connection.token}`).toString('base64')

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: url.hostname,
        port: parseInt(url.port),
        path: url.pathname + url.search,
        method,
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        rejectUnauthorized: false // LCU 使用自签名证书
      },
      (res) => {
        let data = ''
        res.on('data', (chunk) => (data += chunk))
        res.on('end', () => {
          try {
            resolve(data ? JSON.parse(data) : null)
          } catch {
            resolve(data)
          }
        })
      }
    )
    req.on('error', reject)
    req.setTimeout(5000, () => { req.destroy(); reject(new Error('LCU request timeout')) })
    if (body) req.write(JSON.stringify(body))
    req.end()
  })
}

/** LCU 连接器类：管理连接生命周期 + 游戏状态监听 */
export class LcuConnector extends EventEmitter {
  private connection: LcuConnection | null = null
  private ws: WebSocket | null = null
  private pollTimer: ReturnType<typeof setInterval> | null = null
  private currentPhase: GamePhase = 'None'
  private retryCount = 0
  private readonly maxRetries = 10
  private readonly retryInterval = 3000

  /** 开始轮询查找 LOL 客户端 */
  start(): void {
    this.pollTimer = setInterval(() => this.tryConnect(), this.retryInterval)
    this.tryConnect()
  }

  /** 停止轮询 */
  stop(): void {
    if (this.pollTimer) { clearInterval(this.pollTimer); this.pollTimer = null }
    this.disconnect()
  }

  getConnection(): LcuConnection | null {
    return this.connection
  }

  getCurrentPhase(): GamePhase {
    return this.currentPhase
  }

  /** 调用 LCU API */
  async api<T = unknown>(method: string, path: string, body?: unknown): Promise<T> {
    if (!this.connection) throw new Error('LCU not connected')
    return lcuRequest(this.connection, method, path, body) as Promise<T>
  }

  private async tryConnect(): Promise<void> {
    if (this.retryCount >= this.maxRetries && this.connection?.connected) return

    const conn = await findLcuProcess()
    if (conn) {
      this.connection = { ...conn, connected: true }
      this.retryCount = 0
      this.emit('connected', this.connection)
      this.fetchGamePhase()
    } else {
      this.retryCount++
      if (this.connection?.connected) {
        this.connection.connected = false
        this.emit('disconnected')
      }
    }
  }

  private async fetchGamePhase(): Promise<void> {
    if (!this.connection) return
    try {
      const phase = await this.api<string>('GET', '/lol-gameflow/v1/gameflow-phase')
      if (phase !== this.currentPhase) {
        this.currentPhase = phase as GamePhase
        this.emit('phaseChange', this.currentPhase)
      }
    } catch {
      // 忽略单次失败，下次轮询重试
    }
  }

  /** 获取当前选人/对局中的玩家列表 */
  async getCurrentPlayers(): Promise<Array<{
    puuid: string; summonerName: string; summonerId: string
    team: 'blue' | 'red'; championId: number | null
  }>> {
    if (!this.connection) return []

    try {
      // 从 champ-select session 获取选人信息（含 summonerId 和 championId）
      const champSelect: any = await this.api('GET', '/lol-champ-select/v1/session')
      if (!champSelect || !champSelect.myTeam) return []

      const players: Array<{
        puuid: string; summonerName: string; summonerId: string
        team: 'blue' | 'red'; championId: number | null
      }> = []

      for (const member of champSelect.myTeam) {
        players.push({
          puuid: member.puuid || '',
          summonerName: member.summonerName || member.displayName || '',
          summonerId: member.summonerId?.toString() || '',
          team: 'blue',
          championId: member.championId ?? null
        })
      }

      for (const member of (champSelect.theirTeam || [])) {
        players.push({
          puuid: member.puuid || '',
          summonerName: member.summonerName || member.displayName || '',
          summonerId: member.summonerId?.toString() || '',
          team: 'red',
          championId: member.championId ?? null
        })
      }

      return players
    } catch {
      return []
    }
  }

  private disconnect(): void {
    this.connection = null
    this.emit('disconnected')
  }
}

/** 段位 tier 排序权重（用于比较） */
export const TIER_ORDER: Record<string, number> = {
  IRON: 1, BRONZE: 2, SILVER: 3, GOLD: 4,
  PLATINUM: 5, EMERALD: 6, DIAMOND: 7,
  MASTER: 8, GRANDMASTER: 9, CHALLENGER: 10
}
```

- [ ] **Step 2: 验证 TypeScript 编译通过**

```bash
cd /Users/lijia/workspaces/work/lol-assistant && npx tsc --project tsconfig.node.json --noEmit
```

Expected: 无错误输出

- [ ] **Step 3: 提交**

```bash
cd /Users/lijia/workspaces/work/lol-assistant && git add -A && git commit -m "feat: add LCU connector"
```

---

### Task 4: Riot API 客户端

**Files:**
- Create: `src/main/riot-client.ts`

- [ ] **Step 1: 创建 src/main/riot-client.ts**

```typescript
import type { RankInfo, RecentStats, TopChampion, AppSettings } from '../shared/types'

const RIOT_API_BASE = {
  asia: 'https://asia.api.riotgames.com',
  americas: 'https://americas.api.riotgames.com',
  europe: 'https://europe.api.riotgames.com',
  sea: 'https://sea.api.riotgames.com'
}

/** 根据服务器区域获取 routing 和 platform 地址 */
function getEndpoints(server: string): { platform: string; regional: string } {
  // 国服特殊处理
  if (server === 'cn') return {
    platform: 'https://riot-api.cngames.com',
    regional: 'https://riot-api.cngames.com'
  }
  const platformMap: Record<string, string> = {
    kr: 'https://kr.api.riotgames.com',
    jp: 'https://jp1.api.riotgames.com',
    na1: 'https://na1.api.riotgames.com',
    euw1: 'https://euw1.api.riotgames.com',
    eun1: 'https://eun1.api.riotgames.com',
    br1: 'https://br1.api.riotgames.com',
    la1: 'https://la1.api.riotgames.com',
    la2: 'https://la2.api.riotgames.com',
    oc1: 'https://oc1.api.riotgames.com',
    tr1: 'https://tr1.api.riotgames.com',
    ru1: 'https://ru1.api.riotgames.com',
    ph2: 'https://ph2.api.riotgames.com',
    sg2: 'https://sg2.api.riotgames.com',
    th2: 'https://th2.api.riotgames.com',
    tw2: 'https://tw2.api.riotgames.com',
    vn2: 'https://vn2.api.riotgames.com',
  }
  const regionalMap: Record<string, string> = {
    kr: 'https://asia.api.riotgames.com',
    jp: 'https://asia.api.riotgames.com',
    na1: 'https://americas.api.riotgames.com',
    euw1: 'https://europe.api.riotgames.com',
    eun1: 'https://europe.api.riotgames.com',
    br1: 'https://americas.api.riotgames.com',
    la1: 'https://americas.api.riotgames.com',
    la2: 'https://americas.api.riotgames.com',
    oc1: 'https://sea.api.riotgames.com',
    tr1: 'https://europe.api.riotgames.com',
    ru1: 'https://europe.api.riotgames.com',
    ph2: 'https://sea.api.riotgames.com',
    sg2: 'https://sea.api.riotgames.com',
    th2: 'https://sea.api.riotgames.com',
    tw2: 'https://sea.api.riotgames.com',
    vn2: 'https://sea.api.riotgames.com',
  }
  return {
    platform: platformMap[server] || platformMap.kr,
    regional: regionalMap[server] || regionalMap.kr
  }
}

/** HTTP 请求封装 */
async function riotFetch(apiKey: string, url: string): Promise<unknown> {
  const resp = await fetch(url, {
    headers: { 'X-Riot-Token': apiKey }
  })
  if (!resp.ok) {
    if (resp.status === 429) throw new Error('Riot API rate limit exceeded')
    if (resp.status === 403) throw new Error('Invalid Riot API key')
    if (resp.status === 404) return null
    throw new Error(`Riot API error: ${resp.status}`)
  }
  return resp.json()
}

export class RiotClient {
  private apiKey: string
  private cache: Map<string, { data: unknown; timestamp: number }> = new Map()
  private readonly cacheTtlMs = 3600_000 // 1 小时缓存
  private server = 'kr' // 默认韩服，从 LCU 自动检测

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  updateApiKey(key: string): void { this.apiKey = key }
  setServer(server: string): void { this.server = server }

  /** 批量获取玩家完整数据（10 人） */
  async getPlayersData(
    players: Array<{ puuid: string; summonerName: string; summonerId: string; team: 'blue' | 'red'; championId: number | null }>
  ): Promise<Array<{ puuid: string; rank: RankInfo | null; recentStats: RecentStats | null; topChampions: TopChampion[] }>> {
    if (!this.apiKey) return players.map(p => ({ puuid: p.puuid, rank: null, recentStats: null, topChampions: [] }))

    const results: Array<{ puuid: string; rank: RankInfo | null; recentStats: RecentStats | null; topChampions: TopChampion[] }> = []

    // 逐个请求以控制速率（100 req / 2 min = 1 req / 1.2s），用缓存避免重复
    for (const player of players) {
      if (!player.puuid) {
        results.push({ puuid: player.puuid, rank: null, recentStats: null, topChampions: [] })
        continue
      }

      const { platform, regional } = getEndpoints(this.server)

      // 并行拉取段位 + 英雄熟练度（platform endpoint）
      const rank = await this.cachedFetch<RankInfo | null>(
        `rank-${player.puuid}`,
        () => this.fetchRank(platform, player.summonerId)
      )

      const topChampions = await this.cachedFetch<TopChampion[]>(
        `champs-${player.puuid}`,
        () => this.fetchTopChampions(platform, player.puuid)
      )

      // 拉取近期胜率（regional endpoint: match-v5）
      const recentStats = await this.cachedFetch<RecentStats | null>(
        `stats-${player.puuid}`,
        () => this.fetchRecentStats(regional, player.puuid)
      )

      results.push({ puuid: player.puuid, rank, recentStats, topChampions })

      // 速率限制：每请求等 200ms
      await new Promise(r => setTimeout(r, 200))
    }

    return results
  }

  private async fetchRank(platform: string, summonerId: string): Promise<RankInfo | null> {
    if (!summonerId) return null
    try {
      const entries = await riotFetch(this.apiKey,
        `${platform}/lol/league/v4/entries/by-summoner/${summonerId}`) as any[]
      const soloEntry = entries?.find((e: any) => e.queueType === 'RANKED_SOLO_5x5')
      if (!soloEntry) return null
      return {
        tier: soloEntry.tier,
        division: soloEntry.rank,
        lp: soloEntry.leaguePoints
      }
    } catch { return null }
  }

  private async fetchRecentStats(regional: string, puuid: string): Promise<RecentStats | null> {
    try {
      const matchIds = await riotFetch(this.apiKey,
        `${regional}/lol/match/v5/matches/by-puuid/${puuid}/ids?queue=420&start=0&count=20`) as string[]
      if (!matchIds?.length) return null

      let totalKills = 0, totalDeaths = 0, totalAssists = 0, wins = 0, games = 0

      // 拉取最近 10 场详情（减少请求量）
      const recentIds = matchIds.slice(0, 10)
      for (const matchId of recentIds) {
        try {
          const match = await riotFetch(this.apiKey,
            `${regional}/lol/match/v5/matches/${matchId}`) as any
          const participant = match?.info?.participants?.find((p: any) => p.puuid === puuid)
          if (participant) {
            totalKills += participant.kills
            totalDeaths += participant.deaths
            totalAssists += participant.assists
            if (participant.win) wins++
            games++
          }
        } catch { continue }
      }

      if (games === 0) return null
      const kda = totalDeaths === 0
        ? totalKills + totalAssists
        : (totalKills + totalAssists) / totalDeaths

      return {
        kda: Math.round(kda * 10) / 10,
        winRate: Math.round((wins / games) * 100) / 100,
        gamesPlayed: games
      }
    } catch { return null }
  }

  private async fetchTopChampions(platform: string, puuid: string): Promise<TopChampion[]> {
    try {
      const masteries = await riotFetch(this.apiKey,
        `${platform}/lol/champion-mastery/v4/champion-masteries/by-puuid/${puuid}?count=3`) as any[]
      if (!masteries?.length) return []
      return masteries.map((m: any) => ({
        championId: m.championId,
        championName: String(m.championId), // 后续可通过 Data Dragon 映射
        masteryPoints: m.championPoints
      }))
    } catch { return [] }
  }

  /** 带缓存的 fetch */
  private async cachedFetch<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    const cached = this.cache.get(key)
    if (cached && Date.now() - cached.timestamp < this.cacheTtlMs) {
      return cached.data as T
    }
    const data = await fetcher()
    this.cache.set(key, { data, timestamp: Date.now() })
    return data
  }

  clearCache(): void { this.cache.clear() }
}
```

- [ ] **Step 2: 验证 TypeScript 编译**

```bash
cd /Users/lijia/workspaces/work/lol-assistant && npx tsc --project tsconfig.node.json --noEmit
```

Expected: 无错误

- [ ] **Step 3: 提交**

```bash
cd /Users/lijia/workspaces/work/lol-assistant && git add -A && git commit -m "feat: add Riot API client"
```

---

### Task 5: 数据聚合器

**Files:**
- Create: `src/main/data-aggregator.ts`

数据聚合器连接 LCU Connector 和 Riot Client，在游戏阶段变化时自动拉取并聚合数据。

- [ ] **Step 1: 创建 src/main/data-aggregator.ts**

```typescript
import { EventEmitter } from 'events'
import type { GameSession, GamePhase, PlayerData } from '../shared/types'
import { LcuConnector } from './lcu-connector'
import { RiotClient } from './riot-client'

export class DataAggregator extends EventEmitter {
  private lcuConnector: LcuConnector
  private riotClient: RiotClient | null = null
  private currentSession: GameSession | null = null
  private lastFetchedPhase: GamePhase = 'None'

  constructor(lcuConnector: LcuConnector) {
    super()
    this.lcuConnector = lcuConnector

    this.lcuConnector.on('connected', () => {
      console.log('[DataAggregator] LCU connected')
    })

    this.lcuConnector.on('phaseChange', (phase: GamePhase) => {
      this.handlePhaseChange(phase)
    })

    this.lcuConnector.on('disconnected', () => {
      console.log('[DataAggregator] LCU disconnected')
      this.updateSession({ phase: 'None', gameMode: '', mapId: 0, players: [], lastUpdated: Date.now() })
    })
  }

  setRiotClient(client: RiotClient): void {
    this.riotClient = client
  }

  getCurrentSession(): GameSession | null {
    return this.currentSession
  }

  private async handlePhaseChange(phase: GamePhase): Promise<void> {
    console.log(`[DataAggregator] Phase: ${this.lastFetchedPhase} -> ${phase}`)

    // 只在进入选人阶段或游戏开始时拉取数据
    if (phase === 'ChampSelect' || phase === 'GameStart' || phase === 'InProgress') {
      if (this.lastFetchedPhase !== phase) {
        await this.fetchAndAggregate(phase)
      }
    }

    if (phase === 'EndOfGame' || phase === 'Lobby' || phase === 'None') {
      this.updateSession({ phase, gameMode: '', mapId: 0, players: [], lastUpdated: Date.now() })
    }

    this.lastFetchedPhase = phase
  }

  private async fetchAndAggregate(phase: GamePhase): Promise<void> {
    try {
      // Step 1: 从 LCU 获取当前 10 人基础信息
      const lcuPlayers = await this.lcuConnector.getCurrentPlayers()
      if (lcuPlayers.length === 0) {
        console.log('[DataAggregator] No players found in current session')
        this.updateSession({ phase, gameMode: 'CLASSIC', mapId: 11, players: [], lastUpdated: Date.now() })
        return
      }

      // Step 2: 用 Riot API 丰富每个玩家的数据
      let enrichedData: Array<{
        puuid: string; rank: import('../shared/types').RankInfo | null
        recentStats: import('../shared/types').RecentStats | null
        topChampions: import('../shared/types').TopChampion[]
      }> = lcuPlayers.map(p => ({ puuid: p.puuid, rank: null, recentStats: null, topChampions: [] }))

      if (this.riotClient) {
        enrichedData = await this.riotClient.getPlayersData(lcuPlayers)
      }

      // Step 3: 聚合为 PlayerData[]
      const players: PlayerData[] = lcuPlayers.map((lp, i) => {
        const enriched = enrichedData[i] ?? { rank: null, recentStats: null, topChampions: [] }
        return {
          puuid: lp.puuid,
          summonerName: lp.summonerName,
          summonerId: lp.summonerId,
          team: lp.team,
          championId: lp.championId,
          championName: null,
          rank: enriched.rank,
          recentStats: enriched.recentStats,
          topChampions: enriched.topChampions
        }
      })

      this.updateSession({
        phase,
        gameMode: 'CLASSIC',
        mapId: 11,
        players,
        lastUpdated: Date.now()
      })
    } catch (err) {
      console.error('[DataAggregator] Error:', err)
    }
  }

  private updateSession(session: GameSession): void {
    this.currentSession = session
    this.emit('sessionUpdate', session)
  }
}
```

- [ ] **Step 2: 验证 TypeScript 编译**

```bash
cd /Users/lijia/workspaces/work/lol-assistant && npx tsc --project tsconfig.node.json --noEmit
```

Expected: 无错误

- [ ] **Step 3: 提交**

```bash
cd /Users/lijia/workspaces/work/lol-assistant && git add -A && git commit -m "feat: add data aggregator"
```

---

### Task 6: 窗口管理器

**Files:**
- Create: `src/main/window-manager.ts`

- [ ] **Step 1: 创建 src/main/window-manager.ts**

```typescript
import { BrowserWindow, Tray, Menu, nativeImage, screen } from 'electron'
import { join } from 'path'
import { OVERLAY_CONFIG } from '../shared/types'

export class WindowManager {
  private overlayWindow: BrowserWindow | null = null
  private tray: Tray | null = null
  private isVisible = false
  private opacity = OVERLAY_CONFIG.opacity

  /** 创建透明覆盖层窗口 */
  createOverlay(): BrowserWindow {
    if (this.overlayWindow && !this.overlayWindow.isDestroyed()) {
      return this.overlayWindow
    }

    const { width: screenW, height: screenH } = screen.getPrimaryDisplay().workAreaSize

    this.overlayWindow = new BrowserWindow({
      width: OVERLAY_CONFIG.width,
      height: OVERLAY_CONFIG.height,
      x: Math.round((screenW - OVERLAY_CONFIG.width) / 2),
      y: Math.round(screenH * 0.05), // 距顶部 5%
      transparent: true,
      frame: false,
      alwaysOnTop: true,
      resizable: false,
      skipTaskbar: true,
      hasShadow: false,
      opacity: this.opacity,
      webPreferences: {
        preload: join(__dirname, '../preload/index.js'),
        sandbox: false,
        backgroundThrottling: false
      }
    })

    // 面板区域外鼠标穿透
    this.overlayWindow.setIgnoreMouseEvents(true, { forward: true })

    if (process.env.ELECTRON_RENDERER_URL) {
      this.overlayWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
    } else {
      this.overlayWindow.loadFile(join(__dirname, '../renderer/index.html'))
    }

    this.overlayWindow.on('closed', () => { this.overlayWindow = null })
    this.isVisible = true

    return this.overlayWindow
  }

  /** 创建系统托盘 */
  createTray(): Tray {
    // 创建一个 16x16 的空白图标
    const icon = nativeImage.createEmpty()
    this.tray = new Tray(icon.resize({ width: 16, height: 16 }))

    const contextMenu = Menu.buildFromTemplate([
      { label: '显示/隐藏覆盖层', click: () => this.toggleOverlay() },
      { label: '设置', click: () => this.showSettings() },
      { type: 'separator' },
      { label: '退出', click: () => this.quit() }
    ])

    this.tray.setToolTip('LOL Assistant')
    this.tray.setContextMenu(contextMenu)
    this.tray.on('click', () => this.toggleOverlay())

    return this.tray
  }

  /** 切换覆盖层显示/隐藏 */
  toggleOverlay(): boolean {
    if (!this.overlayWindow || this.overlayWindow.isDestroyed()) {
      this.createOverlay()
      this.isVisible = true
      return true
    }

    if (this.isVisible) {
      this.overlayWindow.hide()
      this.isVisible = false
      return false
    } else {
      this.overlayWindow.show()
      this.isVisible = true
      return true
    }
  }

  /** 根据游戏阶段自动显示/隐藏 */
  setAutoVisibility(phase: string): void {
    const shouldShow = phase === 'ChampSelect' || phase === 'GameStart' || phase === 'InProgress'
    if (shouldShow && !this.isVisible) {
      this.toggleOverlay()
    } else if (!shouldShow && this.isVisible) {
      this.toggleOverlay()
    }
  }

  /** 更新面板鼠标穿透区域 */
  setMouseIgnore(ignore: boolean): void {
    this.overlayWindow?.setIgnoreMouseEvents(ignore, { forward: true })
  }

  private showSettings(): void {
    // 设置页面在主进程通过 IPC 打开独立窗口
    if (this.overlayWindow && !this.overlayWindow.isDestroyed()) {
      this.overlayWindow.webContents.send('navigate', '/settings')
    }
  }

  private quit(): void {
    // 清理后退出
    if (this.overlayWindow && !this.overlayWindow.isDestroyed()) {
      this.overlayWindow.close()
    }
    if (this.tray) this.tray.destroy()
    // app.quit() 由调用方处理
    process.exit(0)
  }

  getOverlayWindow(): BrowserWindow | null {
    return this.overlayWindow
  }
}
```

- [ ] **Step 2: 验证 TypeScript 编译**

```bash
cd /Users/lijia/workspaces/work/lol-assistant && npx tsc --project tsconfig.node.json --noEmit
```

Expected: 无错误

- [ ] **Step 3: 提交**

```bash
cd /Users/lijia/workspaces/work/lol-assistant && git add -A && git commit -m "feat: add window manager with transparent overlay"
```

---

### Task 7: 全局快捷键

**Files:**
- Create: `src/main/shortcut.ts`

- [ ] **Step 1: 创建 src/main/shortcut.ts**

```typescript
import { globalShortcut } from 'electron'

export class ShortcutManager {
  private registeredKeys: string[] = []

  /** 注册快捷键 */
  register(key: string, callback: () => void): boolean {
    const ret = globalShortcut.register(key, callback)
    if (ret) {
      this.registeredKeys.push(key)
      console.log(`[Shortcut] Registered: ${key}`)
    }
    return ret
  }

  /** 注销快捷键 */
  unregister(key: string): void {
    globalShortcut.unregister(key)
    this.registeredKeys = this.registeredKeys.filter(k => k !== key)
  }

  /** 更新快捷键（如用户改设置） */
  update(oldKey: string, newKey: string, callback: () => void): void {
    this.unregister(oldKey)
    this.register(newKey, callback)
  }

  /** 注销所有快捷键 */
  unregisterAll(): void {
    globalShortcut.unregisterAll()
    this.registeredKeys = []
  }
}
```

- [ ] **Step 2: 验证 TypeScript 编译**

```bash
cd /Users/lijia/workspaces/work/lol-assistant && npx tsc --project tsconfig.node.json --noEmit
```

Expected: 无错误

- [ ] **Step 3: 提交**

```bash
cd /Users/lijia/workspaces/work/lol-assistant && git add -A && git commit -m "feat: add global shortcut manager"
```

---

### Task 8: IPC 处理器

**Files:**
- Create: `src/main/ipc-handlers.ts`

- [ ] **Step 1: 创建 src/main/ipc-handlers.ts**

```typescript
import { ipcMain, BrowserWindow } from 'electron'
import { IPC_CHANNELS } from '../shared/types'
import type { AppSettings, GameSession } from '../shared/types'
import { DataAggregator } from './data-aggregator'
import { WindowManager } from './window-manager'
import { RiotClient } from './riot-client'
import * as fs from 'fs'
import * as path from 'path'
import { app } from 'electron'

const SETTINGS_PATH = path.join(app.getPath('userData'), 'settings.json')

/** 读取持久化设置 */
function loadSettings(): AppSettings {
  try {
    if (fs.existsSync(SETTINGS_PATH)) {
      return JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf-8'))
    }
  } catch { /* ignore */ }
  return { riotApiKey: '', hotkey: 'Ctrl+Tab', autoShow: true, opacity: 0.85 }
}

/** 保存设置 */
function saveSettingsFile(settings: AppSettings): void {
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2))
}

export function registerIpcHandlers(
  aggregator: DataAggregator,
  windowManager: WindowManager,
  riotClient: RiotClient | null
): void {
  let settings = loadSettings()

  // 游戏状态查询
  ipcMain.handle(IPC_CHANNELS.GET_GAME_STATE, () => {
    return aggregator.getCurrentSession()
  })

  // 玩家数据查询
  ipcMain.handle(IPC_CHANNELS.GET_PLAYER_DATA, () => {
    return aggregator.getCurrentSession()?.players ?? []
  })

  // 切换覆盖层
  ipcMain.handle(IPC_CHANNELS.TOGGLE_OVERLAY, () => {
    return windowManager.toggleOverlay()
  })

  // 设置读写
  ipcMain.handle(IPC_CHANNELS.GET_SETTINGS, () => settings)

  ipcMain.handle(IPC_CHANNELS.SAVE_SETTINGS, (_event, newSettings: AppSettings) => {
    settings = { ...settings, ...newSettings }
    saveSettingsFile(settings)
    // 更新 Riot API key
    if (riotClient && newSettings.riotApiKey) {
      riotClient.updateApiKey(newSettings.riotApiKey)
    }
    return true
  })

  // 数据更新事件推送
  aggregator.on('sessionUpdate', (session: GameSession) => {
    const win = windowManager.getOverlayWindow()
    if (win && !win.isDestroyed()) {
      win.webContents.send(IPC_CHANNELS.GAME_STATE_CHANGED, session)
      win.webContents.send(IPC_CHANNELS.PLAYER_DATA_UPDATE, session.players)
    }
    // 自动显示/隐藏
    if (settings.autoShow) {
      windowManager.setAutoVisibility(session.phase)
    }
  })
}
```

- [ ] **Step 2: 验证 TypeScript 编译**

```bash
cd /Users/lijia/workspaces/work/lol-assistant && npx tsc --project tsconfig.node.json --noEmit
```

Expected: 无错误

- [ ] **Step 3: 提交**

```bash
cd /Users/lijia/workspaces/work/lol-assistant && git add -A && git commit -m "feat: add IPC handlers"
```

---

### Task 9: 主进程入口

**Files:**
- Modify: `src/main/index.ts`

用之前创建的骨架替换为完整的主进程入口。首先抽离 settings 读写为独立模块。

- [ ] **Step 1: 创建 src/main/settings-store.ts**

```typescript
import * as fs from 'fs'
import * as path from 'path'
import { app } from 'electron'
import type { AppSettings } from '../shared/types'

const SETTINGS_PATH = path.join(app.getPath('userData'), 'settings.json')

const DEFAULT_SETTINGS: AppSettings = {
  riotApiKey: '',
  hotkey: 'Ctrl+Tab',
  autoShow: true,
  opacity: 0.85
}

export function loadSettings(): AppSettings {
  try {
    if (fs.existsSync(SETTINGS_PATH)) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf-8')) }
    }
  } catch { /* ignore corrupt file */ }
  return { ...DEFAULT_SETTINGS }
}

export function saveSettings(settings: AppSettings): void {
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2))
}
```

- [ ] **Step 2: 重写 src/main/index.ts**

```typescript
import { app } from 'electron'
import { LcuConnector } from './lcu-connector'
import { RiotClient } from './riot-client'
import { DataAggregator } from './data-aggregator'
import { WindowManager } from './window-manager'
import { ShortcutManager } from './shortcut'
import { registerIpcHandlers } from './ipc-handlers'
import { loadSettings } from './settings-store'

let lcuConnector: LcuConnector
let riotClient: RiotClient | null = null
let aggregator: DataAggregator
let windowManager: WindowManager
let shortcutManager: ShortcutManager

app.whenReady().then(() => {
  const settings = loadSettings()

  // 1. 窗口 & 托盘
  windowManager = new WindowManager()
  windowManager.createTray()

  // 2. LCU 连接器
  lcuConnector = new LcuConnector()

  // 3. Riot API 客户端（如果有 API Key）
  if (settings.riotApiKey) {
    riotClient = new RiotClient(settings.riotApiKey)
  }

  // 4. 数据聚合器
  aggregator = new DataAggregator(lcuConnector)
  if (riotClient) {
    aggregator.setRiotClient(riotClient)
  }

  // 5. 注册 IPC
  registerIpcHandlers(aggregator, windowManager, riotClient)

  // 6. 全局快捷键
  shortcutManager = new ShortcutManager()
  shortcutManager.register(settings.hotkey, () => {
    windowManager.toggleOverlay()
  })

  // 7. 启动 LCU 扫描
  lcuConnector.start()

  // 8. 初始显示覆盖层窗口（作为连接状态提示）
  windowManager.createOverlay()
})

app.on('will-quit', () => {
  lcuConnector?.stop()
  shortcutManager?.unregisterAll()
})

// macOS: 关闭窗口不退出应用
app.on('window-all-closed', () => {
  // 不退出，保持在托盘
})

app.on('activate', () => {
  windowManager?.createOverlay()
})
```

- [ ] **Step 3: 更新 ipc-handlers.ts — 使用 settings-store**

修改 `ipc-handlers.ts` 的 import，用 `settings-store` 替代内联的 loadSettings/saveSettings：

```typescript
// 将 ipc-handlers.ts 中的
//   import * as fs from 'fs'
//   import * as path from 'path'
//   const SETTINGS_PATH = ...
//   function loadSettings() { ... }
//   function saveSettingsFile() { ... }
// 替换为:
import { loadSettings, saveSettings } from './settings-store'
```

然后函数内 `saveSettingsFile(settings)` 改为 `saveSettings(settings)`。

- [ ] **Step 4: 验证 TypeScript 编译**

```bash
cd /Users/lijia/workspaces/work/lol-assistant && npx tsc --project tsconfig.node.json --noEmit
```

Expected: 无错误

- [ ] **Step 5: 提交**

```bash
cd /Users/lijia/workspaces/work/lol-assistant && git add -A && git commit -m "feat: wire up main process entry point"
```

---

### Task 10: 渲染进程 — 全局样式 + Preload 类型声明

**Files:**
- Modify: `src/renderer/styles/index.css`
- Create: `src/renderer/types/electron.d.ts`

- [ ] **Step 1: 更新 src/renderer/styles/index.css — 完整的暗黑覆盖层样式**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  background: transparent !important;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  -webkit-font-smoothing: antialiased;
  overflow: hidden;
  user-select: none;
}

#root {
  width: 100vw;
  min-height: 100vh;
}

/* 覆盖层主面板 */
.overlay-panel {
  background: rgba(10, 12, 16, 0.88);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
}

/* 玩家卡片 */
.player-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  transition: all 0.15s ease;
}
.player-card:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.12);
  transform: translateY(-2px);
}
.player-card.team-blue {
  border-left: 2px solid #4da6ff;
}
.player-card.team-red {
  border-left: 2px solid #ff4d4d;
}

/* 高威胁标记 */
.player-card.threat {
  border-color: rgba(255, 77, 77, 0.3);
  box-shadow: 0 0 12px rgba(255, 77, 77, 0.1);
}

/* 加载骨架屏 */
.skeleton {
  background: linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s infinite;
  border-radius: 4px;
}
@keyframes skeleton-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* 滚动条 */
::-webkit-scrollbar {
  width: 4px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: rgba(255,255,255,0.08);
  border-radius: 2px;
}
```

- [ ] **Step 2: 创建 src/renderer/types/electron.d.ts — Electron API 类型声明**

```typescript
import type { GameSession, PlayerData, AppSettings } from '../../shared/types'

interface ElectronAPI {
  getGameState: () => Promise<GameSession | null>
  getPlayerData: () => Promise<PlayerData[]>
  onGameStateChange: (callback: (data: GameSession) => void) => void
  onPlayerDataUpdate: (callback: (data: PlayerData[]) => void) => void
  toggleOverlay: () => Promise<boolean>
  getSettings: () => Promise<AppSettings>
  saveSettings: (settings: Partial<AppSettings>) => Promise<boolean>
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

export {}
```

- [ ] **Step 3: 提交**

```bash
cd /Users/lijia/workspaces/work/lol-assistant && git add -A && git commit -m "feat: add renderer global styles and Electron type declarations"
```

---

### Task 11: 渲染进程 — PlayerCard 组件

**Files:**
- Create: `src/renderer/components/PlayerCard.tsx`

- [ ] **Step 1: 创建 src/renderer/components/PlayerCard.tsx**

```tsx
import type { PlayerData, RankInfo } from '../types'

/** 段位显示配置 */
const TIER_DISPLAY: Record<string, { icon: string; color: string }> = {
  IRON: { icon: '⛏️', color: '#8B7D6B' },
  BRONZE: { icon: '🥉', color: '#CD7F32' },
  SILVER: { icon: '🥈', color: '#C0C0C0' },
  GOLD: { icon: '🥇', color: '#FFD700' },
  PLATINUM: { icon: '💠', color: '#08A88A' },
  EMERALD: { icon: '🟢', color: '#50C878' },
  DIAMOND: { icon: '💎', color: '#B9F2FF' },
  MASTER: { icon: '👑', color: '#9B59B6' },
  GRANDMASTER: { icon: '👑', color: '#E74C3C' },
  CHALLENGER: { icon: '🏆', color: '#F4C430' },
}

function formatRank(rank: RankInfo | null): string {
  if (!rank) return '无段位'
  if (rank.tier === 'MASTER' || rank.tier === 'GRANDMASTER' || rank.tier === 'CHALLENGER') {
    return `${rank.tier} ${rank.lp}LP`
  }
  return `${rank.tier} ${rank.division}`
}

function getRankDisplay(rank: RankInfo | null) {
  if (!rank) return { icon: '❓', color: '#666' }
  return TIER_DISPLAY[rank.tier] ?? { icon: '❓', color: '#666' }
}

function formatKDA(kda: number | null | undefined): string {
  if (kda == null) return '-'
  return kda.toFixed(1)
}

function formatWinRate(wr: number | null | undefined): { text: string; className: string } {
  if (wr == null) return { text: '-', className: 'text-gray-500' }
  const pct = Math.round(wr * 100)
  if (pct >= 55) return { text: `${pct}%`, className: 'text-green-400' }
  if (pct >= 50) return { text: `${pct}%`, className: 'text-yellow-400' }
  return { text: `${pct}%`, className: 'text-red-400' }
}

interface PlayerCardProps {
  player: PlayerData
  onClick?: () => void
}

export default function PlayerCard({ player, onClick }: PlayerCardProps) {
  const rankDisplay = getRankDisplay(player.rank)
  const kda = formatKDA(player.recentStats?.kda)
  const wr = formatWinRate(player.recentStats?.winRate)
  const isThreat = player.team === 'red' &&
    player.rank && ['MASTER', 'GRANDMASTER', 'CHALLENGER'].includes(player.rank.tier)

  return (
    <div
      className={`player-card ${player.team === 'blue' ? 'team-blue' : 'team-red'} ${isThreat ? 'threat' : ''} p-2.5 cursor-pointer`}
      onClick={onClick}
    >
      {/* 段位图标 + 召唤师名 */}
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className="text-sm">{rankDisplay.icon}</span>
        <span className="text-xs font-semibold text-gray-200 truncate flex-1" title={player.summonerName}>
          {player.summonerName || '未知'}
        </span>
      </div>

      {/* 段位 */}
      <div className="text-2xs mb-1.5" style={{ color: rankDisplay.color }}>
        {formatRank(player.rank)}
      </div>

      {/* 数据行 */}
      <div className="flex justify-between items-end">
        <div>
          <div className="text-2xs text-gray-500">KDA</div>
          <div className="text-sm font-bold text-gray-100">{kda}</div>
        </div>
        <div className="text-right">
          <div className="text-2xs text-gray-500">胜率</div>
          <div className={`text-sm font-bold ${wr.className}`}>{wr.text}</div>
        </div>
      </div>

      {/* 常用英雄 */}
      {player.topChampions.length > 0 && (
        <div className="flex gap-1 mt-2 pt-1.5 border-t border-white/5">
          {player.topChampions.slice(0, 3).map(champ => (
            <div key={champ.championId} className="text-2xs text-gray-500 bg-white/5 rounded px-1 py-0.5 truncate" title={champ.championName}>
              {champ.championName.slice(0, 4)}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: 提交**

```bash
cd /Users/lijia/workspaces/work/lol-assistant && git add -A && git commit -m "feat: add PlayerCard component"
```

---

### Task 12: 渲染进程 — TeamRow 和 LoadingSkeleton

**Files:**
- Create: `src/renderer/components/TeamRow.tsx`
- Create: `src/renderer/components/LoadingSkeleton.tsx`

- [ ] **Step 1: 创建 src/renderer/components/LoadingSkeleton.tsx**

```tsx
export default function LoadingSkeleton() {
  return (
    <div className="overlay-panel w-full max-w-4xl mx-auto p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="skeleton w-3 h-3 rounded-full" />
        <div className="skeleton w-16 h-3" />
      </div>
      <div className="grid grid-cols-5 gap-2 mb-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="player-card p-2.5">
            <div className="skeleton w-16 h-16 rounded-lg mx-auto mb-2" />
            <div className="skeleton w-20 h-2.5 mx-auto mb-1" />
            <div className="skeleton w-12 h-2 mx-auto" />
            <div className="flex justify-between mt-2">
              <div className="skeleton w-8 h-5" />
              <div className="skeleton w-10 h-5" />
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 mb-3">
        <div className="skeleton w-3 h-3 rounded-full" />
        <div className="skeleton w-16 h-3" />
      </div>
      <div className="grid grid-cols-5 gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={`r${i}`} className="player-card p-2.5">
            <div className="skeleton w-16 h-16 rounded-lg mx-auto mb-2" />
            <div className="skeleton w-20 h-2.5 mx-auto mb-1" />
            <div className="skeleton w-12 h-2 mx-auto" />
            <div className="flex justify-between mt-2">
              <div className="skeleton w-8 h-5" />
              <div className="skeleton w-10 h-5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: 创建 src/renderer/components/TeamRow.tsx**

```tsx
import type { PlayerData } from '../types'
import PlayerCard from './PlayerCard'

interface TeamRowProps {
  team: 'blue' | 'red'
  label: string
  players: PlayerData[]
  onPlayerClick?: (player: PlayerData) => void
}

export default function TeamRow({ team, label, players, onPlayerClick }: TeamRowProps) {
  const barColor = team === 'blue' ? 'bg-[#4da6ff]' : 'bg-[#ff4d4d]'
  const textColor = team === 'blue' ? 'text-[#4da6ff]' : 'text-[#ff4d4d]'

  return (
    <div className="mb-3">
      {/* 队伍标识 */}
      <div className="flex items-center gap-2 mb-2 px-1">
        <div className={`w-1 h-4 rounded-full ${barColor}`} />
        <span className={`text-xs font-bold ${textColor}`}>{label}</span>
      </div>

      {/* 5 人卡片网格 */}
      <div className="grid grid-cols-5 gap-2">
        {players.map(player => (
          <PlayerCard
            key={player.puuid || player.summonerName}
            player={player}
            onClick={() => onPlayerClick?.(player)}
          />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: 提交**

```bash
cd /Users/lijia/workspaces/work/lol-assistant && git add -A && git commit -m "feat: add TeamRow and LoadingSkeleton components"
```

---

### Task 13: 渲染进程 — OverlayPanel 主面板

**Files:**
- Create: `src/renderer/components/OverlayPanel.tsx`

- [ ] **Step 1: 创建 src/renderer/components/OverlayPanel.tsx**

```tsx
import type { PlayerData, GameSession } from '../types'
import TeamRow from './TeamRow'
import LoadingSkeleton from './LoadingSkeleton'

interface OverlayPanelProps {
  session: GameSession | null
  loading: boolean
  onPlayerClick?: (player: PlayerData) => void
}

const PHASE_LABELS: Record<string, string> = {
  None: '等待游戏...',
  Lobby: '在大厅',
  Matchmaking: '匹配中...',
  ReadyCheck: '准备确认',
  ChampSelect: '英雄选择',
  GameStart: '游戏开始',
  InProgress: '游戏中',
  EndOfGame: '游戏结束',
}

export default function OverlayPanel({ session, loading, onPlayerClick }: OverlayPanelProps) {
  // 加载中
  if (loading) return <LoadingSkeleton />

  // 没有数据
  if (!session || session.players.length === 0) {
    return (
      <div className="overlay-panel w-full max-w-4xl mx-auto p-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
          <span className="text-sm text-gray-400">
            {session ? PHASE_LABELS[session.phase] ?? session.phase : '等待 LOL 客户端连接...'}
          </span>
        </div>
        <p className="text-xs text-gray-600 mt-2">Ctrl+Tab 切换显示</p>
      </div>
    )
  }

  // 有玩家数据
  const bluePlayers = session.players.filter(p => p.team === 'blue')
  const redPlayers = session.players.filter(p => p.team === 'red')

  return (
    <div className="overlay-panel w-full max-w-4xl mx-auto p-4">
      {/* 头部 */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400" style={{ boxShadow: '0 0 6px #4ade80' }} />
          <span className="text-xs font-semibold text-gray-300">
            {PHASE_LABELS[session.phase] ?? session.phase} · {session.gameMode}
          </span>
        </div>
        <span className="text-2xs text-gray-600">Ctrl+Tab 隐藏</span>
      </div>

      {/* 蓝方 */}
      <TeamRow team="blue" label="蓝方 · 我方" players={bluePlayers} onPlayerClick={onPlayerClick} />

      {/* 红方 */}
      <TeamRow team="red" label="红方 · 敌方" players={redPlayers} onPlayerClick={onPlayerClick} />

      {/* 底部 */}
      <div className="flex justify-between px-1 pt-1 border-t border-white/5">
        <span className="text-2xs text-gray-600">
          {session.players.some(p => p.recentStats) ? '数据来源: LCU + Riot API' : '数据来源: LCU (需配置 Riot API Key 获取详细战绩)'}
        </span>
        <span className="text-2xs text-gray-600">点击玩家查看详情 →</span>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: 提交**

```bash
cd /Users/lijia/workspaces/work/lol-assistant && git add -A && git commit -m "feat: add OverlayPanel main component"
```

---

### Task 14: 渲染进程 — DetailPanel 详情面板

**Files:**
- Create: `src/renderer/components/DetailPanel.tsx`

- [ ] **Step 1: 创建 src/renderer/components/DetailPanel.tsx**

```tsx
import type { PlayerData, RankInfo } from '../types'

interface DetailPanelProps {
  player: PlayerData
  onClose: () => void
}

function formatRankFull(rank: RankInfo | null): string {
  if (!rank) return '暂无段位数据'
  if (rank.tier === 'MASTER' || rank.tier === 'GRANDMASTER' || rank.tier === 'CHALLENGER') {
    return `${rank.tier} · ${rank.lp} LP`
  }
  return `${rank.tier} ${rank.division} · ${rank.lp} LP`
}

export default function DetailPanel({ player, onClose }: DetailPanelProps) {
  const teamColor = player.team === 'blue' ? 'border-[#4da6ff]' : 'border-[#ff4d4d]'
  const teamLabel = player.team === 'blue' ? '蓝方' : '红方'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className={`overlay-panel w-80 p-5 border-l-2 ${teamColor}`}>
        {/* 头部 */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-gray-100">{player.summonerName}</h3>
            <p className="text-2xs text-gray-500">{teamLabel}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-300 text-lg leading-none px-1"
          >
            ✕
          </button>
        </div>

        {/* 段位 */}
        <div className="mb-3">
          <div className="text-2xs text-gray-500 mb-0.5">段位</div>
          <div className="text-sm font-semibold text-gray-200">
            {formatRankFull(player.rank)}
          </div>
        </div>

        {/* KDA & 胜率 */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <div className="text-2xs text-gray-500 mb-0.5">KDA (近{player.recentStats?.gamesPlayed ?? '?'}场)</div>
            <div className="text-lg font-bold text-gray-100">
              {player.recentStats ? player.recentStats.kda.toFixed(1) : '-'}
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xs text-gray-500 mb-0.5">胜率</div>
            <div className={`text-lg font-bold ${
              player.recentStats
                ? player.recentStats.winRate >= 0.5 ? 'text-green-400' : 'text-red-400'
                : 'text-gray-500'
            }`}>
              {player.recentStats ? `${Math.round(player.recentStats.winRate * 100)}%` : '-'}
            </div>
          </div>
        </div>

        {/* 常用英雄 */}
        <div>
          <div className="text-2xs text-gray-500 mb-1.5">常用英雄</div>
          {player.topChampions.length === 0 ? (
            <span className="text-xs text-gray-600">暂无数据（需配置 Riot API Key）</span>
          ) : (
            <div className="space-y-1">
              {player.topChampions.map((champ, i) => (
                <div key={champ.championId} className="flex justify-between text-xs">
                  <span className="text-gray-300">#{i + 1} {champ.championName}</span>
                  <span className="text-gray-500">{Math.floor(champ.masteryPoints / 1000)}k</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: 提交**

```bash
cd /Users/lijia/workspaces/work/lol-assistant && git add -A && git commit -m "feat: add DetailPanel component"
```

---

### Task 15: 渲染进程 — SettingsPage 设置页面

**Files:**
- Create: `src/renderer/components/SettingsPage.tsx`

- [ ] **Step 1: 创建 src/renderer/components/SettingsPage.tsx**

```tsx
import { useState, useEffect } from 'react'
import type { AppSettings } from '../types'

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>({
    riotApiKey: '',
    hotkey: 'Ctrl+Tab',
    autoShow: true,
    opacity: 0.85
  })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    window.electronAPI.getSettings().then(s => { if (s) setSettings(s) })
  }, [])

  async function handleSave() {
    await window.electronAPI.saveSettings(settings)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="overlay-panel w-full max-w-md mx-auto p-6">
      <h2 className="text-base font-bold text-gray-100 mb-4">设置</h2>

      {/* Riot API Key */}
      <div className="mb-4">
        <label className="text-xs text-gray-400 block mb-1">Riot Games API Key</label>
        <input
          type="password"
          value={settings.riotApiKey}
          onChange={e => setSettings({ ...settings, riotApiKey: e.target.value })}
          placeholder="RGAPI-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
          className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-400"
        />
        <p className="text-2xs text-gray-600 mt-1">
          <a href="https://developer.riotgames.com" className="text-blue-400 hover:underline" target="_blank">
            申请地址 developer.riotgames.com
          </a>
          · 免费 Key 24 小时有效
        </p>
      </div>

      {/* 快捷键 */}
      <div className="mb-4">
        <label className="text-xs text-gray-400 block mb-1">快捷键</label>
        <input
          value={settings.hotkey}
          onChange={e => setSettings({ ...settings, hotkey: e.target.value })}
          className="w-32 bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-400"
        />
      </div>

      {/* 自动显示 */}
      <div className="mb-4 flex items-center justify-between">
        <label className="text-xs text-gray-400">进入游戏自动显示覆盖层</label>
        <button
          onClick={() => setSettings({ ...settings, autoShow: !settings.autoShow })}
          className={`w-10 h-5 rounded-full transition-colors ${settings.autoShow ? 'bg-blue-500' : 'bg-white/10'}`}
        >
          <div className={`w-4 h-4 rounded-full bg-white transition-transform mx-0.5 ${settings.autoShow ? 'translate-x-5' : ''}`} />
        </button>
      </div>

      {/* 透明度 */}
      <div className="mb-4">
        <label className="text-xs text-gray-400 block mb-1">透明度: {Math.round(settings.opacity * 100)}%</label>
        <input
          type="range"
          min="40"
          max="100"
          value={Math.round(settings.opacity * 100)}
          onChange={e => setSettings({ ...settings, opacity: parseInt(e.target.value) / 100 })}
          className="w-full accent-blue-500"
        />
      </div>

      {/* 保存按钮 */}
      <button
        onClick={handleSave}
        className="w-full bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded-lg py-2 transition-colors"
      >
        {saved ? '✓ 已保存' : '保存设置'}
      </button>

      <button
        onClick={() => window.electronAPI.toggleOverlay()}
        className="w-full mt-2 bg-white/5 hover:bg-white/10 text-gray-400 text-sm rounded-lg py-2 transition-colors"
      >
        返回覆盖层
      </button>
    </div>
  )
}
```

- [ ] **Step 2: 提交**

```bash
cd /Users/lijia/workspaces/work/lol-assistant && git add -A && git commit -m "feat: add SettingsPage component"
```

---

### Task 16: 渲染进程 — App 根组件集成

**Files:**
- Modify: `src/renderer/App.tsx`

- [ ] **Step 1: 重写 src/renderer/App.tsx — 集成所有组件**

```tsx
import { useState, useEffect, useCallback } from 'react'
import type { GameSession, PlayerData } from './types'
import OverlayPanel from './components/OverlayPanel'
import DetailPanel from './components/DetailPanel'
import SettingsPage from './components/SettingsPage'

type View = 'overlay' | 'settings'

export default function App() {
  const [session, setSession] = useState<GameSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerData | null>(null)
  const [view, setView] = useState<View>('overlay')

  // 监听游戏状态
  useEffect(() => {
    const api = window.electronAPI
    if (!api) return

    // 初始加载
    api.getGameState().then(s => {
      setSession(s)
      setLoading(false)
    })

    // 监听变化
    api.onGameStateChange((s: GameSession) => {
      setSession(s)
      setLoading(false)
    })

    // 监听导航（从托盘菜单触发）
    const navHandler = (_event: any, target: string) => {
      if (target === '/settings') setView('settings')
    }
    // 通过 preload 的 onXxx pattern 无法直接监听 webContents.send
    // 改用 ipcRenderer.on 在 preload 中处理
    // 此处简化处理：覆盖层上点击设置按钮切换 view
  }, [])

  const handlePlayerClick = useCallback((player: PlayerData) => {
    setSelectedPlayer(player)
  }, [])

  const handleCloseDetail = useCallback(() => {
    setSelectedPlayer(null)
  }, [])

  // 设置页面
  if (view === 'settings') {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center p-4">
        <SettingsPage />
      </div>
    )
  }

  // 覆盖层
  return (
    <div className="min-h-screen bg-transparent flex items-start justify-center pt-8">
      <OverlayPanel
        session={session}
        loading={loading}
        onPlayerClick={handlePlayerClick}
      />

      {/* 设置按钮 */}
      <button
        onClick={() => setView('settings')}
        className="fixed bottom-3 right-3 text-2xs text-gray-600 hover:text-gray-400 bg-white/5 hover:bg-white/10 rounded px-2 py-1 transition-colors"
        title="设置"
      >
        ⚙
      </button>

      {/* 玩家详情弹窗 */}
      {selectedPlayer && (
        <DetailPanel player={selectedPlayer} onClose={handleCloseDetail} />
      )}
    </div>
  )
}
```

- [ ] **Step 2: 提交**

```bash
cd /Users/lijia/workspaces/work/lol-assistant && git add -A && git commit -m "feat: integrate App root component with all sub-components"
```

---

### Task 17: 集成测试 & 构建验证

**Files:**
- 无新建文件

- [ ] **Step 1: TypeScript 全量编译检查**

```bash
cd /Users/lijia/workspaces/work/lol-assistant && npx tsc --project tsconfig.node.json --noEmit && npx tsc --project tsconfig.web.json --noEmit
```

Expected: 两命令均无错误输出

- [ ] **Step 2: electron-vite 构建**

```bash
cd /Users/lijia/workspaces/work/lol-assistant && npm run build
```

Expected: 构建成功，输出至 `out/` 目录，无报错

- [ ] **Step 3: 构建产物完整性检查**

```bash
ls /Users/lijia/workspaces/work/lol-assistant/out/main/index.js
ls /Users/lijia/workspaces/work/lol-assistant/out/preload/index.js
ls /Users/lijia/workspaces/work/lol-assistant/out/renderer/index.html
```

Expected: 三个文件均存在

- [ ] **Step 4: 提交**

```bash
cd /Users/lijia/workspaces/work/lol-assistant && git add -A && git commit -m "chore: verify TypeScript compilation and production build"
```

---

### Task 18: 补充 — Champion Name 映射（Data Dragon）

**Files:**
- Create: `src/main/champion-data.ts`

注意：当前 Riot API 返回的是 championId (数字)，需要映射为中文英雄名。通过 Data Dragon 获取映射表。

- [ ] **Step 1: 创建 src/main/champion-data.ts**

```typescript
interface ChampionMap {
  [id: string]: string  // championId(string) → championName
}

let championMap: ChampionMap | null = null

/** 从 Data Dragon 获取英雄名称映射（内置缓存） */
export async function getChampionNames(): Promise<ChampionMap> {
  if (championMap) return championMap

  try {
    // Data Dragon 最新版本
    const versionsResp = await fetch('https://ddragon.leagueoflegends.com/api/versions.json')
    const versions: string[] = await versionsResp.json()
    const latest = versions[0]

    const champsResp = await fetch(
      `https://ddragon.leagueoflegends.com/cdn/${latest}/data/zh_CN/champion.json`
    )
    const champsData = await champsResp.json()

    championMap = {}
    for (const champ of Object.values<any>(champsData.data)) {
      championMap[String(champ.key)] = champ.name
    }

    return championMap
  } catch {
    // 离线回退：硬编码常用英雄映射
    championMap = FALLBACK_CHAMPION_MAP
    return championMap
  }
}

/** 硬编码回退映射（TOP 50 英雄） */
const FALLBACK_CHAMPION_MAP: ChampionMap = {
  '1': '黑暗之女', '4': '虚空恐惧', '7': '诡术妖姬', '11': '无极剑圣',
  '18': '麦林炮手', '22': '寒冰射手', '24': '武器大师', '25': '堕落天使',
  '37': '琴瑟仙女', '39': '刀锋舞者', '40': '风暴之怒', '41': '海洋之灾',
  '51': '瘟疫之源', '53': '蒸汽机器人', '55': '不祥之刃', '57': '茂凯',
  '63': '复仇焰魂', '64': '盲僧', '67': '暗夜猎手', '81': '探险家',
  '86': '德玛西亚之力', '89': '曙光女神', '92': '放逐之刃', '96': '深渊巨口',
  '103': '九尾妖狐', '104': '法外狂徒', '105': '潮汐海灵', '114': '无双剑姬',
  '117': '天启者', '119': '寒冰女王', '122': '诺克萨斯之手', '131': '皎月女神',
  '141': '影流之主', '142': '暮光星灵', '145': '逆羽', '147': '生化魔人',
  '150': '迷失之牙', '154': '生化领主', '157': '疾风剑豪', '202': '戏命师',
  '203': '暴走萝莉', '222': '复仇之矛', '223': '河流之王', '235': '涤魂圣枪',
  '236': '圣枪游侠', '238': '影哨', '240': '狂暴之心', '245': '时间刺客',
  '266': '暗裔剑魔', '267': '唤潮鲛姬', '350': '魔法猫咪', '360': '荒漠屠夫',
  '412': '魂锁典狱长', '421': '虚空掠夺者', '427': '盲僧', '429': '复仇之矛',
  '432': '星界游神', '497': '生化魔人', '498': '圣枪游侠', '516': '未来守护者',
  '517': '蜘蛛女皇', '518': '海兽祭司', '523': '麦林炮手', '526': '熔岩巨兽',
  '555': '沙漠死神', '777': '疾风剑豪', '875': '万花通灵', '876': '河流之王',
  '887': '残月之肃',
}
```

- [ ] **Step 2: 在 data-aggregator.ts 中集成 champion name 映射**

修改 `data-aggregator.ts` 的 `fetchAndAggregate` 方法中的聚合逻辑，加入 champion name 查询：

在 `import` 中添加：
```typescript
import { getChampionNames } from './champion-data'
```

在聚合 `players` 之前插入：
```typescript
// 获取英雄名称映射
const championNames = await getChampionNames()
```

然后修改 `players` 聚合代码中 `championName` 的赋值：
```typescript
championName: lp.championId ? championNames[String(lp.championId)] ?? null : null,
```

同样处理 `topChampions` 中的 `championName`（当前 RiotClient 返回 championId 字符串，需要转）：
```typescript
// 在 map enriched data 时转换
topChampions: enriched.topChampions.map(c => ({
  ...c,
  championName: championNames[String(c.championId)] ?? `英雄${c.championId}`
}))
```

- [ ] **Step 3: 验证 TypeScript 编译**

```bash
cd /Users/lijia/workspaces/work/lol-assistant && npx tsc --project tsconfig.node.json --noEmit
```

Expected: 无错误

- [ ] **Step 4: 提交**

```bash
cd /Users/lijia/workspaces/work/lol-assistant && git add -A && git commit -m "feat: add champion name mapping via Data Dragon"
```

---

## 实现顺序

按 Task 1 → Task 18 顺序执行（依赖关系：类型定义需在组件之前，主进程模块需在入口集成之前）。

关键里程碑：
- Task 1-2：项目可启动，类型就绪
- Task 3-9：主进程核心逻辑完整（LCU 连接 + Riot API + 窗口管理）
- Task 10-16：渲染进程 UI 完整（覆盖层 + 卡片 + 详情 + 设置）
- Task 17-18：构建验证 + 英雄名映射

## 未覆盖的后续优化

以下内容在 v1.0 后迭代：
- 英雄头像图标（通过 Data Dragon CDN 加载）
- 段位图标图片（而非目前 emoji 占位）
- Riot API 国服适配（腾讯服务器 API 域名不同）
- 操作系统级游戏窗口检测（自动调整覆盖层位置）
- 右键托盘菜单「退出」实际退出应用
- 覆盖层窗口拖拽移动
- 国际化（英文/韩文等）
- 自动更新（electron-updater）
- macOS 打包签名公证
```

The plan is quite large. Let me do a self-review first before presenting it.

Actually, I realize the plan is too large to put in a single Write call effectively. Let me check if I missed anything and then proceed.

Looking at the plan structure:
1. Project scaffold ✅
2. Types ✅
3. LCU connector ✅
4. Riot client ✅
5. Data aggregator ✅
6. Window manager ✅
7. Shortcut ✅
8. IPC handlers ✅
9. Main entry ✅
10. Styles + type declarations ✅
11. PlayerCard ✅
12. TeamRow + LoadingSkeleton ✅
13. OverlayPanel ✅
14. DetailPanel ✅
15. SettingsPage ✅
16. App integration ✅
17. Build verification ✅
18. Champion data ✅

Self-review:
1. Spec coverage: All MVP features covered - overlay window, player panel, LCU connector, Riot client, cache, settings
2. Placeholder scan: Let me check... I see some issues:
   - Task 9 Step 1 has a remnant "等等" comment that should be removed
   - Task 18 Step 2 mentions modifying code but doesn't show the full modified file
   - Task 8 Step 3 mentions updating but also doesn't show the full file

Actually wait, the file I wrote has some issues. Let me fix them before presenting. The main issues:
1. Task 9 Step 1 has the "等等" note in the code block - that should be cleaned up
2. The plan is already written to the file, so let me fix these inline.

Let me edit the plan file to fix these issues.<｜end▁of▁thinking｜>

<｜｜DSML｜｜tool_calls>
<｜｜DSML｜｜invoke name="TodoWrite">
<｜｜DSML｜｜parameter name="todos" string="false">[{"activeForm":"Writing plan file structure","content":"Define file structure before task decomposition","status":"completed"},{"activeForm":"Writing implementation tasks","content":"Write bite-sized implementation tasks (each 2-5 min)","status":"completed"},{"activeForm":"Self-reviewing plan","content":"Self-review: spec coverage, placeholders, type consistency","status":"in_progress"},{"activeForm":"Offering execution approach","content":"Offer execution choice to user","status":"pending"}]
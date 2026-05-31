# LOL Assistant — 英雄联盟战绩覆盖层工具

## 概述

一个 Electron 桌面应用，以半透明覆盖层形式悬浮在英雄联盟游戏界面上，按快捷键呼出/隐藏。在对局中可实时查看 10 名玩家的段位、KDA、胜率、常用英雄等数据，类似 WeGame 的 TAB 面板功能。

## 技术选型

| 层级 | 技术 | 说明 |
|------|------|------|
| 桌面框架 | Electron | 支持透明窗口、置顶、全局快捷键 |
| 前端框架 | React + TypeScript | 组件化开发，生态丰富 |
| 样式 | Tailwind CSS | 快速构建暗黑风格 UI |
| 打包构建 | Vite + electron-builder | 快速 HMR + 跨平台打包 |
| 本地数据 | LCU API (社区逆向) | 获取实时对局/选人数据 |
| 云端数据 | Riot Games API | 历史战绩/段位/胜率/常用英雄 |

## 架构设计

```
┌─────────────────────────────────────────────┐
│  渲染进程 (Renderer)                          │
│  ┌──────────┐  ┌──────────┐  ┌────────────┐ │
│  │ 覆盖层 UI │  │ 详情面板  │  │ 设置页面   │ │
│  │ (透明窗口)│  │ (展开卡片)│  │ (API Key等)│ │
│  └──────────┘  └──────────┘  └────────────┘ │
│         ↕ IPC 通信                            │
│  ┌──────────────────────────────────────────┐│
│  │ 主进程 (Main Process)                      ││
│  │ ┌──────────┐ ┌──────────┐ ┌────────────┐ ││
│  │ │LCU       │ │Riot API  │ │窗口管理器   │ ││
│  │ │Connector │ │Client    │ │(透明/置顶)  │ ││
│  │ └──────────┘ └──────────┘ └────────────┘ ││
│  └──────────────────────────────────────────┘│
└─────────────────────────────────────────────┘
         │                    │
    🎮 LOL 客户端        ☁️ Riot API
    (localhost)       (api.riotgames.com)
```

## 数据流

```
1. 游戏客户端启动 → LCU Connector 通过进程扫描发现 LCU 端口和密码
2. LCU WebSocket 推送游戏状态变化 → 主进程收到事件
3. 当状态变为 "ChampSelect"(选人) 或 "InProgress"(游戏中)
   → 通过 LCU API 获取 10 名玩家 PUUID
   → 对每个 PUUID 调用 Riot API 拉取：
     - 当前段位 (RANKED_SOLO_5x5)
     - 最近 20 场排位战绩 (KDA / 胜率)
     - 常用英雄 TOP 3
4. 主进程聚合数据，通过 IPC 推送给渲染进程
5. 渲染进程更新覆盖层 UI
```

## LCU API 关键端点

LCU (League Client Update) 是 LOL 客户端的本地服务，运行在 `https://127.0.0.1:<随机端口>`，使用自签名证书。

连接方式：通过进程名 `LeagueClientUx.exe` (Windows) / `LeagueClientUx` (macOS) 找到启动参数中的 `--remoting-auth-token` 和 `--app-port`。

```
GET  /lol-gameflow/v1/session         → 当前游戏阶段
GET  /lol-champ-select/v1/session     → 选人阶段 10 人信息
GET  /lol-summoner/v1/current-summoner → 当前召唤师信息
GET  /lol-gameflow/v1/gameflow-phase   → 游戏阶段变化 (WebSocket 订阅)
```

## Riot API 关键端点

需要用户自行申请 Riot Developer API Key（免费，24 小时有效期，可续）。

```
GET  /lol/summoner/v4/summoners/by-puuid/{puuid}     → 召唤师信息
GET  /lol/league/v4/entries/by-summoner/{summonerId} → 段位信息
GET  /lol/match/v5/matches/by-puuid/{puuid}/ids      → 对局 ID 列表
GET  /lol/match/v5/matches/{matchId}                 → 对局详情
GET  /lol/champion-mastery/v4/champion-masteries/by-puuid/{puuid} → 英雄熟练度
```

## MVP 功能范围（v1.0.0）

### 第一优先级

1. **覆盖层透明窗口**
   - 无边框、置顶、半透明深色背景
   - 鼠标穿透（面板区域外点击穿透到游戏）
   - 全局快捷键 `Ctrl+Tab` 呼出/隐藏
   - 进入游戏时自动弹出，退出游戏时自动隐藏

2. **实时玩家面板**
   - 蓝方 5 人 + 红方 5 人卡片布局
   - 每人显示：召唤师名、段位图标、KDA 比率、近期胜率、常用英雄 TOP 3
   - 敌方数据标注为红色，我方蓝色
   - 选人阶段即可显示（提前查阵容）
   - 数据加载中显示骨架屏 / Loading

3. **LCU API 连接器**
   - 自动发现本地 LOL 客户端（进程扫描）
   - 自动管理认证（auth token）
   - WebSocket 监听游戏阶段变化
   - 连接断开自动重连

4. **Riot API 客户端**
   - 用户配置 API Key（设置页面）
   - 批量 PUUID 查询（10 人并发，但控制速率）
   - 本地缓存（同一天内相同 PUUID 不重复请求）
   - 优雅降级：API 不可用时仅显示 LCU 数据

### 第二优先级（v1.1）

- 点击玩家卡片展开详细面板（最近 10 场对局详情）
- 敌方高威胁标记（大师以上段位、胜率 > 60% 高亮）
- 队伍实力对比摘要（平均段位、胜率对比）

### 明确不做（v1.0）

- 自动符文/出装推荐
- 英雄对位 Counter 提示
- 游戏内截屏/录像
- 聊天/社交功能

## 项目结构

```
lol-assistant/
├── package.json
├── vite.config.ts
├── electron-builder.yml
├── tsconfig.json
├── tailwind.config.ts
├── src/
│   ├── main/                        # Electron 主进程
│   │   ├── index.ts                 # 主进程入口
│   │   ├── window-manager.ts        # 透明窗口创建/管理
│   │   ├── shortcut.ts              # 全局快捷键
│   │   ├── lcu-connector.ts         # LCU 连接器
│   │   ├── riot-client.ts           # Riot API 客户端
│   │   ├── data-aggregator.ts       # 数据聚合层
│   │   └── ipc-handlers.ts          # IPC 通信处理
│   └── renderer/                    # 渲染进程 (React)
│       ├── index.html
│       ├── main.tsx                 # React 入口
│       ├── App.tsx
│       ├── components/
│       │   ├── OverlayPanel.tsx     # 覆盖层主面板
│       │   ├── PlayerCard.tsx       # 玩家信息卡片
│       │   ├── TeamRow.tsx          # 队伍行（蓝方/红方）
│       │   ├── DetailPanel.tsx      # 玩家详情展开面板
│       │   ├── LoadingSkeleton.tsx  # 加载骨架屏
│       │   └── SettingsPage.tsx     # 设置页面
│       ├── hooks/
│       │   ├── useGameState.ts      # 游戏状态 hook
│       │   └── usePlayerData.ts     # 玩家数据 hook
│       ├── types/
│       │   └── index.ts             # TypeScript 类型定义
│       └── styles/
│           └── index.css            # 全局样式 + Tailwind
└── assets/
    └── icons/                       # 应用图标
```

## 关键类型定义

```typescript
// 游戏阶段
type GamePhase = 'None' | 'Lobby' | 'Matchmaking' | 'ReadyCheck'
               | 'ChampSelect' | 'GameStart' | 'InProgress' | 'EndOfGame';

// 玩家数据
interface PlayerData {
  puuid: string;
  summonerName: string;
  team: 'blue' | 'red';
  championId?: number;          // 选人阶段可能为空
  rank: {
    tier: string;                // DIAMOND, MASTER, etc.
    division: string;            // I, II, III, IV
    lp: number;
  } | null;
  recentStats: {
    kda: number;                 // KDA 比率 (K+A)/D
    winRate: number;             // 近期胜率 0-1
    gamesPlayed: number;         // 统计场次
  } | null;
  topChampions: Array<{
    championId: number;
    mastery: number;             // 熟练度点数
  }>;
}

// 游戏会话
interface GameSession {
  phase: GamePhase;
  gameMode: string;              // CLASSIC, ARAM, etc.
  mapId: number;                 // 11 = Summoner's Rift
  players: PlayerData[];
  lastUpdated: number;
}
```

## 窗口行为

| 事件 | 行为 |
|------|------|
| 应用启动 | 最小化到托盘，不显示窗口 |
| LOL 客户端启动 | 自动检测并连接 LCU |
| 进入选人/游戏 | 自动弹出覆盖层 |
| Ctrl+Tab | 手动切换覆盖层显示/隐藏 |
| 游戏结束 | 覆盖层自动隐藏，保留到下一局 |
| 关闭覆盖层 | 退回托盘，不退出应用 |
| 应用退出 | 托盘右键 → 退出 |

## 注意事项

- **LCU API 稳定性**：依赖社区逆向维护，Riot 更新可能破坏兼容性。接入 `lcu-connector` 等社区 npm 包降低维护成本。
- **Riot API Key**：需要用户自行申请，应用内提供申请指引链接。24 小时过期需续期。
- **性能**：10 人并发 Riot API 请求需控制速率（Riot 限制 20 req/s，100 req/2min），MVP 使用本地缓存减少重复请求。
- **安全**：LCU auth token 仅存储在本地，不上传任何服务器。应用完全离线运行，无遥测。
- **macOS 兼容**：覆盖层在 macOS 上需要 `kiosk` 或 `fullscreen` 窗口模式 + `setIgnoreMouseEvents` 实现穿透。主要测试环境为 macOS（当前开发机）。

## 参考项目

- [lcu-connector](https://github.com/Pupix/lcu-connector) — Node.js LCU API 连接库
- [hextech-sjwt](https://github.com/Maciej5099/hextech-sjwt) — LCU 认证 Token 处理
- [Blitz.gg](https://blitz.gg) — 参考竞品（Electron + React）
- [Porofessor](https://porofessor.gg) — 参考竞品

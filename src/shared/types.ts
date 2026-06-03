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

/** 单场对局记录 */
export interface RecentMatch {
  matchId: string
  timestamp: number       // Unix ms
  duration: number        // 游戏时长秒
  win: boolean
  championId: number
  championName: string
  kills: number
  deaths: number
  assists: number
  cs: number              // 补兵
  csPerMinute: number
  gameMode: string        // '排位赛' | '匹配赛' | '大乱斗'
  lane: string            // '上单' | '打野' | '中单' | 'ADC' | '辅助'
  kp: number              // 参团率 0-100
}

/** 单个玩家完整数据 */
export interface PlayerData {
  puuid: string
  summonerName: string
  summonerId: string
  team: 'blue' | 'red'
  championId: number | null
  championName: string | null
  rank: RankInfo | null
  recentStats: RecentStats | null
  topChampions: TopChampion[]
  recentMatches: RecentMatch[]  // 最近 5 场对局
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
  host: string
  token: string
  connected: boolean
}

/** 应用设置 */
export interface AppSettings {
  riotApiKey: string
  hotkey: string
  autoShow: boolean
  opacity: number
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

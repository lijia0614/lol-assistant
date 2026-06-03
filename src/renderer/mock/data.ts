import type { GameSession, PlayerData, AppSettings, RecentMatch } from '../types'

const championPool = [
  { id: 157, name: '疾风剑豪' },
  { id: 64, name: '盲僧' },
  { id: 222, name: '暴走萝莉' },
  { id: 103, name: '九尾妖狐' },
  { id: 11, name: '无极剑圣' },
  { id: 81, name: '探险家' },
  { id: 86, name: '德玛西亚之力' },
  { id: 55, name: '不祥之刃' },
  { id: 22, name: '寒冰射手' },
  { id: 67, name: '暗夜猎手' },
  { id: 141, name: '影流之主' },
  { id: 122, name: '诺克萨斯之手' },
  { id: 114, name: '无双剑姬' },
  { id: 236, name: '圣枪游侠' },
  { id: 412, name: '魂锁典狱长' },
  { id: 89, name: '曙光女神' },
  { id: 350, name: '魔法猫咪' },
  { id: 266, name: '暗裔剑魔' },
  { id: 63, name: '复仇焰魂' },
  { id: 37, name: '琴瑟仙女' },
]

const lanes = ['上单', '打野', '中单', 'ADC', '辅助']
const laneMap: Record<number, string> = {
  157: '中单', 64: '打野', 222: 'ADC', 103: '中单', 11: '打野',
  81: 'ADC', 86: '上单', 55: '中单', 22: 'ADC', 67: 'ADC',
  141: '中单', 122: '上单', 114: '上单', 236: 'ADC', 412: '辅助',
  89: '辅助', 350: '辅助', 266: '上单', 63: '中单', 37: '辅助',
}

/** 为玩家生成最近 5 场对局记录 */
function generateRecentMatches(playerName: string, winRate: number): RecentMatch[] {
  const matches: RecentMatch[] = []
  const now = Date.now()

  for (let i = 0; i < 5; i++) {
    const champ = championPool[Math.floor(Math.random() * championPool.length)]
    const win = Math.random() < winRate
    const kills = Math.floor(Math.random() * 15) + (win ? 2 : 0)
    const deaths = Math.floor(Math.random() * 8) + 1
    const assists = Math.floor(Math.random() * 15) + (win ? 3 : 0)
    const duration = Math.floor(Math.random() * 1200) + 1500 // 25-45 min
    const cs = Math.floor(Math.random() * 150) + 100 + (win ? 30 : 0)

    matches.push({
      matchId: `${playerName.slice(0, 4)}-match-${i}`,
      timestamp: now - (i * 4 + Math.floor(Math.random() * 4)) * 3600_000, // 每 4-8h 一场
      duration,
      win,
      championId: champ.id,
      championName: champ.name,
      kills,
      deaths,
      assists,
      cs,
      csPerMinute: Math.round((cs / (duration / 60)) * 10) / 10,
      gameMode: Math.random() > 0.2 ? '排位赛' : '匹配赛',
      lane: laneMap[champ.id] ?? lanes[Math.floor(Math.random() * lanes.length)],
      kp: Math.floor(Math.random() * 40) + 30, // 30-70% 参团率
    })
  }

  return matches
}

/** 生成一个玩家模拟数据 */
function makePlayer(
  overrides: Partial<PlayerData> & { puuid: string; team: 'blue' | 'red' }
): PlayerData {
  const tiers = ['IRON', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'EMERALD', 'DIAMOND', 'MASTER', 'GRANDMASTER', 'CHALLENGER']
  const divisions = ['I', 'II', 'III', 'IV']

  const tierIdx = Math.floor(Math.random() * tiers.length)
  const tier = tiers[tierIdx]
  const division = tierIdx < 7 ? divisions[Math.floor(Math.random() * divisions.length)] : 'I'
  const gamesPlayed = Math.floor(Math.random() * 20) + 1
  const wins = Math.floor(Math.random() * gamesPlayed)
  const kills = Math.floor(Math.random() * 15) + 1
  const deaths = Math.floor(Math.random() * 10) + 1
  const assists = Math.floor(Math.random() * 15) + 1
  const kda = deaths === 0 ? kills + assists : Math.round(((kills + assists) / deaths) * 10) / 10
  const winRate = Math.round((wins / gamesPlayed) * 100) / 100

  const topChamps = [...championPool]
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
    .map(c => ({
      championId: c.id,
      championName: c.name,
      masteryPoints: Math.floor(Math.random() * 500000) + 10000
    }))

  const champ = overrides.championId
    ? championPool.find(c => c.id === overrides.championId) ?? championPool[Math.floor(Math.random() * championPool.length)]
    : championPool[Math.floor(Math.random() * championPool.length)]

  const name = overrides.summonerName ?? `玩家_${overrides.puuid.slice(0, 6)}`

  return {
    puuid: overrides.puuid,
    summonerName: name,
    summonerId: overrides.summonerId ?? `summoner-${overrides.puuid.slice(0, 8)}`,
    team: overrides.team,
    championId: overrides.championId ?? champ.id,
    championName: overrides.championName ?? champ.name,
    rank: overrides.rank ?? { tier, division, lp: Math.floor(Math.random() * 100) },
    recentStats: overrides.recentStats ?? { kda, winRate, gamesPlayed },
    topChampions: overrides.topChampions ?? topChamps,
    recentMatches: overrides.recentMatches ?? generateRecentMatches(name, winRate),
  }
}

/** 游戏中的场景 — 10 个玩家，我方+敌方 */
export const IN_PROGRESS_SESSION: GameSession = {
  phase: 'InProgress',
  gameMode: 'CLASSIC',
  mapId: 11,
  lastUpdated: Date.now(),
  players: [
    // 蓝方（我方）
    makePlayer({ puuid: 'blue-01', team: 'blue', summonerName: 'Uzi Forever', championId: 222, rank: { tier: 'DIAMOND', division: 'II', lp: 75 }, recentStats: { kda: 4.2, winRate: 0.62, gamesPlayed: 20 } }),
    makePlayer({ puuid: 'blue-02', team: 'blue', summonerName: '中路杀神', championId: 103, rank: { tier: 'MASTER', division: 'I', lp: 120 }, recentStats: { kda: 3.8, winRate: 0.58, gamesPlayed: 20 } }),
    makePlayer({ puuid: 'blue-03', team: 'blue', summonerName: '野区之王', championId: 64, rank: { tier: 'EMERALD', division: 'III', lp: 45 }, recentStats: { kda: 2.9, winRate: 0.51, gamesPlayed: 15 } }),
    makePlayer({ puuid: 'blue-04', team: 'blue', summonerName: '上单霸主', championId: 122, rank: { tier: 'PLATINUM', division: 'I', lp: 88 }, recentStats: { kda: 2.1, winRate: 0.47, gamesPlayed: 18 } }),
    makePlayer({ puuid: 'blue-05', team: 'blue', summonerName: '辅助大腿', championId: 412, rank: { tier: 'GOLD', division: 'IV', lp: 22 }, recentStats: { kda: 5.5, winRate: 0.68, gamesPlayed: 20 } }),
    // 红方（敌方）
    makePlayer({ puuid: 'red-01', team: 'red', summonerName: 'Faker Jr', championId: 157, rank: { tier: 'CHALLENGER', division: 'I', lp: 850 }, recentStats: { kda: 5.1, winRate: 0.72, gamesPlayed: 20 } }),
    makePlayer({ puuid: 'red-02', team: 'red', summonerName: 'T1 Gumayusi', championId: 236, rank: { tier: 'GRANDMASTER', division: 'I', lp: 500 }, recentStats: { kda: 4.8, winRate: 0.65, gamesPlayed: 20 } }),
    makePlayer({ puuid: 'red-03', team: 'red', summonerName: 'Canyon King', championId: 141, rank: { tier: 'MASTER', division: 'I', lp: 200 }, recentStats: { kda: 3.5, winRate: 0.55, gamesPlayed: 18 } }),
    makePlayer({ puuid: 'red-04', team: 'red', summonerName: 'TheShy Fan', championId: 114, rank: { tier: 'DIAMOND', division: 'I', lp: 95 }, recentStats: { kda: 3.2, winRate: 0.54, gamesPlayed: 16 } }),
    makePlayer({ puuid: 'red-05', team: 'red', summonerName: '우리팀원딜', championId: 81, rank: { tier: 'EMERALD', division: 'II', lp: 60 }, recentStats: { kda: 2.5, winRate: 0.48, gamesPlayed: 14 } }),
  ]
}

/** 选人阶段的场景 — PUUID 从 LCU 获取但 Riot 数据还未加载 */
export const CHAMP_SELECT_SESSION: GameSession = {
  ...IN_PROGRESS_SESSION,
  phase: 'ChampSelect',
  gameMode: 'CLASSIC',
  players: IN_PROGRESS_SESSION.players.map(p => ({
    ...p,
    championId: Math.random() > 0.5 ? p.championId : null,
    championName: Math.random() > 0.5 ? p.championName : null,
  }))
}

/** 无 Riot API Key 的降级场景 — 只有 LCU 基础数据 */
export const LCU_ONLY_SESSION: GameSession = {
  ...IN_PROGRESS_SESSION,
  phase: 'InProgress',
  players: IN_PROGRESS_SESSION.players.map(p => ({
    ...p,
    rank: null,
    recentStats: null,
    topChampions: [],
    championName: p.championName ?? null,
  }))
}

/** 空状态 — 等待 LOL 客户端连接 */
export const EMPTY_SESSION: GameSession = {
  phase: 'None',
  gameMode: '',
  mapId: 0,
  players: [],
  lastUpdated: Date.now(),
}

/** 加载中状态（返回 null session） */
export const LOADING_STATE = null

/** 默认应用设置 */
export const MOCK_SETTINGS: AppSettings = {
  riotApiKey: 'RGAPI-xxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
  hotkey: 'Ctrl+Tab',
  autoShow: true,
  opacity: 0.85,
}

/** 场景列表（用于开发调试切换） */
export const SCENARIOS: Record<string, { label: string; session: GameSession | null }> = {
  loading: { label: '加载中', session: null },
  empty: { label: '等待连接', session: EMPTY_SESSION },
  champSelect: { label: '英雄选择', session: CHAMP_SELECT_SESSION },
  inProgress: { label: '游戏中', session: IN_PROGRESS_SESSION },
  lcuOnly: { label: '仅 LCU (无 API Key)', session: LCU_ONLY_SESSION },
}

import type { RankInfo, RecentStats, TopChampion } from '../shared/types'

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
  private server = 'kr' // 默认韩服

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

    for (const player of players) {
      if (!player.puuid) {
        results.push({ puuid: player.puuid, rank: null, recentStats: null, topChampions: [] })
        continue
      }

      const { platform, regional } = getEndpoints(this.server)

      const rank = await this.cachedFetch<RankInfo | null>(
        `rank-${player.puuid}`,
        () => this.fetchRank(platform, player.summonerId)
      )

      const topChampions = await this.cachedFetch<TopChampion[]>(
        `champs-${player.puuid}`,
        () => this.fetchTopChampions(platform, player.puuid)
      )

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
        championName: String(m.championId),
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

import { EventEmitter } from 'events'
import type { GameSession, GamePhase, PlayerData, RankInfo, RecentStats, TopChampion } from '../shared/types'
import { LcuConnector } from './lcu-connector'
import { RiotClient } from './riot-client'
import { getChampionNames } from './champion-data'

export class DataAggregator extends EventEmitter {
  private lcuConnector: LcuConnector
  private riotClient: RiotClient | null = null
  private currentSession: GameSession | null = null
  private lastFetchedPhase: GamePhase = 'None'
  private isFetching = false

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

    // 只在进入选人阶段或游戏时拉取数据
    if (phase === 'ChampSelect' || phase === 'GameStart' || phase === 'InProgress') {
      if (!this.isFetching) {
        await this.fetchAndAggregate(phase)
      }
    }

    if (phase === 'EndOfGame' || phase === 'Lobby' || phase === 'None') {
      this.updateSession({ phase, gameMode: '', mapId: 0, players: [], lastUpdated: Date.now() })
    }

    this.lastFetchedPhase = phase
  }

  private async fetchAndAggregate(phase: GamePhase): Promise<void> {
    this.isFetching = true
    try {
      // Step 1: 从 LCU 获取当前 10 人基础信息
      const lcuPlayers = await this.lcuConnector.getCurrentPlayers()
      if (lcuPlayers.length === 0) {
        console.log('[DataAggregator] No players found in current session')
        this.updateSession({ phase, gameMode: 'CLASSIC', mapId: 11, players: [], lastUpdated: Date.now() })
        return
      }

      // Step 2: 获取英雄名称映射
      const championNames = await getChampionNames()

      // Step 3: 用 Riot API 丰富每个玩家的数据
      let enrichedData: Array<{
        puuid: string; rank: RankInfo | null
        recentStats: RecentStats | null
        topChampions: TopChampion[]
      }> = lcuPlayers.map(p => ({ puuid: p.puuid, rank: null, recentStats: null, topChampions: [] }))

      if (this.riotClient) {
        enrichedData = await this.riotClient.getPlayersData(lcuPlayers)
      }

      // Step 4: 聚合为 PlayerData[]，转换 championId → championName
      const players: PlayerData[] = lcuPlayers.map((lp, i) => {
        const enriched = enrichedData[i] ?? { rank: null, recentStats: null, topChampions: [] }
        return {
          puuid: lp.puuid,
          summonerName: lp.summonerName,
          summonerId: lp.summonerId,
          team: lp.team,
          championId: lp.championId,
          championName: lp.championId ? championNames[String(lp.championId)] ?? null : null,
          rank: enriched.rank,
          recentStats: enriched.recentStats,
          recentMatches: [], // Riot API 未在 v1 拉取单场记录
          topChampions: enriched.topChampions.map(c => ({
            ...c,
            championName: championNames[String(c.championId)] ?? `英雄${c.championId}`
          }))
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
    } finally {
      this.isFetching = false
    }
  }

  private updateSession(session: GameSession): void {
    this.currentSession = session
    this.emit('sessionUpdate', session)
  }
}

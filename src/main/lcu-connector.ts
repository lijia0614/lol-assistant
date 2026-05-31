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
      // macOS: 查找 LeagueClientUx 进程
      const { stdout } = await execAsync(
        `lsof -nP -iTCP -sTCP:LISTEN 2>/dev/null | grep LeagueClientUx | awk '{print $9}' | head -1`
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
  private pollTimer: ReturnType<typeof setInterval> | null = null
  private currentPhase: GamePhase = 'None'
  private retryCount = 0
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
    const conn = await findLcuProcess()
    if (conn) {
      if (!this.connection?.connected) {
        this.connection = { ...conn, connected: true }
        this.retryCount = 0
        this.emit('connected', this.connection)
        this.fetchGamePhase()
      }
    } else {
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

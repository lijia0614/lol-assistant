import type { PlayerData, GameSession } from '../types'
import TeamRow from './TeamRow'
import LoadingSkeleton from './LoadingSkeleton'

interface OverlayPanelProps {
  session: GameSession | null
  loading: boolean
  onPlayerClick?: (player: PlayerData) => void
  onSettingsClick?: () => void
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

const PHASE_ICONS: Record<string, string> = {
  None: '',
  Lobby: '',
  Matchmaking: '',
  ReadyCheck: '',
  ChampSelect: '',
  GameStart: '',
  InProgress: '',
  EndOfGame: '',
}

export default function OverlayPanel({ session, loading, onPlayerClick, onSettingsClick }: OverlayPanelProps) {
  // 加载中
  if (loading) return <LoadingSkeleton />

  // 没有数据或没有玩家
  if (!session || session.players.length === 0) {
    const phase = session?.phase ?? 'None'
    return (
      <div className="overlay-panel w-full max-w-4xl mx-auto p-8 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/[0.03] border border-white/[0.06] mb-4">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-gray-500">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
        <div className="flex items-center justify-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"
               style={{ boxShadow: '0 0 8px rgba(250, 204, 21, 0.5)' }} />
          <span className="text-sm text-gray-400">
            {PHASE_LABELS[phase] ?? phase}
          </span>
        </div>
        <p className="text-xs text-gray-600 mt-2">等待 LOL 客户端连接...</p>
        <p className="text-2xs text-gray-700 mt-1">Ctrl+Tab 切换显示</p>

        {/* 设置入口 */}
        <button
          onClick={onSettingsClick}
          className="mt-4 text-2xs text-gray-600 hover:text-gray-400 bg-white/5 hover:bg-white/10 rounded-lg px-3 py-1.5 transition-colors"
        >
          ⚙ 设置
        </button>
      </div>
    )
  }

  // 有玩家数据
  const bluePlayers = session.players.filter(p => p.team === 'blue')
  const redPlayers = session.players.filter(p => p.team === 'red')

  // 队伍平均段位比较
  const getTierWeight = (tier: string | null | undefined): number => {
    const order = ['IRON','BRONZE','SILVER','GOLD','PLATINUM','EMERALD','DIAMOND','MASTER','GRANDMASTER','CHALLENGER']
    return order.indexOf(tier ?? 'IRON')
  }
  const blueAvg = bluePlayers.reduce((s, p) => s + getTierWeight(p.rank?.tier), 0) / Math.max(bluePlayers.length, 1)
  const redAvg = redPlayers.reduce((s, p) => s + getTierWeight(p.rank?.tier), 0) / Math.max(redPlayers.length, 1)
  const comparisonText = blueAvg > redAvg ? '我方段位占优' : redAvg > blueAvg ? '敌方段位占优' : '实力接近'
  const comparisonColor = blueAvg > redAvg ? 'text-green-400' : redAvg > blueAvg ? 'text-red-400' : 'text-yellow-400'

  const hasRiotData = session.players.some(p => p.recentStats)

  return (
    <div className="overlay-panel w-full max-w-4xl mx-auto p-5">
      {/* 头部 — 游戏状态 */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400"
               style={{ boxShadow: '0 0 8px rgba(74, 222, 128, 0.5)' }} />
          <span className="text-xs font-semibold text-gray-300">
{PHASE_LABELS[session.phase] ?? session.phase}
            <span className="text-gray-600 ml-1">· {session.gameMode}</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-2xs font-medium ${comparisonColor}`}>
            {comparisonText}
          </span>
          <button
            onClick={onSettingsClick}
            className="text-2xs text-gray-600 hover:text-gray-400 transition-colors"
            title="设置"
          >
            ⚙
          </button>
        </div>
      </div>

      {/* 蓝方 */}
      <TeamRow team="blue" label="蓝方 · 我方" players={bluePlayers} onPlayerClick={onPlayerClick} />

      {/* 间隔线 */}
      <div className="flex items-center gap-3 my-2 px-1">
        <div className="flex-1 h-px bg-white/[0.03]" />
        <span className="text-2xs text-gray-700">VS</span>
        <div className="flex-1 h-px bg-white/[0.03]" />
      </div>

      {/* 红方 */}
      <TeamRow team="red" label="红方 · 敌方" players={redPlayers} onPlayerClick={onPlayerClick} />

      {/* 底部信息 */}
      <div className="flex justify-between items-center px-1 pt-2 mt-1 border-t border-white/[0.03]">
        <span className="text-2xs text-gray-700">
          {hasRiotData ? '数据来源: LCU + Riot API' : '仅 LCU 数据 (配置 Riot API Key 获取详细战绩)'}
        </span>
        <span className="text-2xs text-gray-700">
          点击玩家卡片查看详情 →
        </span>
      </div>
    </div>
  )
}

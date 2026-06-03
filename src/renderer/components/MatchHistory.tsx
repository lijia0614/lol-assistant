import type { RecentMatch } from '../types'
import ChampionIcon from './ChampionIcon'

interface MatchHistoryProps {
  matches: RecentMatch[]
}

/** 格式化时间间隔 */
function formatTimeAgo(ts: number): string {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  const hrs = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (mins < 60) return `${mins}分钟前`
  if (hrs < 24) return `${hrs}小时前`
  if (days < 7) return `${days}天前`
  return `${Math.floor(days / 7)}周前`
}

/** 格式化游戏时长 */
function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function MatchHistory({ matches }: MatchHistoryProps) {
  if (!matches || matches.length === 0) {
    return (
      <div className="text-xs text-gray-600 italic py-4 text-center">
        暂无对局记录（需配置 Riot API Key）
      </div>
    )
  }

  return (
    <div className="space-y-1.5">
      {matches.map((m, i) => {
        const kda = m.deaths === 0
          ? (m.kills + m.assists)
          : ((m.kills + m.assists) / m.deaths)
        const kdaColor = kda >= 4 ? 'text-green-400' : kda >= 3 ? 'text-yellow-400' : kda >= 2 ? 'text-orange-400' : 'text-red-400'

        return (
          <div
            key={m.matchId || i}
            className={`flex items-center gap-2 py-2 px-2 rounded-md text-xs transition-colors ${
              m.win
                ? 'bg-emerald-500/[0.04] border-l-2 border-emerald-500/40 hover:bg-emerald-500/[0.07]'
                : 'bg-red-500/[0.04] border-l-2 border-red-500/30 hover:bg-red-500/[0.07]'
            }`}
          >
            {/* 英雄头像 */}
            <ChampionIcon championId={m.championId} championName={m.championName} size={28} />

            {/* 英雄名 + 模式 */}
            <div className="flex-1 min-w-0">
              <div className="text-gray-200 font-medium truncate text-2xs">
                {m.championName}
              </div>
              <div className="text-2xs text-gray-600 mt-0.5">
                {m.gameMode} · {m.lane}
              </div>
            </div>

            {/* KDA */}
            <div className="text-right min-w-[52px]">
              <div className={`font-bold text-2xs tracking-tight ${kdaColor}`}>
                <span className="text-gray-200">{m.kills}</span>
                <span className="text-gray-600">/</span>
                <span style={{ color: m.deaths > 3 ? '#ef4444' : '#9ca3af' }}>{m.deaths}</span>
                <span className="text-gray-600">/</span>
                <span className="text-gray-200">{m.assists}</span>
              </div>
              <div className="text-2xs text-gray-600">
                <span className={kdaColor}>{kda.toFixed(1)}</span> KDA
              </div>
            </div>

            {/* CS + 时长 */}
            <div className="text-right min-w-[40px]">
              <div className="text-2xs text-gray-300 tabular-nums">
                {m.cs} <span className="text-gray-600">CS</span>
              </div>
              <div className="text-2xs text-gray-600">
                {formatDuration(m.duration)}
              </div>
            </div>

            {/* 时间 */}
            <div className="text-right min-w-[40px]">
              <span className={`text-2xs font-medium ${m.win ? 'text-emerald-400' : 'text-red-400'}`}>
                {m.win ? '胜利' : '失败'}
              </span>
              <div className="text-2xs text-gray-700">
                {formatTimeAgo(m.timestamp)}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

import type { PlayerData } from '../types'
import RankBadge from './RankBadge'
import ChampionIcon from './ChampionIcon'

interface DetailPanelProps {
  player: PlayerData
  onClose: () => void
}

export default function DetailPanel({ player, onClose }: DetailPanelProps) {
  const teamBorder = player.team === 'blue' ? 'border-l-[#4da6ff]' : 'border-l-[#ff4d4d]'
  const teamLabel = player.team === 'blue' ? '蓝方 · 我方' : '红方 · 敌方'
  const teamTextColor = player.team === 'blue' ? 'text-[#4da6ff]' : 'text-[#ff4d4d]'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0, 0, 0, 0.55)' }}
      onClick={onClose}
    >
      <div
        className={`overlay-panel w-80 p-5 border-l-2 ${teamBorder}`}
        onClick={e => e.stopPropagation()}
      >
        {/* 头部：头像 + 名称 */}
        <div className="flex items-start gap-3 mb-4">
          <ChampionIcon
            championId={player.championId ?? 0}
            championName={player.championName}
            size={48}
          />
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-gray-100 truncate" title={player.summonerName}>
              {player.summonerName}
            </h3>
            <p className={`text-2xs ${teamTextColor} mt-0.5`}>{teamLabel}</p>
            {player.championName && (
              <p className="text-xs text-gray-500 mt-0.5">
                {player.championName}
              </p>
            )}
            <div className="mt-1.5">
              <RankBadge rank={player.rank} size="md" />
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-300 text-lg leading-none px-1.5 py-0.5 rounded hover:bg-white/5 transition-colors flex-shrink-0"
          >
            ✕
          </button>
        </div>

        {/* KDA & 胜率 */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
            <div className="text-2xs text-gray-600 mb-1">KDA</div>
            <div className="text-lg font-bold text-gray-100">
              {player.recentStats ? player.recentStats.kda.toFixed(1) : '-'}
            </div>
            <div className="text-2xs text-gray-600 mt-0.5">
              近{player.recentStats?.gamesPlayed ?? 0}场
            </div>
          </div>
          <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04] text-right">
            <div className="text-2xs text-gray-600 mb-1">胜率</div>
            <div className={`text-lg font-bold ${
              player.recentStats
                ? player.recentStats.winRate >= 0.55
                  ? 'text-green-400'
                  : player.recentStats.winRate >= 0.50
                    ? 'text-yellow-400'
                    : 'text-red-400'
                : 'text-gray-600'
            }`}>
              {player.recentStats ? `${Math.round(player.recentStats.winRate * 100)}%` : '-'}
            </div>
          </div>
        </div>

        {/* 常用英雄 */}
        <div>
          <div className="text-2xs text-gray-600 mb-2">常用英雄 TOP 3</div>
          {player.topChampions.length === 0 ? (
            <p className="text-xs text-gray-600 italic">暂无数据（需配置 Riot API Key）</p>
          ) : (
            <div className="space-y-1.5">
              {player.topChampions.map((champ, i) => (
                <div
                  key={champ.championId}
                  className="flex items-center justify-between text-xs py-1.5 px-2 rounded-md bg-white/[0.02]"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600 w-4 text-right">{i + 1}</span>
                    <ChampionIcon championId={champ.championId} championName={champ.championName} size={22} />
                    <span className="text-gray-300">{champ.championName}</span>
                  </div>
                  <span className="text-gray-600 tabular-nums">
                    {Math.floor(champ.masteryPoints / 1000)}k
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

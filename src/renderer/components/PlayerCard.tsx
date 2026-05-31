import type { PlayerData } from '../types'
import RankBadge from './RankBadge'
import ChampionIcon from './ChampionIcon'

function formatKDA(kda: number | null | undefined): { value: string; className: string } {
  if (kda == null) return { value: '-', className: 'text-gray-600' }
  if (kda >= 4.0) return { value: kda.toFixed(1), className: 'text-green-400' }
  if (kda >= 3.0) return { value: kda.toFixed(1), className: 'text-yellow-400' }
  if (kda >= 2.0) return { value: kda.toFixed(1), className: 'text-orange-400' }
  return { value: kda.toFixed(1), className: 'text-red-400' }
}

function formatWinRate(wr: number | null | undefined): { value: string; className: string } {
  if (wr == null) return { value: '-', className: 'text-gray-600' }
  const pct = Math.round(wr * 100)
  if (pct >= 60) return { value: `${pct}%`, className: 'text-green-400' }
  if (pct >= 52) return { value: `${pct}%`, className: 'text-yellow-400' }
  return { value: `${pct}%`, className: 'text-red-400' }
}

interface PlayerCardProps {
  player: PlayerData
  onClick?: () => void
}

export default function PlayerCard({ player, onClick }: PlayerCardProps) {
  const kda = formatKDA(player.recentStats?.kda)
  const wr = formatWinRate(player.recentStats?.winRate)
  const isThreat = player.team === 'red' &&
    player.rank && ['MASTER', 'GRANDMASTER', 'CHALLENGER'].includes(player.rank.tier)

  return (
    <div
      className={`player-card ${player.team === 'blue' ? 'team-blue' : 'team-red'} ${isThreat ? 'threat' : ''} p-3`}
      onClick={onClick}
    >
      {/* 英雄头像 + 召唤师名 + 段位 */}
      <div className="flex items-start gap-2 mb-2">
        <ChampionIcon
          championId={player.championId ?? 0}
          championName={player.championName}
          size={34}
        />
        <div className="flex-1 min-w-0">
          <div
            className="text-xs font-semibold text-gray-200 truncate leading-tight"
            title={player.summonerName}
          >
            {player.summonerName || '未知'}
          </div>
          <div className="mt-1">
            <RankBadge rank={player.rank} />
          </div>
        </div>
      </div>

      {/* 数据行 — KDA + 胜率 */}
      <div className="flex justify-between items-end mt-2 pt-2 border-t border-white/[0.04]">
        <div>
          <div className="text-2xs text-gray-600 mb-0.5">KDA</div>
          <div className={`text-sm font-bold tracking-tight ${kda.className}`}>{kda.value}</div>
        </div>
        <div className="text-right">
          <div className="text-2xs text-gray-600 mb-0.5">
            胜率
          </div>
          <div className={`text-sm font-bold tracking-tight ${wr.className}`}>{wr.value}</div>
        </div>
      </div>

      {/* 常用英雄标签 */}
      {player.topChampions.length > 0 && (
        <div className="flex gap-1 mt-2.5 pt-2 border-t border-white/[0.04]">
          {player.topChampions.slice(0, 3).map((champ) => (
            <span
              key={champ.championId}
              className="text-2xs text-gray-500 bg-white/[0.04] rounded-md px-1.5 py-0.5 truncate"
              title={`${champ.championName} · ${Math.floor(champ.masteryPoints / 1000)}k`}
            >
              {champ.championName}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

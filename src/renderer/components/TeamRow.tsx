import type { PlayerData } from '../types'
import PlayerCard from './PlayerCard'

interface TeamRowProps {
  team: 'blue' | 'red'
  label: string
  players: PlayerData[]
  onPlayerClick?: (player: PlayerData) => void
}

export default function TeamRow({ team, label, players, onPlayerClick }: TeamRowProps) {
  const barColor = team === 'blue' ? 'bg-[#4da6ff]' : 'bg-[#ff4d4d]'
  const textColor = team === 'blue' ? 'text-[#4da6ff]' : 'text-[#ff4d4d]'
  const glowColor = team === 'blue'
    ? 'shadow-[0_0_8px_rgba(77,166,255,0.3)]'
    : 'shadow-[0_0_8px_rgba(255,77,77,0.3)]'

  return (
    <div className="mb-4">
      {/* 队伍标识 */}
      <div className="flex items-center gap-2 mb-2 px-1">
        <div className={`w-1 h-4 rounded-full ${barColor} ${glowColor}`} />
        <span className={`text-xs font-bold tracking-wide ${textColor}`}>
          {label}
        </span>
        <span className="text-2xs text-gray-600 ml-1">
          {players.length}人
        </span>
      </div>

      {/* 5 人卡片网格 */}
      <div className="grid grid-cols-5 gap-2.5">
        {players.map(player => (
          <PlayerCard
            key={player.puuid || player.summonerName}
            player={player}
            onClick={() => onPlayerClick?.(player)}
          />
        ))}
        {/* 补齐空位 */}
        {Array.from({ length: Math.max(0, 5 - players.length) }).map((_, i) => (
          <div key={`empty-${i}`} className="player-card p-3 opacity-30 flex items-center justify-center">
            <span className="text-xs text-gray-600">等待中...</span>
          </div>
        ))}
      </div>
    </div>
  )
}

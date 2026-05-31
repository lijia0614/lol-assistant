import { useState, useEffect, useCallback } from 'react'
import type { GameSession, PlayerData } from './types'
import OverlayPanel from './components/OverlayPanel'
import DetailPanel from './components/DetailPanel'
import SettingsPage from './components/SettingsPage'
import { SCENARIOS } from './mock/data'

type View = 'overlay' | 'settings'

export default function App() {
  const [session, setSession] = useState<GameSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerData | null>(null)
  const [view, setView] = useState<View>('overlay')

  // 监听游戏状态变化
  useEffect(() => {
    const api = window.electronAPI
    if (!api) return

    // 初始加载
    api.getGameState().then((s) => {
      setSession(s)
      setLoading(false)
    })

    // 监听实时变化
    api.onGameStateChange((s: GameSession) => {
      setSession(s)
      setLoading(false)
    })
  }, [])

  const handlePlayerClick = useCallback((player: PlayerData) => {
    setSelectedPlayer(player)
  }, [])

  const handleCloseDetail = useCallback(() => {
    setSelectedPlayer(null)
  }, [])

  // 设置页面
  if (view === 'settings') {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center p-4">
        <SettingsPage onBack={() => setView('overlay')} />
      </div>
    )
  }

  // 覆盖层
  return (
    <div className="min-h-screen bg-transparent flex items-start justify-center pt-8 relative">
      <OverlayPanel
        session={session}
        loading={loading}
        onPlayerClick={handlePlayerClick}
        onSettingsClick={() => setView('settings')}
      />

      {/* 开发者场景切换器（仅浏览器模式） */}
      <DevScenarioSwitcher onSwitch={setSession} />

      {/* 玩家详情弹窗 */}
      {selectedPlayer && (
        <DetailPanel player={selectedPlayer} onClose={handleCloseDetail} />
      )}
    </div>
  )
}

/** 开发调试：场景切换器 */
function DevScenarioSwitcher({ onSwitch }: { onSwitch: (s: GameSession | null) => void }) {
  const [scenario, setScenario] = useState('inProgress')

  const handleChange = (key: string) => {
    setScenario(key)
    onSwitch(SCENARIOS[key].session)
  }

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <select
        value={scenario}
        onChange={e => handleChange(e.target.value)}
        className="bg-white/[0.06] border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-400
                   focus:outline-none focus:border-blue-400/50 cursor-pointer backdrop-blur-sm"
      >
        {Object.entries(SCENARIOS).map(([key, s]) => (
          <option key={key} value={key} className="bg-gray-900 text-gray-300">
            {s.label}
          </option>
        ))}
      </select>
    </div>
  )
}

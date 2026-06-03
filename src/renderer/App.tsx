import { useState, useEffect, useCallback } from 'react'
import type { GameSession, PlayerData, AppSettings } from './types'
import OverlayPanel from './components/OverlayPanel'
import DetailPanel from './components/DetailPanel'
import SettingsPage from './components/SettingsPage'
import WelcomeGuide from './components/WelcomeGuide'
import { SCENARIOS } from './mock/data'

type View = 'overlay' | 'settings' | 'welcome'

export default function App() {
  const [session, setSession] = useState<GameSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerData | null>(null)
  const [view, setView] = useState<View>('overlay')
  const [error, setError] = useState<string | null>(null)

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
      setError(null)
    })

    // 检查是否需要显示引导
    api.getSettings().then((settings: AppSettings) => {
      if (!settings.riotApiKey) {
        // 首次运行无 API Key，可提示用户去设置
      }
    })
  }, [])

  const handlePlayerClick = useCallback((player: PlayerData) => {
    setSelectedPlayer(player)
  }, [])

  const handleCloseDetail = useCallback(() => {
    setSelectedPlayer(null)
  }, [])

  const handleWelcomeComplete = useCallback(async (settings: Partial<AppSettings>) => {
    if (Object.keys(settings).length > 0) {
      await window.electronAPI.saveSettings(settings)
    }
    setView('overlay')
  }, [])

  const handleWelcomeSkip = useCallback(() => {
    setView('overlay')
  }, [])

  // 欢迎引导页
  if (view === 'welcome') {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center p-4">
        <WelcomeGuide onComplete={handleWelcomeComplete} onSkip={handleWelcomeSkip} />
      </div>
    )
  }

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
    <div className="min-h-screen bg-transparent">
      {/* 拖拽区域（窗口顶部 28px 可拖拽） */}
      <div className="drag-region fixed top-0 left-0 right-0 h-7 z-40" />

      {/* 错误提示条 */}
      {error && (
        <ErrorBanner message={error} onDismiss={() => setError(null)} />
      )}

      <div className="flex items-start justify-center pt-8">
        <OverlayPanel
          session={session}
          loading={loading}
          onPlayerClick={handlePlayerClick}
          onSettingsClick={() => setView('settings')}
          onShowWelcome={() => setView('welcome')}
        />
      </div>

      {/* 开发者场景切换器（仅浏览器 mock 模式） */}
      <DevScenarioSwitcher onSwitch={setSession} />

      {/* 玩家详情弹窗 */}
      {selectedPlayer && (
        <DetailPanel player={selectedPlayer} onClose={handleCloseDetail} />
      )}
    </div>
  )
}

/** 错误通知条 */
function ErrorBanner({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-2 bg-red-500/20 border-b border-red-500/30 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
        <span className="text-xs text-red-300">{message}</span>
      </div>
      <button onClick={onDismiss} className="text-red-400 hover:text-red-300 text-sm">✕</button>
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

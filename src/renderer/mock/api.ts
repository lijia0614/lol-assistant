import type { GameSession, AppSettings } from '../types'
import { MOCK_SETTINGS, IN_PROGRESS_SESSION } from './data'

type Listener = (data: any) => void
const listeners: Record<string, Listener[]> = {}

function emit(channel: string, data: any) {
  listeners[channel]?.forEach(fn => fn(data))
}

/** 浏览器模式下的 mock electronAPI */
export const mockElectronAPI = {
  _currentSession: IN_PROGRESS_SESSION as GameSession | null,
  _settings: { ...MOCK_SETTINGS },

  getGameState: async () => mockElectronAPI._currentSession,
  getPlayerData: async () => mockElectronAPI._currentSession?.players ?? [],

  onGameStateChange: (callback: (data: GameSession) => void) => {
    if (!listeners['game-state-changed']) listeners['game-state-changed'] = []
    listeners['game-state-changed'].push(callback)
  },
  onPlayerDataUpdate: (callback: (data: any) => void) => {
    if (!listeners['player-data-update']) listeners['player-data-update'] = []
    listeners['player-data-update'].push(callback)
  },

  toggleOverlay: async () => true,
  getSettings: async () => ({ ...mockElectronAPI._settings }),
  saveSettings: async (s: Partial<AppSettings>) => {
    Object.assign(mockElectronAPI._settings, s)
    return true
  },

  /** 开发调试：切换场景 */
  _setSession(session: GameSession | null) {
    mockElectronAPI._currentSession = session
    if (session) {
      emit('game-state-changed', session)
      emit('player-data-update', session.players)
    }
  }
}

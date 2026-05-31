import type { GameSession, PlayerData, AppSettings } from '../../shared/types'

interface ElectronAPI {
  getGameState: () => Promise<GameSession | null>
  getPlayerData: () => Promise<PlayerData[]>
  onGameStateChange: (callback: (data: GameSession) => void) => void
  onPlayerDataUpdate: (callback: (data: PlayerData[]) => void) => void
  toggleOverlay: () => Promise<boolean>
  getSettings: () => Promise<AppSettings>
  saveSettings: (settings: Partial<AppSettings>) => Promise<boolean>
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

export {}

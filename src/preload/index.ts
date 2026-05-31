import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  getGameState: () => ipcRenderer.invoke('get-game-state'),
  getPlayerData: () => ipcRenderer.invoke('get-player-data'),
  onGameStateChange: (callback: (data: unknown) => void) => {
    ipcRenderer.on('game-state-changed', (_event, data) => callback(data))
  },
  onPlayerDataUpdate: (callback: (data: unknown) => void) => {
    ipcRenderer.on('player-data-update', (_event, data) => callback(data))
  },
  toggleOverlay: () => ipcRenderer.invoke('toggle-overlay'),
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings: unknown) => ipcRenderer.invoke('save-settings', settings),

  // 监听主进程导航指令（托盘菜单 → 设置）
  onNavigate: (callback: (target: string) => void) => {
    ipcRenderer.on('navigate', (_event, target: string) => callback(target))
  }
})

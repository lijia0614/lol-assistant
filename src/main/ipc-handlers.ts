import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '../shared/types'
import type { AppSettings, GameSession } from '../shared/types'
import { DataAggregator } from './data-aggregator'
import { WindowManager } from './window-manager'
import { RiotClient } from './riot-client'
import { loadSettings, saveSettings } from './settings-store'

export function registerIpcHandlers(
  aggregator: DataAggregator,
  windowManager: WindowManager,
  riotClient: RiotClient | null
): void {
  let settings = loadSettings()

  // 游戏状态查询
  ipcMain.handle(IPC_CHANNELS.GET_GAME_STATE, () => {
    return aggregator.getCurrentSession()
  })

  // 玩家数据查询
  ipcMain.handle(IPC_CHANNELS.GET_PLAYER_DATA, () => {
    return aggregator.getCurrentSession()?.players ?? []
  })

  // 切换覆盖层
  ipcMain.handle(IPC_CHANNELS.TOGGLE_OVERLAY, () => {
    return windowManager.toggleOverlay()
  })

  // 设置读写
  ipcMain.handle(IPC_CHANNELS.GET_SETTINGS, () => settings)

  ipcMain.handle(IPC_CHANNELS.SAVE_SETTINGS, (_event, newSettings: AppSettings) => {
    settings = { ...settings, ...newSettings }
    saveSettings(settings)

    // 更新 Riot API key
    if (riotClient && newSettings.riotApiKey !== undefined) {
      riotClient.updateApiKey(newSettings.riotApiKey)
    }

    // 更新透明度
    if (newSettings.opacity !== undefined) {
      windowManager.setOpacity(newSettings.opacity)
    }

    return true
  })

  // 数据更新事件推送
  aggregator.on('sessionUpdate', (session: GameSession) => {
    const win = windowManager.getOverlayWindow()
    if (win && !win.isDestroyed()) {
      win.webContents.send(IPC_CHANNELS.GAME_STATE_CHANGED, session)
      win.webContents.send(IPC_CHANNELS.PLAYER_DATA_UPDATE, session.players)
    }
    // 自动显示/隐藏
    if (settings.autoShow) {
      windowManager.setAutoVisibility(session.phase)
    }
  })
}

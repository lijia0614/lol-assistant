import { app } from 'electron'
import { LcuConnector } from './lcu-connector'
import { RiotClient } from './riot-client'
import { DataAggregator } from './data-aggregator'
import { WindowManager } from './window-manager'
import { ShortcutManager } from './shortcut'
import { registerIpcHandlers } from './ipc-handlers'
import { loadSettings } from './settings-store'

let lcuConnector: LcuConnector
let riotClient: RiotClient | null = null
let aggregator: DataAggregator
let windowManager: WindowManager
let shortcutManager: ShortcutManager

app.whenReady().then(() => {
  const settings = loadSettings()

  // 1. 窗口 & 托盘
  windowManager = new WindowManager()
  windowManager.createTray()

  // 2. LCU 连接器
  lcuConnector = new LcuConnector()

  // 3. Riot API 客户端（如果有 API Key）
  if (settings.riotApiKey) {
    riotClient = new RiotClient(settings.riotApiKey)
  }

  // 4. 数据聚合器
  aggregator = new DataAggregator(lcuConnector)
  if (riotClient) {
    aggregator.setRiotClient(riotClient)
  }

  // 5. 注册 IPC
  registerIpcHandlers(aggregator, windowManager, riotClient)

  // 6. 全局快捷键
  shortcutManager = new ShortcutManager()
  shortcutManager.register(settings.hotkey, () => {
    windowManager.toggleOverlay()
  })

  // 7. 启动 LCU 扫描
  lcuConnector.start()

  // 8. 初始显示覆盖层窗口（显示连接状态）
  windowManager.createOverlay()

  console.log('[Main] LOL Assistant started')
})

app.on('will-quit', () => {
  lcuConnector?.stop()
  shortcutManager?.unregisterAll()
})

// macOS: 关闭窗口不退出应用
app.on('window-all-closed', () => {
  // 不退出，保持在托盘
})

app.on('activate', () => {
  windowManager?.createOverlay()
})

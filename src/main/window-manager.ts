import { BrowserWindow, Tray, Menu, nativeImage, screen, app } from 'electron'
import { join } from 'path'
import { OVERLAY_CONFIG } from '../shared/types'

export class WindowManager {
  private overlayWindow: BrowserWindow | null = null
  private tray: Tray | null = null
  private isVisible = false
  private opacity: number = OVERLAY_CONFIG.opacity

  /** 创建透明覆盖层窗口 */
  createOverlay(): BrowserWindow {
    if (this.overlayWindow && !this.overlayWindow.isDestroyed()) {
      return this.overlayWindow
    }

    const { width: screenW, height: screenH } = screen.getPrimaryDisplay().workAreaSize

    this.overlayWindow = new BrowserWindow({
      width: OVERLAY_CONFIG.width,
      height: OVERLAY_CONFIG.height,
      x: Math.round((screenW - OVERLAY_CONFIG.width) / 2),
      y: Math.round(screenH * 0.05),
      transparent: true,
      frame: false,
      alwaysOnTop: true,
      resizable: false,
      skipTaskbar: true,
      hasShadow: false,
      opacity: this.opacity,
      webPreferences: {
        preload: join(__dirname, '../preload/index.js'),
        sandbox: false,
        backgroundThrottling: false
      }
    })

    // 面板区域外鼠标穿透
    this.overlayWindow.setIgnoreMouseEvents(true, { forward: true })

    if (process.env.ELECTRON_RENDERER_URL) {
      this.overlayWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
    } else {
      this.overlayWindow.loadFile(join(__dirname, '../renderer/index.html'))
    }

    this.overlayWindow.on('closed', () => { this.overlayWindow = null })
    this.isVisible = true

    return this.overlayWindow
  }

  /** 创建系统托盘 */
  createTray(): Tray {
    const icon = nativeImage.createEmpty()
    this.tray = new Tray(icon.resize({ width: 16, height: 16 }))

    const contextMenu = Menu.buildFromTemplate([
      { label: '显示/隐藏覆盖层', click: () => this.toggleOverlay() },
      { label: '设置', click: () => this.showSettings() },
      { type: 'separator' },
      { label: '退出', click: () => {
        if (this.overlayWindow && !this.overlayWindow.isDestroyed()) {
          this.overlayWindow.close()
        }
        if (this.tray) this.tray.destroy()
        app.quit()
      }}
    ])

    this.tray.setToolTip('LOL Assistant')
    this.tray.setContextMenu(contextMenu)
    this.tray.on('click', () => this.toggleOverlay())

    return this.tray
  }

  /** 切换覆盖层显示/隐藏 */
  toggleOverlay(): boolean {
    if (!this.overlayWindow || this.overlayWindow.isDestroyed()) {
      this.createOverlay()
      this.isVisible = true
      return true
    }

    if (this.isVisible) {
      this.overlayWindow.hide()
      this.isVisible = false
      return false
    } else {
      this.overlayWindow.show()
      this.isVisible = true
      return true
    }
  }

  /** 根据游戏阶段自动显示/隐藏 */
  setAutoVisibility(phase: string): void {
    const shouldShow = phase === 'ChampSelect' || phase === 'GameStart' || phase === 'InProgress'
    if (shouldShow && !this.isVisible) {
      this.toggleOverlay()
    } else if (!shouldShow && this.isVisible) {
      this.toggleOverlay()
    }
  }

  /** 更新面板鼠标穿透区域 */
  setMouseIgnore(ignore: boolean): void {
    this.overlayWindow?.setIgnoreMouseEvents(ignore, { forward: true })
  }

  setOpacity(opacity: number): void {
    this.opacity = opacity
    this.overlayWindow?.setOpacity(opacity)
  }

  private showSettings(): void {
    if (this.overlayWindow && !this.overlayWindow.isDestroyed()) {
      this.overlayWindow.webContents.send('navigate', '/settings')
    }
  }

  getOverlayWindow(): BrowserWindow | null {
    return this.overlayWindow
  }
}

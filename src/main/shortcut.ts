import { globalShortcut } from 'electron'

export class ShortcutManager {
  private registeredKeys: string[] = []

  /** 注册快捷键 */
  register(key: string, callback: () => void): boolean {
    const ret = globalShortcut.register(key, callback)
    if (ret) {
      this.registeredKeys.push(key)
      console.log(`[Shortcut] Registered: ${key}`)
    }
    return ret
  }

  /** 注销快捷键 */
  unregister(key: string): void {
    globalShortcut.unregister(key)
    this.registeredKeys = this.registeredKeys.filter(k => k !== key)
  }

  /** 更新快捷键（如用户改设置） */
  update(oldKey: string, newKey: string, callback: () => void): void {
    this.unregister(oldKey)
    this.register(newKey, callback)
  }

  /** 注销所有快捷键 */
  unregisterAll(): void {
    globalShortcut.unregisterAll()
    this.registeredKeys = []
  }
}

import * as fs from 'fs'
import * as path from 'path'
import { app } from 'electron'
import type { AppSettings } from '../shared/types'

const SETTINGS_PATH = path.join(app.getPath('userData'), 'settings.json')

const DEFAULT_SETTINGS: AppSettings = {
  riotApiKey: '',
  hotkey: 'Ctrl+Tab',
  autoShow: true,
  opacity: 0.85
}

export function loadSettings(): AppSettings {
  try {
    if (fs.existsSync(SETTINGS_PATH)) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf-8')) }
    }
  } catch { /* ignore corrupt file */ }
  return { ...DEFAULT_SETTINGS }
}

export function saveSettings(settings: AppSettings): void {
  const dir = path.dirname(SETTINGS_PATH)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2))
}

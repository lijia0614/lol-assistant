import { useState, useEffect } from 'react'
import type { AppSettings } from '../types'

interface SettingsPageProps {
  onBack: () => void
}

export default function SettingsPage({ onBack }: SettingsPageProps) {
  const [settings, setSettings] = useState<AppSettings>({
    riotApiKey: '',
    hotkey: 'Ctrl+Tab',
    autoShow: true,
    opacity: 0.85
  })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    window.electronAPI.getSettings().then(s => { if (s) setSettings(s) })
  }, [])

  async function handleSave() {
    await window.electronAPI.saveSettings(settings)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="overlay-panel w-full max-w-md mx-auto p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-bold text-gray-100">⚙ 设置</h2>
        <button
          onClick={onBack}
          className="text-xs text-gray-500 hover:text-gray-300 bg-white/5 hover:bg-white/10 rounded-lg px-3 py-1.5 transition-colors"
        >
          ← 返回覆盖层
        </button>
      </div>

      {/* Riot API Key */}
      <div className="mb-5">
        <label className="text-xs text-gray-400 block mb-1.5 font-medium">
          Riot Games API Key
        </label>
        <input
          type="password"
          value={settings.riotApiKey}
          onChange={e => setSettings({ ...settings, riotApiKey: e.target.value })}
          placeholder="RGAPI-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
          className="w-full"
        />
        <div className="flex items-center justify-between mt-1.5">
          <a
            href="https://developer.riotgames.com"
            className="text-2xs text-blue-400 hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            → 申请地址 developer.riotgames.com
          </a>
          <span className="text-2xs text-gray-600">24h 有效</span>
        </div>
      </div>

      {/* 快捷键 */}
      <div className="mb-5">
        <label className="text-xs text-gray-400 block mb-1.5 font-medium">
          覆盖层快捷键
        </label>
        <input
          value={settings.hotkey}
          onChange={e => setSettings({ ...settings, hotkey: e.target.value })}
          className="w-36"
          readOnly
        />
        <span className="text-2xs text-gray-600 ml-2">（应用重启后生效）</span>
      </div>

      {/* 自动显示 */}
      <div className="mb-5 flex items-center justify-between py-1">
        <div>
          <label className="text-xs text-gray-400 font-medium">进入游戏自动显示覆盖层</label>
          <p className="text-2xs text-gray-600 mt-0.5">选人或进入游戏时自动弹出面板</p>
        </div>
        <button
          onClick={() => setSettings({ ...settings, autoShow: !settings.autoShow })}
          className={`toggle-switch ${settings.autoShow ? 'on' : 'off'}`}
        />
      </div>

      {/* 透明度 */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs text-gray-400 font-medium">覆盖层透明度</label>
          <span className="text-xs text-gray-500 tabular-nums">
            {Math.round(settings.opacity * 100)}%
          </span>
        </div>
        <input
          type="range"
          min="40"
          max="100"
          value={Math.round(settings.opacity * 100)}
          onChange={e => setSettings({ ...settings, opacity: parseInt(e.target.value) / 100 })}
        />
        <div className="flex justify-between mt-1">
          <span className="text-2xs text-gray-600">40%</span>
          <span className="text-2xs text-gray-600">100%</span>
        </div>
      </div>

      {/* 保存 */}
      <button
        onClick={handleSave}
        className={`w-full text-sm font-semibold rounded-lg py-2.5 transition-all ${
          saved
            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
            : 'bg-[#4da6ff] hover:bg-[#3d96ef] text-white shadow-lg shadow-blue-500/20'
        }`}
      >
        {saved ? '✓ 已保存' : '保存设置'}
      </button>

      {/* 版本信息 */}
      <p className="text-2xs text-gray-700 text-center mt-4">
        LOL Assistant v1.0.0 · 数据来源 Riot Games API
      </p>
    </div>
  )
}

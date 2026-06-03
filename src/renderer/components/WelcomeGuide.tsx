import { useState } from 'react'
import type { AppSettings } from '../types'

interface WelcomeGuideProps {
  onComplete: (settings: Partial<AppSettings>) => void
  onSkip: () => void
}

export default function WelcomeGuide({ onComplete, onSkip }: WelcomeGuideProps) {
  const [step, setStep] = useState(0)
  const [apiKey, setApiKey] = useState('')

  const steps = [
    {
      title: '欢迎使用 LOL Assistant',
      description: '在游戏中实时查看 10 名玩家的段位、KDA、胜率和常用英雄。\n类似 WeGame 的 TAB 面板，但更轻量、更专注。',
      icon: (
        <svg width="48" height="48" viewBox="0 0 256 256" fill="none">
          <circle cx="128" cy="128" r="100" stroke="#4da6ff" strokeWidth="2" opacity="0.3"/>
          <path d="M128 40L52 72v52c0 48 30 92 76 104 46-12 76-56 76-104V72L128 40z" stroke="#4da6ff" strokeWidth="3" fill="none" opacity="0.8"/>
          <rect x="86" y="100" width="8" height="56" rx="2" fill="#4da6ff" opacity="0.6"/>
          <rect x="94" y="148" width="30" height="8" rx="2" fill="#4da6ff" opacity="0.6"/>
          <path d="M136 100l18 56h-10l-4-14h-16l-4 14h-10l18-56h8zM140 134l-4-14-4 14h8z" fill="#4da6ff" opacity="0.6"/>
        </svg>
      )
    },
    {
      title: '配置 Riot API Key',
      description: '获取详细战绩需要 Riot Games API Key。\n免费申请，24 小时有效，每天可续。\n\n没有 Key 也能使用，但仅显示 LCU 基础信息。',
      icon: (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="6" width="18" height="12" rx="2" stroke="#f0c040" strokeWidth="1.5"/>
          <path d="M3 10h18" stroke="#f0c040" strokeWidth="1.5"/>
          <circle cx="7" cy="15" r="1" fill="#f0c040" opacity="0.5"/>
          <circle cx="10" cy="15" r="1" fill="#f0c040" opacity="0.5"/>
        </svg>
      )
    },
    {
      title: '准备就绪',
      description: 'LOL 客户端启动后，覆盖层会自动弹出。\n\n快捷键 Ctrl+Tab 可随时呼出或隐藏面板。\n系统托盘右键可访问设置和退出。',
      icon: (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="#4ade80" strokeWidth="1.5"/>
          <path d="M8 12l3 3 5-6" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    }
  ]

  const current = steps[step]
  const isLast = step === steps.length - 1

  function handleNext() {
    if (isLast) {
      const updates: Partial<AppSettings> = {}
      if (apiKey.trim()) updates.riotApiKey = apiKey.trim()
      onComplete(updates)
    } else {
      setStep(s => s + 1)
    }
  }

  return (
    <div className="overlay-panel w-full max-w-sm mx-auto p-6">
      {/* 步骤指示器 */}
      <div className="flex justify-center gap-1.5 mb-6">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`h-1 rounded-full transition-all duration-300 ${
              i === step ? 'w-6 bg-[#4da6ff]' : i < step ? 'w-3 bg-[#4da6ff]/40' : 'w-3 bg-white/[0.08]'
            }`}
          />
        ))}
      </div>

      {/* 图标 */}
      <div className="flex justify-center mb-4 opacity-80">
        {current.icon}
      </div>

      {/* 标题 */}
      <h2 className="text-base font-bold text-gray-100 text-center mb-3">
        {current.title}
      </h2>

      {/* 描述 */}
      <p className="text-xs text-gray-400 text-center mb-6 whitespace-pre-line leading-relaxed">
        {current.description}
      </p>

      {/* Step 1 的 API Key 输入 */}
      {step === 1 && (
        <div className="mb-4">
          <input
            type="text"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder="RGAPI-xxxxxxxx (可跳过，后续设置)"
            className="w-full"
          />
          <a
            href="https://developer.riotgames.com"
            target="_blank"
            rel="noreferrer"
            className="text-2xs text-blue-400 hover:underline mt-1.5 inline-block"
          >
            → 去申请 API Key
          </a>
        </div>
      )}

      {/* 按钮 */}
      <div className="flex gap-2">
        {!isLast && (
          <button
            onClick={onSkip}
            className="flex-1 text-xs text-gray-600 hover:text-gray-400 py-2 rounded-lg transition-colors"
          >
            跳过
          </button>
        )}
        <button
          onClick={handleNext}
          className={`flex-1 text-sm font-semibold py-2.5 rounded-lg transition-all ${
            isLast
              ? 'bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30'
              : 'bg-[#4da6ff] text-white hover:bg-[#3d96ef] shadow-lg shadow-blue-500/15'
          }`}
        >
          {isLast ? '开始使用' : '下一步'}
        </button>
      </div>
    </div>
  )
}

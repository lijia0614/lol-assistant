import type { RankInfo } from '../types'

/** 段位配置：颜色 + CSS 样式 */
const TIER_CONFIG: Record<string, { label: string; color: string; bg: string; ring: string; text: string }> = {
  IRON:         { label: 'Iron',     color: '#8B7D6B', bg: 'rgba(139,125,107,0.12)',  ring: 'rgba(139,125,107,0.3)',  text: '#9a8c7a' },
  BRONZE:       { label: 'Bronze',   color: '#CD7F32', bg: 'rgba(205,127,50,0.12)',   ring: 'rgba(205,127,50,0.35)',  text: '#d48d40' },
  SILVER:       { label: 'Silver',   color: '#B0B8C1', bg: 'rgba(176,184,193,0.10)',  ring: 'rgba(176,184,193,0.25)', text: '#c0c6cc' },
  GOLD:         { label: 'Gold',     color: '#F0C040', bg: 'rgba(240,192,64,0.12)',   ring: 'rgba(240,192,64,0.35)',  text: '#f5cc50' },
  PLATINUM:     { label: 'Platinum', color: '#08A88A', bg: 'rgba(8,168,138,0.12)',    ring: 'rgba(8,168,138,0.35)',   text: '#0ec0a0' },
  EMERALD:      { label: 'Emerald',  color: '#2DD46B', bg: 'rgba(45,212,107,0.12)',   ring: 'rgba(45,212,107,0.35)',  text: '#3de87a' },
  DIAMOND:      { label: 'Diamond',  color: '#66C0F0', bg: 'rgba(102,192,240,0.12)',  ring: 'rgba(102,192,240,0.35)', text: '#80d4ff' },
  MASTER:       { label: 'Master',   color: '#A855F7', bg: 'rgba(168,85,247,0.12)',   ring: 'rgba(168,85,247,0.35)',  text: '#b86ef8' },
  GRANDMASTER:  { label: 'GM',       color: '#EF4444', bg: 'rgba(239,68,68,0.12)',    ring: 'rgba(239,68,68,0.4)',    text: '#f25555' },
  CHALLENGER:   { label: 'Chall',    color: '#F4C430', bg: 'rgba(244,196,48,0.14)',   ring: 'rgba(244,196,48,0.45)',  text: '#fad040' },
}

interface RankBadgeProps {
  rank: RankInfo | null
  size?: 'sm' | 'md'
}

export default function RankBadge({ rank, size = 'sm' }: RankBadgeProps) {
  if (!rank) {
    const c = TIER_CONFIG.IRON
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-md font-semibold opacity-30 ${size === 'md' ? 'px-2 py-1 text-xs' : 'px-1.5 py-0.5 text-2xs'}`}
        style={{ background: c.bg, border: `1px solid ${c.ring}`, color: c.text }}
      >
        ···
      </span>
    )
  }

  const config = TIER_CONFIG[rank.tier]
  if (!config) {
    return <span className="text-2xs text-gray-500">{rank.tier}</span>
  }

  const isApex = ['MASTER', 'GRANDMASTER', 'CHALLENGER'].includes(rank.tier)
  const rankText = isApex ? `${rank.lp} LP` : `${rank.division}`
  const dims = size === 'md' ? 'w-5 h-5' : 'w-3.5 h-3.5'

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md font-semibold ${size === 'md' ? 'px-2 py-1 text-xs' : 'px-1.5 py-0.5 text-2xs'}`}
      style={{ background: config.bg, border: `1px solid ${config.ring}`, color: config.text }}
      title={`${rank.tier} ${rank.division} · ${rank.lp} LP`}
    >
      <RankShield tier={rank.tier} className={dims} />
      {rankText}
    </span>
  )
}

/** 段位盾形 SVG 图标 */
function RankShield({ tier, className }: { tier: string; className: string }) {
  const color = TIER_CONFIG[tier]?.color ?? '#666'

  switch (tier) {
    case 'IRON':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none">
          <path d="M12 2L3 7v6c0 5.5 3.8 10.7 9 12 5.2-1.3 9-6.5 9-12V7L12 2z" stroke={color} strokeWidth="1.5" fill="none"/>
          <path d="M8 12h8M12 8v8" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      )
    case 'BRONZE':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none">
          <path d="M12 2L3 7v6c0 5.5 3.8 10.7 9 12 5.2-1.3 9-6.5 9-12V7L12 2z" stroke={color} strokeWidth="1.5" fill="none"/>
          <path d="M8 14l4-6 4 6" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M9 13h6" stroke={color} strokeWidth="1" strokeLinecap="round"/>
        </svg>
      )
    case 'SILVER':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none">
          <path d="M12 2L3 7v6c0 5.5 3.8 10.7 9 12 5.2-1.3 9-6.5 9-12V7L12 2z" stroke={color} strokeWidth="1.5" fill="none"/>
          <path d="M9 14l3-4 3 4M9 13h6" stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    case 'GOLD':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none">
          <path d="M12 2L3 7v6c0 5.5 3.8 10.7 9 12 5.2-1.3 9-6.5 9-12V7L12 2z" stroke={color} strokeWidth="1.5" fill={`${color}20`}/>
          <path d="M12 7l4 4-2 6h-4l-2-6 4-4z" stroke={color} strokeWidth="1.3" fill={`${color}30`} strokeLinejoin="round"/>
        </svg>
      )
    case 'PLATINUM':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none">
          <path d="M12 2L3 7v6c0 5.5 3.8 10.7 9 12 5.2-1.3 9-6.5 9-12V7L12 2z" stroke={color} strokeWidth="1.5" fill="none"/>
          <path d="M8 16l2-8h4l2 8M9 13h6" stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    case 'EMERALD':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none">
          <path d="M12 2L3 7v6c0 5.5 3.8 10.7 9 12 5.2-1.3 9-6.5 9-12V7L12 2z" stroke={color} strokeWidth="1.5" fill={`${color}15`}/>
          <path d="M12 6l-3 6h2l1 4 1-4h2l-3-6z" stroke={color} strokeWidth="1.3" fill={`${color}25`} strokeLinejoin="round"/>
        </svg>
      )
    case 'DIAMOND':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none">
          <path d="M12 2L3 7v6c0 5.5 3.8 10.7 9 12 5.2-1.3 9-6.5 9-12V7L12 2z" stroke={color} strokeWidth="1.5" fill={`${color}12`}/>
          <path d="M12 5L7 12l5 7 5-7-5-7z" stroke={color} strokeWidth="1.3" fill={`${color}20`} strokeLinejoin="round"/>
        </svg>
      )
    case 'MASTER':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none">
          <path d="M12 2L3 7v6c0 5.5 3.8 10.7 9 12 5.2-1.3 9-6.5 9-12V7L12 2z" stroke={color} strokeWidth="1.5" fill={`${color}12`}/>
          <path d="M12 5c-3 0-5 2-5 5s2 5 5 5 5-2 5-5-2-5-5-5z" stroke={color} strokeWidth="1.3"/>
          <path d="M12 8v4M10 10h4" stroke={color} strokeWidth="1" strokeLinecap="round"/>
        </svg>
      )
    case 'GRANDMASTER':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none">
          <path d="M12 2L3 7v6c0 5.5 3.8 10.7 9 12 5.2-1.3 9-6.5 9-12V7L12 2z" stroke={color} strokeWidth="1.5" fill={`${color}08`}/>
          <path d="M12 5L9 10l-3 1 2 2-1 4 5-2 5 2-1-4 2-2-3-1-3-5z" stroke={color} strokeWidth="1.3" fill={`${color}15`} strokeLinejoin="round"/>
        </svg>
      )
    case 'CHALLENGER':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none">
          <path d="M12 2L3 7v6c0 5.5 3.8 10.7 9 12 5.2-1.3 9-6.5 9-12V7L12 2z" stroke={color} strokeWidth="1.5" fill={`${color}10`}/>
          <path d="M12 4l-2 7h4l-2 4h-3l-1 3h8l-1-3h-3l-2-4h4l-2-7z" stroke={color} strokeWidth="1" fill={`${color}20`} strokeLinejoin="round" strokeLinecap="round"/>
        </svg>
      )
    default:
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none">
          <path d="M12 2L3 7v6c0 5.5 3.8 10.7 9 12 5.2-1.3 9-6.5 9-12V7L12 2z" stroke={color} strokeWidth="1.5" fill="none"/>
        </svg>
      )
  }
}

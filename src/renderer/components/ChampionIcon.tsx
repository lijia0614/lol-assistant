import { useState } from 'react'

const CDN_BASE = 'https://ddragon.leagueoflegends.com/cdn'

// 常用英雄版本号（应用启动时更新，这里用最新稳定版）
let cachedVersion = '14.10.1'

/** 初始化 Data Dragon 版本号 */
export async function initChampionVersion(): Promise<void> {
  try {
    const resp = await fetch('https://ddragon.leagueoflegends.com/api/versions.json')
    const versions: string[] = await resp.json()
    cachedVersion = versions[0]
  } catch { /* use cached version */ }
}

interface ChampionIconProps {
  championId: number
  championName?: string | null
  size?: number
  className?: string
}

export default function ChampionIcon({ championId, championName, size = 32, className = '' }: ChampionIconProps) {
  const [error, setError] = useState(false)
  const src = `${CDN_BASE}/${cachedVersion}/img/champion/${getChampionKey(championId)}.png`

  if (error) {
    return (
      <div
        className={`rounded-full bg-white/[0.04] border border-white/[0.06] flex items-center justify-center flex-shrink-0 ${className}`}
        style={{ width: size, height: size }}
        title={championName ?? `英雄${championId}`}
      >
        <span className="text-2xs text-gray-600" style={{ fontSize: size * 0.32 }}>
          {championName?.charAt(0) ?? '?'}
        </span>
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={championName ?? ''}
      title={championName ?? `英雄 #${championId}`}
      width={size}
      height={size}
      className={`rounded-full flex-shrink-0 bg-white/[0.03] border border-white/[0.06] ${className}`}
      onError={() => setError(true)}
      loading="lazy"
    />
  )
}

/** championId → champion key 映射（Data Dragon 用 key 而非 id） */
function getChampionKey(id: number): string {
  return CHAMPION_KEY_MAP[id] ?? String(id)
}

/** 硬编码 championId → champion key 映射（TOP 50 常用英雄） */
const CHAMPION_KEY_MAP: Record<number, string> = {
  1: 'Annie', 4: 'Chogath', 7: 'Leblanc', 11: 'MasterYi',
  18: 'Tristana', 22: 'Ashe', 24: 'Jax', 25: 'Morgana',
  37: 'Sona', 39: 'Irelia', 40: 'Janna', 41: 'Gangplank',
  51: 'Twitch', 53: 'Blitzcrank', 55: 'Katarina', 57: 'Maokai',
  63: 'Brand', 64: 'LeeSin', 67: 'Vayne', 81: 'Ezreal',
  86: 'Garen', 89: 'Leona', 92: 'Riven', 96: 'KogMaw',
  103: 'Ahri', 104: 'Graves', 105: 'Fizz', 114: 'Fiora',
  117: 'Karma', 119: 'Lissandra', 122: 'Darius', 131: 'Diana',
  141: 'Zed', 142: 'Zoe', 145: 'Xayah', 147: 'Zac',
  150: 'Gnar', 154: 'Urgot', 157: 'Yasuo', 202: 'Jhin',
  222: 'Jinx', 223: 'TahmKench', 235: 'Senna',
  236: 'Lucian', 238: 'Yone', 240: 'Kennen', 245: 'Ekko',
  266: 'Aatrox', 267: 'Nami', 350: 'Yuumi', 360: 'Urgot',
  412: 'Thresh', 421: 'Khazix', 427: 'LeeSin', 429: 'Kalista',
  432: 'Bard', 497: 'Zac', 498: 'Lucian', 516: 'Jayce',
  517: 'Elise', 518: 'Illaoi', 523: 'Tristana', 526: 'Malphite',
  555: 'Nasus', 777: 'Yasuo', 875: 'Neeko', 876: 'TahmKench',
  887: 'Aphelios',
}

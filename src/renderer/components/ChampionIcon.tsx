import { useState, useEffect } from 'react'

const CDN_BASE = 'https://ddragon.leagueoflegends.com/cdn'
let cachedVersion = ''

/** 初始化 Data Dragon 版本号（首次调用时 fetch） */
let versionPromise: Promise<void> | null = null
function ensureVersion(): Promise<void> {
  if (cachedVersion) return Promise.resolve()
  if (!versionPromise) {
    versionPromise = fetch('https://ddragon.leagueoflegends.com/api/versions.json')
      .then(r => r.json())
      .then((versions: string[]) => { cachedVersion = versions[0] })
      .catch(() => { cachedVersion = '16.11.1' }) // fallback
  }
  return versionPromise
}

interface ChampionIconProps {
  championId: number | null
  championName?: string | null
  size?: number
  className?: string
}

export default function ChampionIcon({ championId, championName, size = 32, className = '' }: ChampionIconProps) {
  const [error, setError] = useState(false)
  const [version, setVersion] = useState(cachedVersion)

  useEffect(() => {
    ensureVersion().then(() => setVersion(cachedVersion))
  }, [])

  // 无效 championId → 直接显示占位
  if (!championId || championId <= 0 || error) {
    return <FallbackAvatar name={championName} size={size} className={className} />
  }

  const key = getChampionKey(championId)
  const src = version ? `${CDN_BASE}/${version}/img/champion/${key}.png` : ''

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
      crossOrigin="anonymous"
    />
  )
}

function FallbackAvatar({ name, size, className }: { name?: string | null; size: number; className: string }) {
  const letter = name?.charAt(0) ?? '?'
  const colors = ['#4da6ff', '#ff4d4d', '#f0c040', '#4ade80', '#a855f7', '#f472b6']
  const color = colors[letter.charCodeAt(0) % colors.length]

  return (
    <div
      className={`rounded-full flex items-center justify-center flex-shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        background: `rgba(255,255,255,0.04)`,
        border: `1px solid ${color}40`,
        color,
        fontSize: size * 0.38,
        fontWeight: 600,
      }}
      title={name ?? '未知英雄'}
    >
      {letter}
    </div>
  )
}

/** championId → champion key 映射（Data Dragon 用 key 而非 id） */
function getChampionKey(id: number): string {
  return CHAMPION_KEY_MAP[id] ?? String(id)
}

/** 硬编码 championId → champion key 映射（全量 173 英雄） */
const CHAMPION_KEY_MAP: Record<number, string> = {
  1: 'Annie', 2: 'Olaf', 3: 'Galio', 4: 'TwistedFate',
  5: 'XinZhao', 6: 'Urgot', 7: 'Leblanc', 8: 'Vladimir',
  9: 'Fiddlesticks', 10: 'Kayle', 11: 'MasterYi', 12: 'Alistar',
  13: 'Ryze', 14: 'Sion', 15: 'Sivir', 16: 'Soraka',
  17: 'Teemo', 18: 'Tristana', 19: 'Warwick', 20: 'Nunu',
  21: 'MissFortune', 22: 'Ashe', 23: 'Tryndamere', 24: 'Jax',
  25: 'Morgana', 26: 'Zilean', 27: 'Singed', 28: 'Evelynn',
  29: 'Twitch', 30: 'Karthus', 31: 'Chogath', 32: 'Amumu',
  33: 'Rammus', 34: 'Anivia', 35: 'Shaco', 36: 'DrMundo',
  37: 'Sona', 38: 'Kassadin', 39: 'Irelia', 40: 'Janna',
  41: 'Gangplank', 42: 'Corki', 43: 'Karma', 44: 'Taric',
  45: 'Veigar', 48: 'Trundle', 50: 'Swain', 51: 'Caitlyn',
  53: 'Blitzcrank', 54: 'Malphite', 55: 'Katarina', 56: 'Nocturne',
  57: 'Maokai', 58: 'Renekton', 59: 'JarvanIV', 60: 'Elise',
  61: 'Orianna', 62: 'MonkeyKing', 63: 'Brand', 64: 'LeeSin',
  67: 'Vayne', 68: 'Rumble', 69: 'Cassiopeia', 72: 'Skarner',
  74: 'Heimerdinger', 75: 'Nasus', 76: 'Nidalee', 77: 'Udyr',
  78: 'Poppy', 79: 'Gragas', 80: 'Pantheon', 81: 'Ezreal',
  82: 'Mordekaiser', 83: 'Yorick', 84: 'Akali', 85: 'Kennen',
  86: 'Garen', 89: 'Leona', 90: 'Malzahar', 91: 'Talon',
  92: 'Riven', 96: 'KogMaw', 98: 'Shen', 99: 'Lux',
  101: 'Xerath', 102: 'Shyvana', 103: 'Ahri', 104: 'Graves',
  105: 'Fizz', 106: 'Volibear', 107: 'Rengar', 110: 'Varus',
  111: 'Nautilus', 112: 'Viktor', 113: 'Sejuani', 114: 'Fiora',
  115: 'Ziggs', 117: 'Lulu', 119: 'Draven', 120: 'Hecarim',
  121: 'Khazix', 122: 'Darius', 126: 'Jayce', 127: 'Lissandra',
  131: 'Diana', 133: 'Quinn', 134: 'Syndra', 136: 'AurelionSol',
  141: 'Zed', 142: 'Zoe', 143: 'Zyra', 145: 'Kaisa',
  147: 'Seraphine', 150: 'Gnar', 154: 'Zac', 157: 'Yasuo',
  161: 'Velkoz', 163: 'Taliyah', 164: 'Camille', 166: 'Akshan',
  200: 'Belveth', 201: 'Braum', 202: 'Jhin', 203: 'Kindred',
  221: 'Zeri', 222: 'Jinx', 223: 'TahmKench', 233: 'Briar',
  234: 'Viego', 235: 'Senna', 236: 'Lucian', 238: 'Zed',
  240: 'Kled', 245: 'Ekko', 246: 'Qiyana', 254: 'Vi',
  266: 'Aatrox', 267: 'Nami', 268: 'Azir', 350: 'Yuumi',
  360: 'Samira', 412: 'Thresh', 420: 'Illaoi', 421: 'RekSai',
  427: 'Ivern', 429: 'Kalista', 432: 'Bard', 497: 'Rakan',
  498: 'Xayah', 516: 'Ornn', 517: 'Sylas', 518: 'Neeko',
  523: 'Aphelios', 526: 'Rell', 555: 'Pyke', 711: 'Vex',
  777: 'Yone', 875: 'Sett', 876: 'Lillia', 887: 'Gwen',
  888: 'Renata', 893: 'RenataGlasc', 895: 'Nilah', 897: 'KSante',
  901: 'Milio', 902: 'Naafiri', 910: 'Hwei', 950: 'Smolder',
  951: 'Aurora', 952: 'Mel', 953: 'Ambessa',
}

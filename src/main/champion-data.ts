interface ChampionMap {
  [id: string]: string  // championId(string) → championName
}

let championMap: ChampionMap | null = null

/** 从 Data Dragon 获取英雄名称映射（内置缓存） */
export async function getChampionNames(): Promise<ChampionMap> {
  if (championMap) return championMap

  try {
    const versionsResp = await fetch('https://ddragon.leagueoflegends.com/api/versions.json')
    const versions: string[] = await versionsResp.json()
    const latest = versions[0]

    const champsResp = await fetch(
      `https://ddragon.leagueoflegends.com/cdn/${latest}/data/zh_CN/champion.json`
    )
    const champsData = await champsResp.json()

    championMap = {}
    for (const champ of Object.values<any>(champsData.data)) {
      championMap[String(champ.key)] = champ.name
    }

    return championMap
  } catch {
    championMap = FALLBACK_CHAMPION_MAP
    return championMap
  }
}

/** 硬编码回退映射（常用英雄） */
const FALLBACK_CHAMPION_MAP: ChampionMap = {
  '1': '黑暗之女', '4': '虚空恐惧', '7': '诡术妖姬', '11': '无极剑圣',
  '18': '麦林炮手', '22': '寒冰射手', '24': '武器大师', '25': '堕落天使',
  '37': '琴瑟仙女', '39': '刀锋舞者', '40': '风暴之怒', '41': '海洋之灾',
  '51': '瘟疫之源', '53': '蒸汽机器人', '55': '不祥之刃', '57': '茂凯',
  '63': '复仇焰魂', '64': '盲僧', '67': '暗夜猎手', '81': '探险家',
  '86': '德玛西亚之力', '89': '曙光女神', '92': '放逐之刃', '96': '深渊巨口',
  '103': '九尾妖狐', '104': '法外狂徒', '105': '潮汐海灵', '114': '无双剑姬',
  '117': '天启者', '119': '寒冰女王', '122': '诺克萨斯之手', '131': '皎月女神',
  '141': '影流之主', '142': '暮光星灵', '145': '逆羽', '147': '生化魔人',
  '150': '迷失之牙', '154': '生化领主', '157': '疾风剑豪', '202': '戏命师',
  '222': '暴走萝莉', '223': '河流之王', '235': '涤魂圣枪',
  '236': '圣枪游侠', '238': '影哨', '240': '狂暴之心', '245': '时间刺客',
  '266': '暗裔剑魔', '267': '唤潮鲛姬', '350': '魔法猫咪', '360': '荒漠屠夫',
  '412': '魂锁典狱长', '421': '虚空掠夺者', '427': '盲僧', '429': '复仇之矛',
  '432': '星界游神', '497': '生化魔人', '498': '圣枪游侠', '516': '未来守护者',
  '517': '蜘蛛女皇', '518': '海兽祭司', '523': '麦林炮手', '526': '熔岩巨兽',
  '555': '沙漠死神', '777': '疾风剑豪', '875': '万花通灵', '876': '河流之王',
  '887': '残月之肃',
}

// 25只怪物定义 - 1费到5费各5种
const MONSTERS = [
  // === 1费怪物 ===
  {
    id: 'selina',
    name: '阳光骑士',
    title: '赛琳娜·阳曦',
    cost: 1,
    baseHp: 550, baseAtk: 30, atkSpeed: 0.6, range: 1,
    armor: 5, magicResist: 5,
    maxMana: 80, startMana: 0,
    isRanged: false,
    color: '#FFD700',
    skill: {
      name: '圣光打击',
      description: '对目标造成魔法伤害并恢复自身生命值',
      damageType: 'magic',
      damage: 80,
      targetType: 'single',
      heal: 60,
      manaCost: 80
    }
  },
  {
    id: 'liana',
    name: '风语射手',
    title: '莉娅娜·风息',
    cost: 1,
    baseHp: 450, baseAtk: 35, atkSpeed: 0.7, range: 4,
    armor: 3, magicResist: 3,
    maxMana: 60, startMana: 0,
    isRanged: true,
    color: '#90EE90',
    skill: {
      name: '穿透之箭',
      description: '射出一支穿透箭，对直线上敌人造成物理伤害',
      damageType: 'physical',
      damage: 70,
      targetType: 'line',
      manaCost: 60
    }
  },
  {
    id: 'meru',
    name: '稚气书生',
    title: '梅露·奥秘',
    cost: 1,
    baseHp: 400, baseAtk: 28, atkSpeed: 0.65, range: 3,
    armor: 2, magicResist: 8,
    maxMana: 50, startMana: 0,
    isRanged: true,
    color: '#DDA0DD',
    skill: {
      name: '奥术飞弹',
      description: '发射奥术飞弹，对目标造成魔法伤害',
      damageType: 'magic',
      damage: 90,
      targetType: 'single',
      manaCost: 50
    }
  },
  {
    id: 'leo',
    name: '街头修补匠',
    title: '里奥·干净者',
    cost: 1,
    baseHp: 600, baseAtk: 28, atkSpeed: 0.55, range: 1,
    armor: 8, magicResist: 3,
    maxMana: 70, startMana: 0,
    isRanged: false,
    color: '#CD853F',
    skill: {
      name: '爆裂扳手',
      description: '投掷爆裂扳手，对范围内敌人造成物理伤害',
      damageType: 'physical',
      damage: 60,
      targetType: 'aoe',
      aoeRadius: 1,
      manaCost: 70
    }
  },
  {
    id: 'thomas',
    name: '金色大亨',
    title: '托马斯·金库',
    cost: 1,
    baseHp: 500, baseAtk: 25, atkSpeed: 0.5, range: 1,
    armor: 10, magicResist: 5,
    maxMana: 90, startMana: 0,
    isRanged: false,
    color: '#FFD700',
    skill: {
      name: '金币猛击',
      description: '用金币猛击目标，造成物理伤害',
      damageType: 'physical',
      damage: 100,
      targetType: 'single',
      manaCost: 90
    }
  },

  // === 2费怪物 ===
  {
    id: 'kevin',
    name: '秘银之剑',
    title: '凯文·瓦伦丁',
    cost: 2,
    baseHp: 650, baseAtk: 42, atkSpeed: 0.65, range: 1,
    armor: 12, magicResist: 8,
    maxMana: 70, startMana: 0,
    isRanged: false,
    color: '#C0C0C0',
    skill: {
      name: '秘银斩击',
      description: '秘银之剑的强力斩击，造成物理伤害',
      damageType: 'physical',
      damage: 120,
      targetType: 'single',
      manaCost: 70
    }
  },
  {
    id: 'kane',
    name: '寂静之刃',
    title: '凯恩·黑钢',
    cost: 2,
    baseHp: 550, baseAtk: 50, atkSpeed: 0.75, range: 1,
    armor: 6, magicResist: 6,
    maxMana: 60, startMana: 0,
    isRanged: false,
    color: '#2F4F4F',
    skill: {
      name: '暗影突袭',
      description: '瞬移至最弱敌人身后进行暗影打击，造成物理伤害',
      damageType: 'physical',
      damage: 140,
      targetType: 'single',
      isAssassin: true,
      manaCost: 60
    }
  },
  {
    id: 'selena_rock',
    name: '岩影使者',
    title: '赛勒娜·岩影',
    cost: 2,
    baseHp: 800, baseAtk: 30, atkSpeed: 0.5, range: 1,
    armor: 20, magicResist: 10,
    maxMana: 80, startMana: 0,
    isRanged: false,
    color: '#8B7355',
    skill: {
      name: '岩石护盾',
      description: '获得岩石护盾，减少受到的伤害并对周围敌人造成魔法伤害',
      damageType: 'magic',
      damage: 50,
      targetType: 'aoe',
      aoeRadius: 1,
      shield: 150,
      manaCost: 80
    }
  },
  {
    id: 'viola',
    name: '苍锋之刃',
    title: '维奥拉·苍锋',
    cost: 2,
    baseHp: 600, baseAtk: 45, atkSpeed: 0.7, range: 1,
    armor: 10, magicResist: 6,
    maxMana: 65, startMana: 0,
    isRanged: false,
    color: '#87CEEB',
    skill: {
      name: '疾风斩',
      description: '释放疾风斩，对前方直线敌人造成物理伤害',
      damageType: 'physical',
      damage: 110,
      targetType: 'line',
      manaCost: 65
    }
  },
  {
    id: 'evelyn',
    name: '星辉学者',
    title: '伊芙琳·墨书',
    cost: 2,
    baseHp: 500, baseAtk: 38, atkSpeed: 0.65, range: 3,
    armor: 4, magicResist: 15,
    maxMana: 60, startMana: 10,
    isRanged: true,
    color: '#9370DB',
    skill: {
      name: '星辰弹幕',
      description: '召唤星辰弹幕，对范围内敌人造成魔法伤害',
      damageType: 'magic',
      damage: 100,
      targetType: 'aoe',
      aoeRadius: 2,
      manaCost: 60
    }
  },

  // === 3费怪物 ===
  {
    id: 'reign',
    name: '影啸之牙',
    title: '雷恩·影啸',
    cost: 3,
    baseHp: 700, baseAtk: 55, atkSpeed: 0.7, range: 1,
    armor: 10, magicResist: 10,
    maxMana: 70, startMana: 0,
    isRanged: false,
    color: '#4B0082',
    skill: {
      name: '暗影獠牙',
      description: '以暗影獠牙撕裂目标，造成大量物理伤害',
      damageType: 'physical',
      damage: 180,
      targetType: 'single',
      manaCost: 70
    }
  },
  {
    id: 'lunaris',
    name: '夜影之瞳',
    title: '露娜莉丝·夜影',
    cost: 3,
    baseHp: 600, baseAtk: 48, atkSpeed: 0.7, range: 1,
    armor: 8, magicResist: 15,
    maxMana: 75, startMana: 10,
    isRanged: false,
    color: '#191970',
    skill: {
      name: '暗夜凝视',
      description: '释放暗夜之力，对周围敌人造成魔法伤害',
      damageType: 'magic',
      damage: 150,
      targetType: 'aoe',
      aoeRadius: 2,
      manaCost: 75
    }
  },
  {
    id: 'ariel',
    name: '空灵之光',
    title: '艾瑞尔·星光',
    cost: 3,
    baseHp: 550, baseAtk: 50, atkSpeed: 0.65, range: 4,
    armor: 5, magicResist: 20,
    maxMana: 80, startMana: 10,
    isRanged: true,
    color: '#E0FFFF',
    skill: {
      name: '空灵射线',
      description: '发射空灵射线，对直线上敌人造成魔法伤害',
      damageType: 'magic',
      damage: 170,
      targetType: 'line',
      manaCost: 80
    }
  },
  {
    id: 'aliya',
    name: '星辉之誓',
    title: '艾莉娅·星辉',
    cost: 3,
    baseHp: 580, baseAtk: 45, atkSpeed: 0.6, range: 3,
    armor: 6, magicResist: 22,
    maxMana: 90, startMana: 15,
    isRanged: true,
    color: '#BA55D3',
    skill: {
      name: '星辰陨落',
      description: '召唤星辰陨落，对大范围敌人造成魔法伤害',
      damageType: 'magic',
      damage: 160,
      targetType: 'aoe',
      aoeRadius: 2,
      manaCost: 90
    }
  },
  {
    id: 'yanli',
    name: '烈焰魔女',
    title: '炎莉·绯影',
    cost: 3,
    baseHp: 520, baseAtk: 52, atkSpeed: 0.65, range: 3,
    armor: 4, magicResist: 18,
    maxMana: 70, startMana: 10,
    isRanged: true,
    color: '#FF4500',
    skill: {
      name: '烈焰爆发',
      description: '引爆烈焰，对范围内敌人造成魔法伤害',
      damageType: 'magic',
      damage: 180,
      targetType: 'aoe',
      aoeRadius: 1,
      manaCost: 70
    }
  },

  // === 4费怪物 ===
  {
    id: 'aphrodite',
    name: '万爱之母',
    title: '阿芙洛狄忒·爱慕',
    cost: 4,
    baseHp: 850, baseAtk: 60, atkSpeed: 0.65, range: 3,
    armor: 10, magicResist: 25,
    maxMana: 100, startMana: 20,
    isRanged: true,
    color: '#FF69B4',
    skill: {
      name: '爱的拥抱',
      description: '以爱之力治愈友军并对敌人造成魔法伤害',
      damageType: 'magic',
      damage: 150,
      targetType: 'aoe',
      aoeRadius: 2,
      heal: 200,
      manaCost: 100
    }
  },
  {
    id: 'arachne',
    name: '蛛网主宰',
    title: '阿拉克涅·维莱诺·蛛后',
    cost: 4,
    baseHp: 900, baseAtk: 58, atkSpeed: 0.6, range: 1,
    armor: 18, magicResist: 15,
    maxMana: 80, startMana: 10,
    isRanged: false,
    color: '#8B0000',
    skill: {
      name: '蛛网陷阱',
      description: '编织蛛网困住敌人，造成物理伤害并眩晕',
      damageType: 'physical',
      damage: 180,
      targetType: 'aoe',
      aoeRadius: 2,
      stunDuration: 2,
      manaCost: 80
    }
  },
  {
    id: 'garu',
    name: '血腥收割者',
    title: '加鲁·野蛮行者',
    cost: 4,
    baseHp: 950, baseAtk: 70, atkSpeed: 0.7, range: 1,
    armor: 15, magicResist: 10,
    maxMana: 85, startMana: 0,
    isRanged: false,
    color: '#8B0000',
    skill: {
      name: '血腥收割',
      description: '挥舞巨斧收割生命，对范围内敌人造成物理伤害',
      damageType: 'physical',
      damage: 220,
      targetType: 'aoe',
      aoeRadius: 1,
      manaCost: 85
    }
  },
  {
    id: 'lilith',
    name: '魔物之隙',
    title: '莉莉丝·薇薇安',
    cost: 4,
    baseHp: 700, baseAtk: 65, atkSpeed: 0.75, range: 1,
    armor: 8, magicResist: 20,
    maxMana: 75, startMana: 15,
    isRanged: false,
    color: '#800080',
    skill: {
      name: '魔界裂隙',
      description: '打开魔界裂隙，对目标造成大量魔法伤害',
      damageType: 'magic',
      damage: 280,
      targetType: 'single',
      manaCost: 75
    }
  },
  {
    id: 'lingyun',
    name: '苍穹之翼',
    title: '凌云·天翔',
    cost: 4,
    baseHp: 800, baseAtk: 62, atkSpeed: 0.7, range: 1,
    armor: 12, magicResist: 15,
    maxMana: 90, startMana: 10,
    isRanged: false,
    color: '#00BFFF',
    skill: {
      name: '天降正义',
      description: '跃向天空后俯冲攻击，对范围内敌人造成物理伤害',
      damageType: 'physical',
      damage: 200,
      targetType: 'aoe',
      aoeRadius: 2,
      manaCost: 90
    }
  },

  // === 5费怪物 ===
  {
    id: 'ancient',
    name: '阴影商贩',
    title: '古老者·阴影商贩',
    cost: 5,
    baseHp: 900, baseAtk: 70, atkSpeed: 0.65, range: 3,
    armor: 15, magicResist: 30,
    maxMana: 100, startMana: 20,
    isRanged: true,
    color: '#1C1C1C',
    skill: {
      name: '暗影交易',
      description: '以暗影之力交易生命，对大范围敌人造成魔法伤害',
      damageType: 'magic',
      damage: 250,
      targetType: 'aoe',
      aoeRadius: 3,
      manaCost: 100
    }
  },
  {
    id: 'kelvin',
    name: '暮色幽影',
    title: '凯尔文·暗影编织者',
    cost: 5,
    baseHp: 850, baseAtk: 65, atkSpeed: 0.6, range: 3,
    armor: 12, magicResist: 35,
    maxMana: 110, startMana: 25,
    isRanged: true,
    color: '#2E0854',
    skill: {
      name: '暮光编织',
      description: '编织暮光之网，对范围内敌人造成大量魔法伤害',
      damageType: 'magic',
      damage: 280,
      targetType: 'aoe',
      aoeRadius: 2,
      manaCost: 110
    }
  },
  {
    id: 'lulubell',
    name: '甜心异形',
    title: '露露贝尔·吉利斯·星间软泥',
    cost: 5,
    baseHp: 1100, baseAtk: 55, atkSpeed: 0.55, range: 3,
    armor: 25, magicResist: 30,
    maxMana: 120, startMana: 30,
    isRanged: true,
    color: '#FFB6C1',
    skill: {
      name: '星间软泥',
      description: '释放星间软泥，对范围内敌人造成魔法伤害并减速',
      damageType: 'magic',
      damage: 220,
      targetType: 'aoe',
      aoeRadius: 3,
      slowDuration: 3,
      manaCost: 120
    }
  },
  {
    id: 'halos',
    name: '冥界之主',
    title: '冥王骷髅·哈洛斯',
    cost: 5,
    baseHp: 1000, baseAtk: 75, atkSpeed: 0.6, range: 4,
    armor: 18, magicResist: 28,
    maxMana: 130, startMana: 30,
    isRanged: true,
    color: '#3C3C3C',
    skill: {
      name: '死亡领域',
      description: '展开死亡领域，对大范围敌人造成毁灭性魔法伤害',
      damageType: 'magic',
      damage: 350,
      targetType: 'aoe',
      aoeRadius: 3,
      manaCost: 130
    }
  },
  {
    id: 'ignis',
    name: '炎狱领主',
    title: '伊格尼斯·地狱之火',
    cost: 5,
    baseHp: 1050, baseAtk: 80, atkSpeed: 0.65, range: 3,
    armor: 20, magicResist: 25,
    maxMana: 120, startMana: 20,
    isRanged: true,
    color: '#FF0000',
    skill: {
      name: '地狱之火',
      description: '召唤地狱烈焰焚烧一切，对范围内敌人造成巨大魔法伤害',
      damageType: 'magic',
      damage: 320,
      targetType: 'aoe',
      aoeRadius: 3,
      manaCost: 120
    }
  }
];

// 星级倍率
const STAR_MULTIPLIERS = {
  1: { hp: 1.0, atk: 1.0 },
  2: { hp: 1.8, atk: 1.5 },
  3: { hp: 3.2, atk: 2.5 }
};

// 等级对应的刷新概率 [1费%, 2费%, 3费%, 4费%, 5费%]
const LEVEL_ODDS = {
  1:  [100, 0, 0, 0, 0],
  2:  [80, 20, 0, 0, 0],
  3:  [70, 25, 5, 0, 0],
  4:  [50, 30, 15, 5, 0],
  5:  [35, 30, 20, 10, 5],
  6:  [20, 30, 25, 15, 10],
  7:  [15, 20, 30, 20, 15],
  8:  [10, 15, 25, 25, 25],
  9:  [5, 10, 20, 30, 35],
  10: [0, 5, 15, 30, 50]
};

// 每个费用在牌库中的数量
const DECK_COUNTS = {
  1: 9,   // 1费怪每种9张
  2: 7,   // 2费怪每种7张
  3: 5,   // 3费怪每种5张
  4: 3,   // 4费怪每种3张
  5: 2    // 5费怪每种2张
};

// 升级所需经验
const LEVEL_XP = {
  1: 0,
  2: 2,
  3: 6,
  4: 10,
  5: 20,
  6: 32,
  7: 46,
  8: 64,
  9: 86,
  10: 110
};

module.exports = { MONSTERS, STAR_MULTIPLIERS, LEVEL_ODDS, DECK_COUNTS, LEVEL_XP };

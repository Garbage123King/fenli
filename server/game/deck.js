const { MONSTERS, LEVEL_ODDS, DECK_COUNTS } = require('../data/monsters');

class Deck {
  constructor() {
    // 初始化牌库：每种怪物有对应数量的副本
    this.pool = {};
    this.initPool();
  }

  initPool() {
    this.pool = {};
    for (const monster of MONSTERS) {
      this.pool[monster.id] = DECK_COUNTS[monster.cost];
    }
  }

  // 根据等级获取刷新概率
  getOdds(level) {
    return LEVEL_ODDS[Math.min(level, 10)] || LEVEL_ODDS[10];
  }

  // 从牌库中随机抽取一只怪物（按等级概率）
  drawOne(level) {
    const odds = this.getOdds(level);
    // 决定费用
    const roll = Math.random() * 100;
    let cumulative = 0;
    let targetCost = 1;
    for (let i = 0; i < odds.length; i++) {
      cumulative += odds[i];
      if (roll < cumulative) {
        targetCost = i + 1;
        break;
      }
    }

    // 从该费用的怪物中随机选一个（牌库中还有剩余的）
    const available = MONSTERS.filter(m => m.cost === targetCost && (this.pool[m.id] || 0) > 0);
    if (available.length === 0) {
      // 如果该费用没有可用怪物，尝试其他费用
      const allAvailable = MONSTERS.filter(m => (this.pool[m.id] || 0) > 0);
      if (allAvailable.length === 0) return null;
      return this.drawSpecific(allAvailable[Math.floor(Math.random() * allAvailable.length)].id);
    }

    const chosen = available[Math.floor(Math.random() * available.length)];
    return this.drawSpecific(chosen.id);
  }

  // 抽取指定ID的怪物
  drawSpecific(monsterId) {
    if (!this.pool[monsterId] || this.pool[monsterId] <= 0) return null;
    this.pool[monsterId]--;
    const template = MONSTERS.find(m => m.id === monsterId);
    if (!template) return null;
    return {
      ...template,
      uid: `${monsterId}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      star: 1
    };
  }

  // 将怪物放回牌库
  returnMonster(monsterId) {
    if (this.pool[monsterId] !== undefined) {
      this.pool[monsterId]++;
    }
  }

  // 刷新商店（5只）
  refreshShop(level) {
    const shop = [];
    for (let i = 0; i < 5; i++) {
      const monster = this.drawOne(level);
      if (monster) shop.push(monster);
    }
    return shop;
  }

  // 将商店中未购买的怪物放回牌库
  returnShopMonsters(shop) {
    for (const monster of shop) {
      if (monster) {
        this.returnMonster(monster.id);
      }
    }
  }

  // 获取牌库状态
  getPoolStatus() {
    return { ...this.pool };
  }
}

module.exports = Deck;

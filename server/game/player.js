const { MONSTERS, STAR_MULTIPLIERS, LEVEL_XP } = require('../data/monsters');

class Player {
  constructor(id, name) {
    this.id = id;
    this.name = name;
    this.hp = 100;
    this.level = 1;
    this.xp = 0;
    this.gold = 10;
    this.round = 0;
    this.streak = 0; // 正数为连胜，负数为连败
    this.board = [];   // 棋盘上的怪物 [{uid, id, star, row, col}]
    this.bench = [];   // 备战区的怪物 [{uid, id, star}] (最多9个)
    this.shop = [];    // 商店中的怪物
    this.isAlive = true;
  }

  // 获取升级所需经验
  getXpToLevel() {
    if (this.level >= 10) return Infinity;
    return LEVEL_XP[this.level + 1] - this.xp;
  }

  // 增加经验
  addXp(amount) {
    this.xp += amount;
    let leveledUp = false;
    while (this.level < 10 && this.xp >= LEVEL_XP[this.level + 1]) {
      this.level++;
      leveledUp = true;
    }
    return leveledUp;
  }

  // 刷新商店（消耗2金币）
  canRefreshShop() {
    return this.gold >= 2;
  }

  refreshShop(deck) {
    if (!this.canRefreshShop()) return false;
    // 先把旧商店的怪物放回牌库
    deck.returnShopMonsters(this.shop);
    this.gold -= 2;
    this.shop = deck.refreshShop(this.level);
    return true;
  }

  // 升级（消耗4金币获得4经验）
  canLevelUp() {
    return this.gold >= 4 && this.level < 10;
  }

  buyXp() {
    if (!this.canLevelUp()) return false;
    this.gold -= 4;
    return this.addXp(4);
  }

  // 购买怪物
  canBuyMonster(shopIndex) {
    if (shopIndex < 0 || shopIndex >= this.shop.length) return false;
    const monster = this.shop[shopIndex];
    if (!monster) return false;
    if (this.gold < monster.cost) return false;
    if (this.bench.length >= 9) return false;
    return true;
  }

  buyMonster(shopIndex) {
    if (!this.canBuyMonster(shopIndex)) return null;
    const monster = this.shop[shopIndex];
    this.gold -= monster.cost;
    this.bench.push({
      uid: monster.uid,
      id: monster.id,
      star: monster.star
    });
    this.shop[shopIndex] = null;
    // 检查合成
    this.checkMerge();
    return monster;
  }

  // 卖出怪物（获得其费用金币）
  sellMonster(uid) {
    // 检查棋盘
    const boardIdx = this.board.findIndex(m => m.uid === uid);
    if (boardIdx !== -1) {
      const monster = this.board[boardIdx];
      const template = MONSTERS.find(m => m.id === monster.id);
      const sellPrice = template ? template.cost * monster.star : 1;
      this.gold += sellPrice;
      this.board.splice(boardIdx, 1);
      return sellPrice;
    }

    // 检查备战区
    const benchIdx = this.bench.findIndex(m => m.uid === uid);
    if (benchIdx !== -1) {
      const monster = this.bench[benchIdx];
      const template = MONSTERS.find(m => m.id === monster.id);
      const sellPrice = template ? template.cost * monster.star : 1;
      this.gold += sellPrice;
      this.bench.splice(benchIdx, 1);
      return sellPrice;
    }

    return 0;
  }

  // 从备战区放到棋盘
  benchToBoard(benchIndex, row, col) {
    if (benchIndex < 0 || benchIndex >= this.bench.length) return false;
    if (this.board.length >= this.level) return false; // 棋盘上怪物数不能超过等级

    const monster = this.bench[benchIndex];
    // 检查位置是否已被占据
    if (this.board.some(m => m.row === row && m.col === col)) return false;
    // 检查位置是否在玩家区域（行4-7，玩家在下半区）
    if (row < 4 || row > 7) return false;

    monster.row = row;
    monster.col = col;
    this.board.push(monster);
    this.bench.splice(benchIndex, 1);
    return true;
  }

  // 从棋盘放回备战区
  boardToBench(uid) {
    if (this.bench.length >= 9) return false;
    const idx = this.board.findIndex(m => m.uid === uid);
    if (idx === -1) return false;

    const monster = this.board[idx];
    delete monster.row;
    delete monster.col;
    this.bench.push(monster);
    this.board.splice(idx, 1);
    return true;
  }

  // 在棋盘上移动怪物
  moveOnBoard(uid, newRow, newCol) {
    const monster = this.board.find(m => m.uid === uid);
    if (!monster) return false;
    // 检查目标位置
    if (newRow < 4 || newRow > 7) return false;
    if (this.board.some(m => m.uid !== uid && m.row === newRow && m.col === newCol)) return false;
    monster.row = newRow;
    monster.col = newCol;
    return true;
  }

  // 交换棋盘和备战区的怪物
  swapBoardBench(boardUid, benchIndex) {
    const boardMonster = this.board.find(m => m.uid === boardUid);
    const benchMonster = this.bench[benchIndex];
    if (!boardMonster || !benchMonster) return false;

    // 交换
    const { row, col } = boardMonster;
    delete boardMonster.row;
    delete boardMonster.col;
    benchMonster.row = row;
    benchMonster.col = col;

    const boardIdx = this.board.indexOf(boardMonster);
    this.board.splice(boardIdx, 1);
    this.board.push(benchMonster);
    this.bench.splice(benchIndex, 1);
    this.bench.push(boardMonster);
    return true;
  }

  // 检查并执行合成
  checkMerge() {
    let merged = true;
    while (merged) {
      merged = false;
      // 检查3星合成（3个2星合为3星）
      merged = this.tryMerge(3, 2) || merged;
      // 检查2星合成（3个1星合为2星）
      merged = this.tryMerge(2, 1) || merged;
    }
  }

  tryMerge(targetStar, sourceStar) {
    // 找出所有相同ID且相同星级的怪物
    const allUnits = [...this.board, ...this.bench];
    const groups = {};
    for (const unit of allUnits) {
      if (unit.star !== sourceStar) continue;
      if (!groups[unit.id]) groups[unit.id] = [];
      groups[unit.id].push(unit);
    }

    for (const [id, units] of Object.entries(groups)) {
      if (units.length >= 3) {
        // 合成！保留第一个，删除其他两个
        const keep = units[0];
        keep.star = targetStar;

        // 从棋盘和备战区删除其他两个
        const toRemove = units.slice(1);
        for (const unit of toRemove) {
          const boardIdx = this.board.findIndex(m => m.uid === unit.uid);
          if (boardIdx !== -1) {
            this.board.splice(boardIdx, 1);
          } else {
            const benchIdx = this.bench.findIndex(m => m.uid === unit.uid);
            if (benchIdx !== -1) this.bench.splice(benchIdx, 1);
          }
        }
        return true;
      }
    }
    return false;
  }

  // 结算金币
  settleGold(didWin) {
    // 基础收入
    let income = 5;

    // 利息（每10金币1利息，上限5）
    const interest = Math.min(5, Math.floor(this.gold / 10));
    income += interest;

    // 连胜/连败奖励
    if (didWin) {
      this.streak = this.streak > 0 ? this.streak + 1 : 1;
    } else {
      this.streak = this.streak < 0 ? this.streak - 1 : -1;
    }
    const streakBonus = Math.min(3, Math.abs(this.streak) - 1);
    if (streakBonus > 0) income += streakBonus;

    this.gold += income;
    return { income, interest, streak: this.streak, streakBonus };
  }

  // 回合结束处理
  endRound(didWin, enemySurvived) {
    this.round++;
    // 获得经验
    this.addXp(2);
    // 受到伤害
    if (!didWin && enemySurvived > 0) {
      this.hp -= enemySurvived * 2;
      if (this.hp <= 0) {
        this.hp = 0;
        this.isAlive = false;
      }
    }
    // 结算金币
    const goldResult = this.settleGold(didWin);
    return goldResult;
  }

  // 获取玩家状态
  getState() {
    return {
      id: this.id,
      name: this.name,
      hp: this.hp,
      level: this.level,
      xp: this.xp,
      xpToLevel: this.getXpToLevel(),
      gold: this.gold,
      round: this.round,
      streak: this.streak,
      board: this.board,
      bench: this.bench,
      shop: this.shop,
      isAlive: this.isAlive,
      maxBoardSize: this.level
    };
  }
}

module.exports = Player;

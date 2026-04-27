const { v4: uuidv4 } = require('uuid');
const Player = require('./player');
const Deck = require('./deck');
const BattleEngine = require('./battle');

class GameManager {
  constructor() {
    this.games = {}; // gameId -> { players, deck, phase, round }
  }

  // 创建新游戏
  createGame(playerName) {
    const gameId = uuidv4().substr(0, 8);
    const deck = new Deck();
    const player = new Player(gameId + '_p1', playerName || '玩家');

    // 初始商店
    player.shop = deck.refreshShop(player.level);

    this.games[gameId] = {
      id: gameId,
      player: player,
      enemy: this.generateEnemy(player.level),
      deck: deck,
      phase: 'prepare', // prepare | battle
      round: 0,
      battleResult: null
    };

    return { gameId, state: this.getGameState(gameId) };
  }

  // 生成AI敌人
  generateEnemy(playerLevel) {
    const deck = new Deck();
    const enemyLevel = Math.max(1, playerLevel);
    const monsterCount = enemyLevel;
    const board = [];
    const allMonsters = require('../data/monsters').MONSTERS;

    for (let i = 0; i < monsterCount; i++) {
      // 根据等级概率随机选择怪物
      const odds = require('../data/monsters').LEVEL_ODDS[Math.min(enemyLevel, 10)];
      const roll = Math.random() * 100;
      let cumulative = 0;
      let targetCost = 1;
      for (let j = 0; j < odds.length; j++) {
        cumulative += odds[j];
        if (roll < cumulative) {
          targetCost = j + 1;
          break;
        }
      }

      const candidates = allMonsters.filter(m => m.cost === targetCost);
      if (candidates.length > 0) {
        const chosen = candidates[Math.floor(Math.random() * candidates.length)];
        const row = Math.floor(Math.random() * 4); // 敌人在上半区 0-3
        const col = Math.floor(Math.random() * 8);
        // 检查位置是否已被占
        if (!board.some(m => m.row === row && m.col === col)) {
          board.push({
            uid: `enemy_${chosen.id}_${i}`,
            id: chosen.id,
            star: playerLevel >= 6 ? (Math.random() < 0.3 ? 2 : 1) : 1,
            row,
            col
          });
        }
      }
    }

    return { board, level: enemyLevel };
  }

  // 获取游戏状态
  getGameState(gameId) {
    const game = this.games[gameId];
    if (!game) return null;

    return {
      gameId: game.id,
      phase: game.phase,
      round: game.round,
      player: game.player.getState(),
      enemy: game.enemy,
      battleResult: game.battleResult
    };
  }

  // 刷新商店 (D)
  refreshShop(gameId) {
    const game = this.games[gameId];
    if (!game || game.phase !== 'prepare') return { error: '当前不能刷新商店' };
    const success = game.player.refreshShop(game.deck);
    if (!success) return { error: '金币不足（需要2金币）' };
    return { success: true, state: this.getGameState(gameId) };
  }

  // 升级 (F)
  buyXp(gameId) {
    const game = this.games[gameId];
    if (!game || game.phase !== 'prepare') return { error: '当前不能升级' };
    const leveledUp = game.player.buyXp();
    if (leveledUp) {
      // 升级后重新生成更强的敌人
      game.enemy = this.generateEnemy(game.player.level);
    }
    return { success: true, leveledUp, state: this.getGameState(gameId) };
  }

  // 购买怪物
  buyMonster(gameId, shopIndex) {
    const game = this.games[gameId];
    if (!game || game.phase !== 'prepare') return { error: '当前不能购买' };
    const monster = game.player.buyMonster(shopIndex);
    if (!monster) return { error: '无法购买（金币不足或备战区已满）' };
    return { success: true, monster, state: this.getGameState(gameId) };
  }

  // 卖出怪物
  sellMonster(gameId, uid) {
    const game = this.games[gameId];
    if (!game || game.phase !== 'prepare') return { error: '当前不能卖出' };
    const sellPrice = game.player.sellMonster(uid);
    if (sellPrice === 0) return { error: '找不到该怪物' };
    // 卖出的怪物放回牌库
    return { success: true, sellPrice, state: this.getGameState(gameId) };
  }

  // 从备战区到棋盘
  benchToBoard(gameId, benchIndex, row, col) {
    const game = this.games[gameId];
    if (!game || game.phase !== 'prepare') return { error: '当前不能操作' };
    const success = game.player.benchToBoard(benchIndex, row, col);
    if (!success) return { error: '操作失败（棋盘已满或位置被占）' };
    return { success: true, state: this.getGameState(gameId) };
  }

  // 从棋盘到备战区
  boardToBench(gameId, uid) {
    const game = this.games[gameId];
    if (!game || game.phase !== 'prepare') return { error: '当前不能操作' };
    const success = game.player.boardToBench(uid);
    if (!success) return { error: '操作失败（备战区已满）' };
    return { success: true, state: this.getGameState(gameId) };
  }

  // 棋盘上移动
  moveOnBoard(gameId, uid, newRow, newCol) {
    const game = this.games[gameId];
    if (!game || game.phase !== 'prepare') return { error: '当前不能操作' };
    const success = game.player.moveOnBoard(uid, newRow, newCol);
    if (!success) return { error: '移动失败' };
    return { success: true, state: this.getGameState(gameId) };
  }

  // 交换棋盘和备战区
  swapBoardBench(gameId, boardUid, benchIndex) {
    const game = this.games[gameId];
    if (!game || game.phase !== 'prepare') return { error: '当前不能操作' };
    const success = game.player.swapBoardBench(boardUid, benchIndex);
    if (!success) return { error: '交换失败' };
    return { success: true, state: this.getGameState(gameId) };
  }

  // 开始战斗
  startBattle(gameId, detailed = true) {
    const game = this.games[gameId];
    if (!game) return { error: '游戏不存在' };
    if (game.phase !== 'prepare') return { error: '当前不能开始战斗' };
    if (game.player.board.length === 0) return { error: '棋盘上没有怪物' };

    game.phase = 'battle';
    const engine = new BattleEngine();

    if (detailed) {
      // 详细模式：返回战斗过程
      const result = engine.simulate(game.player.board, game.enemy.board);
      game.battleResult = result;

      const didWin = result.winner === 'player';
      const goldResult = game.player.endRound(didWin, result.enemySurvived);

      // 准备下一回合
      game.round++;
      game.enemy = this.generateEnemy(game.player.level);
      // 新商店
      game.deck.returnShopMonsters(game.player.shop);
      game.player.shop = game.deck.refreshShop(game.player.level);
      game.phase = 'prepare';

      return {
        success: true,
        battleResult: result,
        goldResult,
        state: this.getGameState(gameId)
      };
    } else {
      // 快速模式：只返回结果
      const result = engine.quickSimulate(game.player.board, game.enemy.board);
      game.battleResult = result;

      const didWin = result.winner === 'player';
      const goldResult = game.player.endRound(didWin, result.enemySurvived);

      game.round++;
      game.enemy = this.generateEnemy(game.player.level);
      game.deck.returnShopMonsters(game.player.shop);
      game.player.shop = game.deck.refreshShop(game.player.level);
      game.phase = 'prepare';

      return {
        success: true,
        battleResult: result,
        goldResult,
        state: this.getGameState(gameId)
      };
    }
  }

  // 获取怪物信息
  getMonsterInfo(monsterId) {
    const monster = require('../data/monsters').MONSTERS.find(m => m.id === monsterId);
    return monster || null;
  }

  // 获取所有怪物列表
  getAllMonsters() {
    return require('../data/monsters').MONSTERS;
  }

  // 删除游戏
  deleteGame(gameId) {
    if (this.games[gameId]) {
      delete this.games[gameId];
      return true;
    }
    return false;
  }
}

module.exports = GameManager;

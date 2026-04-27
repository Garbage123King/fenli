const express = require('express');
const router = express.Router();
const GameManager = require('../game/gameManager');

const gameManager = new GameManager();

// 创建新游戏
router.post('/game/create', (req, res) => {
  const { playerName } = req.body || {};
  const result = gameManager.createGame(playerName);
  res.json({ success: true, ...result });
});

// 获取游戏状态
router.get('/game/:gameId/state', (req, res) => {
  const state = gameManager.getGameState(req.params.gameId);
  if (!state) return res.status(404).json({ error: '游戏不存在' });
  res.json({ success: true, state });
});

// 刷新商店 (D)
router.post('/game/:gameId/refresh-shop', (req, res) => {
  const result = gameManager.refreshShop(req.params.gameId);
  if (result.error) return res.status(400).json(result);
  res.json(result);
});

// 升级 (F)
router.post('/game/:gameId/buy-xp', (req, res) => {
  const result = gameManager.buyXp(req.params.gameId);
  if (result.error) return res.status(400).json(result);
  res.json(result);
});

// 购买怪物
router.post('/game/:gameId/buy-monster', (req, res) => {
  const { shopIndex } = req.body;
  const result = gameManager.buyMonster(req.params.gameId, shopIndex);
  if (result.error) return res.status(400).json(result);
  res.json(result);
});

// 卖出怪物
router.post('/game/:gameId/sell-monster', (req, res) => {
  const { uid } = req.body;
  const result = gameManager.sellMonster(req.params.gameId, uid);
  if (result.error) return res.status(400).json(result);
  res.json(result);
});

// 从备战区到棋盘
router.post('/game/:gameId/bench-to-board', (req, res) => {
  const { benchIndex, row, col } = req.body;
  const result = gameManager.benchToBoard(req.params.gameId, benchIndex, row, col);
  if (result.error) return res.status(400).json(result);
  res.json(result);
});

// 从棋盘到备战区
router.post('/game/:gameId/board-to-bench', (req, res) => {
  const { uid } = req.body;
  const result = gameManager.boardToBench(req.params.gameId, uid);
  if (result.error) return res.status(400).json(result);
  res.json(result);
});

// 棋盘上移动
router.post('/game/:gameId/move-on-board', (req, res) => {
  const { uid, row, col } = req.body;
  const result = gameManager.moveOnBoard(req.params.gameId, uid, row, col);
  if (result.error) return res.status(400).json(result);
  res.json(result);
});

// 交换棋盘和备战区
router.post('/game/:gameId/swap', (req, res) => {
  const { boardUid, benchIndex } = req.body;
  const result = gameManager.swapBoardBench(req.params.gameId, boardUid, benchIndex);
  if (result.error) return res.status(400).json(result);
  res.json(result);
});

// 开始战斗
router.post('/game/:gameId/battle', (req, res) => {
  const { detailed } = req.body || { detailed: true };
  const result = gameManager.startBattle(req.params.gameId, detailed);
  if (result.error) return res.status(400).json(result);
  res.json(result);
});

// 获取怪物信息
router.get('/monsters/:monsterId', (req, res) => {
  const info = gameManager.getMonsterInfo(req.params.monsterId);
  if (!info) return res.status(404).json({ error: '怪物不存在' });
  res.json({ success: true, monster: info });
});

// 获取所有怪物
router.get('/monsters', (req, res) => {
  const monsters = gameManager.getAllMonsters();
  res.json({ success: true, monsters });
});

module.exports = router;

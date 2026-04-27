// 自走棋前端逻辑
const API = '/api';
let gameId = null;
let gameState = null;
let selectedUnit = null; // { uid, source: 'board'|'bench', benchIndex }
let dragUnit = null;
let battleSpeed = 1;
let battleAnimating = false;

// ==================== 初始化 ====================
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('btn-start').addEventListener('click', startGame);
  document.getElementById('btn-refresh').addEventListener('click', () => doAction('refreshShop'));
  document.getElementById('btn-xp').addEventListener('click', () => doAction('buyXp'));
  document.getElementById('btn-battle').addEventListener('click', () => startBattle(true));
  document.getElementById('btn-quick-battle').addEventListener('click', () => startBattle(false));
  document.getElementById('btn-restart').addEventListener('click', () => {
    document.getElementById('gameover-screen').classList.add('hidden');
    document.getElementById('start-screen').classList.remove('hidden');
  });
  document.getElementById('btn-close-log').addEventListener('click', () => {
    document.getElementById('battle-log').classList.add('hidden');
  });
  document.getElementById('btn-speed').addEventListener('click', cycleSpeed);
  document.getElementById('btn-skip').addEventListener('click', skipBattle);

  // 键盘快捷键
  document.addEventListener('keydown', (e) => {
    if (!gameId) return;
    if (e.key === 'd' || e.key === 'D') doAction('refreshShop');
    if (e.key === 'f' || e.key === 'F') doAction('buyXp');
  });

  buildBoard();
  buildBench();
});

// ==================== API 调用 ====================
async function apiCall(path, method = 'GET', body = null) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${API}${path}`, opts);
  return res.json();
}

async function startGame() {
  const name = document.getElementById('player-name').value.trim() || '玩家';
  const result = await apiCall('/game/create', 'POST', { playerName: name });
  if (result.success) {
    gameId = result.gameId;
    gameState = result.state;
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
    renderAll();
  }
}

async function doAction(action, params = {}) {
  if (!gameId) return;
  let result;
  switch (action) {
    case 'refreshShop':
      result = await apiCall(`/game/${gameId}/refresh-shop`, 'POST');
      break;
    case 'buyXp':
      result = await apiCall(`/game/${gameId}/buy-xp`, 'POST');
      break;
    case 'buyMonster':
      result = await apiCall(`/game/${gameId}/buy-monster`, 'POST', { shopIndex: params.shopIndex });
      break;
    case 'sellMonster':
      result = await apiCall(`/game/${gameId}/sell-monster`, 'POST', { uid: params.uid });
      break;
    case 'benchToBoard':
      result = await apiCall(`/game/${gameId}/bench-to-board`, 'POST', {
        benchIndex: params.benchIndex, row: params.row, col: params.col
      });
      break;
    case 'boardToBench':
      result = await apiCall(`/game/${gameId}/board-to-bench`, 'POST', { uid: params.uid });
      break;
    case 'moveOnBoard':
      result = await apiCall(`/game/${gameId}/move-on-board`, 'POST', {
        uid: params.uid, row: params.row, col: params.col
      });
      break;
    default:
      return;
  }
  if (result && result.state) {
    gameState = result.state;
    renderAll();
    if (result.error) showToast(result.error);
  } else if (result && result.error) {
    showToast(result.error);
  }
}

async function startBattle(detailed) {
  if (!gameId || battleAnimating) return;
  const result = await apiCall(`/game/${gameId}/battle`, 'POST', { detailed });
  if (result.error) {
    showToast(result.error);
    return;
  }
  gameState = result.state;
  if (detailed && result.battleResult && result.battleResult.ticks) {
    playBattleAnimation(result.battleResult, result.goldResult);
  } else {
    showBattleResult(result.battleResult, result.goldResult);
    renderAll();
  }
}

// ==================== 构建UI ====================
function buildBoard() {
  const board = document.getElementById('board');
  board.innerHTML = '';
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const cell = document.createElement('div');
      cell.className = `cell ${r < 4 ? 'enemy-zone' : 'player-zone'}`;
      cell.dataset.row = r;
      cell.dataset.col = c;
      cell.addEventListener('click', () => onCellClick(r, c));
      cell.addEventListener('dragover', onDragOver);
      cell.addEventListener('drop', (e) => onDrop(e, r, c));
      board.appendChild(cell);
    }
  }
}

function buildBench() {
  const bench = document.getElementById('bench');
  bench.innerHTML = '';
  for (let i = 0; i < 9; i++) {
    const slot = document.createElement('div');
    slot.className = 'bench-slot';
    slot.dataset.index = i;
    slot.addEventListener('click', () => onBenchClick(i));
    slot.addEventListener('dragover', onDragOver);
    slot.addEventListener('drop', (e) => onBenchDrop(e, i));
    bench.appendChild(slot);
  }
}

// ==================== 渲染 ====================
function renderAll() {
  if (!gameState || !gameState.player) return;
  const p = gameState.player;
  document.getElementById('round-num').textContent = p.round;
  document.getElementById('hp-value').textContent = p.hp;
  document.getElementById('level-value').textContent = p.level;
  document.getElementById('gold-value').textContent = p.gold;
  document.getElementById('streak-value').textContent = p.streak > 0 ? `胜${p.streak}` : p.streak < 0 ? `败${Math.abs(p.streak)}` : '0';

  // 经验条
  const xpPercent = p.level >= 10 ? 100 : (p.xp / (p.xp + p.xpToLevel)) * 100;
  document.getElementById('xp-bar').style.width = xpPercent + '%';
  document.getElementById('xp-text').textContent = p.level >= 10 ? 'MAX' : `${p.xp}/${p.xp + p.xpToLevel}`;

  renderBoard();
  renderBench();
  renderShop();

  // 检查游戏结束
  if (!p.isAlive) {
    document.getElementById('game-screen').classList.add('hidden');
    document.getElementById('gameover-screen').classList.remove('hidden');
    document.getElementById('gameover-title').textContent = '游戏结束';
    document.getElementById('gameover-message').textContent = `你存活了 ${p.round} 回合`;
  }
}

function renderBoard() {
  const p = gameState.player;
  const e = gameState.enemy || { board: [] };

  // 清除所有格子的怪物
  document.querySelectorAll('.cell').forEach(cell => {
    cell.innerHTML = '';
    cell.classList.remove('selected', 'highlight');
  });

  // 渲染敌方怪物
  for (const m of (e.board || [])) {
    const cell = getCell(m.row, m.col);
    if (cell) cell.appendChild(createMonsterBlock(m, 'enemy'));
  }

  // 渲染玩家怪物
  for (const m of p.board) {
    const cell = getCell(m.row, m.col);
    if (cell) cell.appendChild(createMonsterBlock(m, 'player'));
  }

  // 高亮选中
  if (selectedUnit) {
    if (selectedUnit.source === 'board') {
      const m = p.board.find(u => u.uid === selectedUnit.uid);
      if (m) {
        const cell = getCell(m.row, m.col);
        if (cell) cell.classList.add('selected');
      }
    }
  }
}

function renderBench() {
  const p = gameState.player;
  const slots = document.querySelectorAll('.bench-slot');
  slots.forEach((slot, i) => {
    slot.innerHTML = '';
    slot.classList.remove('highlight');
    if (p.bench[i]) {
      const block = createMonsterBlock(p.bench[i], 'bench');
      block.dataset.benchIndex = i;
      block.draggable = true;
      block.addEventListener('dragstart', (e) => onDragStart(e, p.bench[i].uid, 'bench', i));
      block.addEventListener('dragend', onDragEnd);
      slot.appendChild(block);
    }
  });
}

function renderShop() {
  const p = gameState.player;
  const shopEl = document.getElementById('shop');
  shopEl.innerHTML = '';
  for (let i = 0; i < 5; i++) {
    const card = document.createElement('div');
    const m = p.shop[i];
    if (m) {
      const costColors = { 1: '#9e9e9e', 2: '#4caf50', 3: '#2196f3', 4: '#9c27b0', 5: '#ff9800' };
      card.className = `shop-card cost-${m.cost}`;
      card.innerHTML = `
        <div class="card-block" style="background:${m.color}"></div>
        <div class="card-name">${m.name}</div>
        <div class="card-cost">💰${m.cost}</div>
      `;
      card.addEventListener('click', () => doAction('buyMonster', { shopIndex: i }));
      card.addEventListener('mouseenter', (e) => showTooltip(e, m));
      card.addEventListener('mouseleave', hideTooltip);
    } else {
      card.className = 'shop-card sold';
      card.innerHTML = '<div style="color:#555">已售</div>';
    }
    shopEl.appendChild(card);
  }
}

function createMonsterBlock(monster, side) {
  const block = document.createElement('div');
  const costColors = { 1: '#9e9e9e', 2: '#4caf50', 3: '#2196f3', 4: '#9c27b0', 5: '#ff9800' };
  const template = MONSTERS_DATA ? MONSTERS_DATA.find(m => m.id === monster.id) : null;
  const cost = template ? template.cost : 1;

  block.className = `monster-block cost-${cost}`;
  block.style.background = monster.color || '#555';
  block.dataset.uid = monster.uid;

  let starHtml = '';
  if (monster.star === 2) starHtml = '<span class="star star-2"></span>';
  if (monster.star === 3) starHtml = '<span class="star star-3"></span>';

  block.innerHTML = `
    <span class="cost-badge cost-badge-${cost}">${cost}</span>
    ${starHtml}
    <span class="name-text">${monster.name || ''}</span>
    <div class="mana-bar"><div class="mana-fill" style="width:0%"></div></div>
    <div class="hp-bar"><div class="hp-fill" style="width:100%"></div></div>
  `;

  // 右键卖出
  block.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    if (side === 'player' || side === 'bench') {
      if (confirm(`卖出 ${monster.name}?`)) {
        doAction('sellMonster', { uid: monster.uid });
        clearSelection();
      }
    }
  });

  // 点击选中
  block.addEventListener('click', (e) => {
    e.stopPropagation();
    if (side === 'enemy') return;
    onMonsterClick(monster.uid, side);
  });

  // 鼠标悬停显示提示
  block.addEventListener('mouseenter', (e) => {
    const data = MONSTERS_DATA ? MONSTERS_DATA.find(m => m.id === monster.id) : null;
    if (data) showTooltip(e, { ...data, star: monster.star });
  });
  block.addEventListener('mouseleave', hideTooltip);

  // 棋盘上的怪物支持拖拽
  if (side === 'player') {
    block.draggable = true;
    block.addEventListener('dragstart', (e) => onDragStart(e, monster.uid, 'board'));
    block.addEventListener('dragend', onDragEnd);
  }

  return block;
}

function getCell(row, col) {
  return document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
}

// ==================== 交互逻辑 ====================
function onMonsterClick(uid, source) {
  if (selectedUnit && selectedUnit.uid === uid) {
    clearSelection();
    return;
  }

  if (selectedUnit) {
    // 已有选中，执行交换/移动
    if (source === 'board' && selectedUnit.source === 'board') {
      // 两个棋盘上的怪，交换位置
      const target = gameState.player.board.find(m => m.uid === uid);
      if (target) {
        doAction('moveOnBoard', { uid: selectedUnit.uid, row: target.row, col: target.col });
      }
    } else if (source === 'bench' && selectedUnit.source === 'board') {
      const benchIdx = gameState.player.bench.findIndex(m => m.uid === uid);
      if (benchIdx !== -1) {
        doAction('swapBoardBench', { boardUid: selectedUnit.uid, benchIndex: benchIdx });
      }
    }
    clearSelection();
  } else {
    selectedUnit = { uid, source };
    renderAll();
  }
}

function onCellClick(row, col) {
  if (!selectedUnit) return;

  if (row < 4 || row > 7) {
    clearSelection();
    return;
  }

  if (selectedUnit.source === 'bench') {
    const benchIdx = gameState.player.bench.findIndex(m => m.uid === selectedUnit.uid);
    if (benchIdx !== -1) {
      doAction('benchToBoard', { benchIndex: benchIdx, row, col });
    }
  } else if (selectedUnit.source === 'board') {
    doAction('moveOnBoard', { uid: selectedUnit.uid, row, col });
  }
  clearSelection();
}

function onBenchClick(index) {
  const m = gameState.player.bench[index];
  if (!m) {
    // 点击空的备战区格子 - 如果有选中棋盘上的怪，放回备战区
    if (selectedUnit && selectedUnit.source === 'board') {
      doAction('boardToBench', { uid: selectedUnit.uid });
      clearSelection();
    }
    return;
  }
  onMonsterClick(m.uid, 'bench');
}

// ==================== 拖拽 ====================
function onDragStart(e, uid, source, benchIndex) {
  dragUnit = { uid, source, benchIndex };
  e.dataTransfer.effectAllowed = 'move';
  e.target.classList.add('dragging');
}

function onDragEnd(e) {
  e.target.classList.remove('dragging');
  dragUnit = null;
  document.querySelectorAll('.highlight').forEach(el => el.classList.remove('highlight'));
}

function onDragOver(e) {
  e.preventDefault();
  e.currentTarget.classList.add('highlight');
}

function onDrop(e, row, col) {
  e.preventDefault();
  e.currentTarget.classList.remove('highlight');
  if (!dragUnit) return;

  if (row < 4 || row > 7) return;

  if (dragUnit.source === 'bench') {
    const benchIdx = gameState.player.bench.findIndex(m => m.uid === dragUnit.uid);
    if (benchIdx !== -1) {
      doAction('benchToBoard', { benchIndex: benchIdx, row, col });
    }
  } else if (dragUnit.source === 'board') {
    doAction('moveOnBoard', { uid: dragUnit.uid, row, col });
  }
  dragUnit = null;
}

function onBenchDrop(e, index) {
  e.preventDefault();
  e.currentTarget.classList.remove('highlight');
  if (!dragUnit) return;

  if (dragUnit.source === 'board') {
    doAction('boardToBench', { uid: dragUnit.uid });
  }
  dragUnit = null;
}

function clearSelection() {
  selectedUnit = null;
  renderAll();
}

// ==================== 提示框 ====================
function showTooltip(e, monster) {
  const tip = document.getElementById('tooltip');
  if (!monster) return;

  const star = monster.star || 1;
  const mult = { 1: { hp: 1, atk: 1 }, 2: { hp: 1.8, atk: 1.5 }, 3: { hp: 3.2, atk: 2.5 } };
  const m = mult[star] || mult[1];
  const hp = Math.floor(monster.baseHp * m.hp);
  const atk = Math.floor(monster.baseAtk * m.atk);

  let skillHtml = '';
  if (monster.skill) {
    skillHtml = `
      <div class="tt-skill">
        <div class="tt-skill-name">${monster.skill.name} (${monster.skill.manaCost}蓝)</div>
        <div class="tt-skill-desc">${monster.skill.description}</div>
        <div class="tt-skill-desc">伤害类型: ${monster.skill.damageType === 'physical' ? '物理' : '魔法'} | 伤害: ${monster.skill.damage}</div>
      </div>
    `;
  }

  tip.innerHTML = `
    <div class="tt-name">${monster.name} ${'★'.repeat(star)}</div>
    <div class="tt-title">${monster.title}</div>
    <div class="tt-stats">
      费用: <span>${monster.cost}</span> |
      生命: <span>${hp}</span> |
      攻击: <span>${atk}</span><br>
      护甲: <span>${monster.armor}</span> |
      魔抗: <span>${monster.magicResist}</span> |
      攻速: <span>${monster.atkSpeed}</span><br>
      射程: <span>${monster.range}</span> |
      ${monster.isRanged ? '远程' : '近战'}
    </div>
    ${skillHtml}
  `;

  tip.classList.remove('hidden');
  const rect = e.target.getBoundingClientRect();
  tip.style.left = (rect.right + 10) + 'px';
  tip.style.top = rect.top + 'px';

  // 防止超出屏幕
  const tipRect = tip.getBoundingClientRect();
  if (tipRect.right > window.innerWidth) {
    tip.style.left = (rect.left - tipRect.width - 10) + 'px';
  }
  if (tipRect.bottom > window.innerHeight) {
    tip.style.top = (window.innerHeight - tipRect.height - 10) + 'px';
  }
}

function hideTooltip() {
  document.getElementById('tooltip').classList.add('hidden');
}

// ==================== 战斗动画 ====================
let MONSTERS_DATA = null;

async function loadMonstersData() {
  if (!MONSTERS_DATA) {
    const res = await apiCall('/monsters');
    if (res.success) MONSTERS_DATA = res.monsters;
  }
  return MONSTERS_DATA;
}

async function playBattleAnimation(battleResult, goldResult) {
  battleAnimating = true;
  await loadMonstersData();

  const overlay = document.getElementById('battle-overlay');
  const canvas = document.getElementById('battle-canvas');
  const ctx = canvas.getContext('2d');

  const cellSize = 70;
  canvas.width = cellSize * 8;
  canvas.height = cellSize * 8;

  overlay.classList.remove('hidden');

  const ticks = battleResult.ticks;
  let currentTick = 0;
  let projectiles = [];
  let effects = [];

  function drawBoard() {
    // 背景
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 格子
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        ctx.strokeStyle = r < 4 ? 'rgba(233,69,96,0.2)' : 'rgba(76,175,80,0.2)';
        ctx.lineWidth = 1;
        ctx.strokeRect(c * cellSize, r * cellSize, cellSize, cellSize);
      }
    }
  }

  function drawUnit(u) {
    const x = u.col * cellSize + cellSize / 2;
    const y = u.row * cellSize + cellSize / 2;
    const radius = cellSize * 0.35;

    // 身体
    ctx.fillStyle = u.color || '#555';
    if (u.team === 0) {
      ctx.strokeStyle = '#4caf50';
    } else {
      ctx.strokeStyle = '#e94560';
    }
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x - radius, y - radius, radius * 2, radius * 2, 6);
    ctx.fill();
    ctx.stroke();

    // 星级
    if (u.star >= 2) {
      ctx.fillStyle = '#f5c842';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('★'.repeat(u.star), x, y - radius + 10);
    }

    // 名字
    ctx.fillStyle = 'white';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(u.name, x, y + 4);

    // 血量条
    const hpW = radius * 1.6;
    const hpH = 5;
    const hpX = x - hpW / 2;
    const hpY = y + radius + 4;
    const hpPct = u.hp / u.maxHp;
    ctx.fillStyle = '#333';
    ctx.fillRect(hpX, hpY, hpW, hpH);
    ctx.fillStyle = hpPct > 0.5 ? '#4caf50' : hpPct > 0.25 ? '#ff9800' : '#f44336';
    ctx.fillRect(hpX, hpY, hpW * hpPct, hpH);

    // 蓝量条
    const manaW = radius * 1.6;
    const manaH = 4;
    const manaX = x - manaW / 2;
    const manaY = hpY + hpH + 2;
    const manaPct = u.mana / u.maxMana;
    ctx.fillStyle = '#333';
    ctx.fillRect(manaX, manaY, manaW, manaH);
    ctx.fillStyle = manaPct >= 1 ? '#f5c842' : '#2196f3';
    ctx.fillRect(manaX, manaY, manaW * manaPct, manaH);

    // 护盾
    if (u.shield > 0) {
      ctx.strokeStyle = '#e0e0e0';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y, radius + 4, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 眩晕
    if (u.stunTimer > 0) {
      ctx.fillStyle = 'rgba(255,255,0,0.3)';
      ctx.beginPath();
      ctx.arc(x, y, radius + 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawProjectile(proj) {
    const { from, to, progress, damageType } = proj;
    const x = from.col * cellSize + cellSize / 2 + (to.col - from.col) * cellSize * progress;
    const y = from.row * cellSize + cellSize / 2 + (to.row - from.row) * cellSize * progress;
    ctx.fillStyle = damageType === 'physical' ? '#ff5722' : '#64b5f6';
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
    // 拖尾
    ctx.fillStyle = damageType === 'physical' ? 'rgba(255,87,34,0.3)' : 'rgba(100,181,246,0.3)';
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawAoeEffect(eff) {
    const cx = eff.center.col * cellSize + cellSize / 2;
    const cy = eff.center.row * cellSize + cellSize / 2;
    const r = eff.radius * cellSize;
    ctx.fillStyle = eff.damageType === 'physical' ? 'rgba(255,87,34,0.2)' : 'rgba(100,181,246,0.2)';
    ctx.strokeStyle = eff.damageType === 'physical' ? 'rgba(255,87,34,0.5)' : 'rgba(100,181,246,0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  function drawLineEffect(eff) {
    const fx = eff.from.col * cellSize + cellSize / 2;
    const fy = eff.from.row * cellSize + cellSize / 2;
    const tx = eff.to.col * cellSize + cellSize / 2;
    const ty = eff.to.row * cellSize + cellSize / 2;
    ctx.strokeStyle = eff.damageType === 'physical' ? 'rgba(255,87,34,0.6)' : 'rgba(100,181,246,0.6)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(fx, fy);
    ctx.lineTo(tx, ty);
    ctx.stroke();
  }

  let animFrame = null;
  const tickDuration = () => 200 / battleSpeed;
  let lastTickTime = 0;
  let subFrame = 0;

  function animate(time) {
    if (!battleAnimating) return;

    if (currentTick >= ticks.length) {
      battleAnimating = false;
      overlay.classList.add('hidden');
      showBattleResult(battleResult, goldResult);
      renderAll();
      return;
    }

    if (time - lastTickTime >= tickDuration()) {
      lastTickTime = time;
      const tick = ticks[currentTick];

      // 处理动作
      for (const action of tick.actions) {
        if (action.type === 'attack' && action.isRanged) {
          projectiles.push({
            from: action.projectile.from,
            to: action.projectile.to,
            progress: 0,
            damageType: action.damageType || 'physical'
          });
        }
        if (action.type === 'aoe') {
          effects.push({ ...action, timer: 10, type: 'aoe' });
        }
        if (action.type === 'line') {
          effects.push({ ...action, timer: 10, type: 'line' });
        }
      }

      // 绘制
      drawBoard();

      // 绘制范围效果
      effects = effects.filter(e => e.timer > 0);
      for (const eff of effects) {
        if (eff.type === 'aoe') drawAoeEffect(eff);
        if (eff.type === 'line') drawLineEffect(eff);
        eff.timer--;
      }

      // 绘制单位
      for (const u of tick.units) {
        drawUnit(u);
      }

      // 绘制投掷物
      projectiles = projectiles.filter(p => p.progress < 1);
      for (const proj of projectiles) {
        proj.progress += 0.15 * battleSpeed;
        drawProjectile(proj);
      }

      currentTick++;
    }

    animFrame = requestAnimationFrame(animate);
  }

  animFrame = requestAnimationFrame(animate);
}

function cycleSpeed() {
  battleSpeed = battleSpeed === 1 ? 2 : battleSpeed === 2 ? 4 : 1;
  document.getElementById('btn-speed').textContent = `${battleSpeed}x`;
}

function skipBattle() {
  battleAnimating = false;
  document.getElementById('battle-overlay').classList.add('hidden');
  if (gameState) renderAll();
}

function showBattleResult(battleResult, goldResult) {
  const log = document.getElementById('battle-log');
  const content = document.getElementById('battle-log-content');

  const winnerText = battleResult.winner === 'player' ? '🎉 胜利！' :
                     battleResult.winner === 'enemy' ? '💀 失败' : '🤝 平局';

  content.innerHTML = `
    <h2>${winnerText}</h2>
    <p>我方存活: ${battleResult.playerSurvived} | 敌方存活: ${battleResult.enemySurvived}</p>
    ${goldResult ? `
      <p>💰 基础收入: 5 | 利息: ${goldResult.interest} | 连胜/败: ${goldResult.streak > 0 ? '+' + goldResult.streak : goldResult.streak}</p>
      <p>总计获得: ${goldResult.income} 金币</p>
    ` : ''}
  `;
  log.classList.remove('hidden');
}

// ==================== 工具 ====================
function showToast(msg) {
  const toast = document.createElement('div');
  toast.textContent = msg;
  toast.style.cssText = `
    position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
    background: #e94560; color: white; padding: 8px 20px; border-radius: 8px;
    z-index: 9999; animation: floatUp 2s ease-out forwards; font-size: 0.9em;
  `;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2000);
}

// 加载怪物数据
loadMonstersData();

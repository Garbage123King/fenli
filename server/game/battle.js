const { MONSTERS, STAR_MULTIPLIERS } = require('../data/monsters');

class BattleEngine {
  constructor() {
    this.boardRows = 8;
    this.boardCols = 8;
  }

  // 根据星级计算属性
  getStats(monster) {
    const template = MONSTERS.find(m => m.id === monster.id);
    if (!template) return null;
    const mult = STAR_MULTIPLIERS[monster.star] || STAR_MULTIPLIERS[1];
    return {
      ...template,
      uid: monster.uid,
      star: monster.star,
      hp: Math.floor(template.baseHp * mult.hp),
      maxHp: Math.floor(template.baseHp * mult.hp),
      atk: Math.floor(template.baseAtk * mult.atk),
      mana: template.startMana,
      maxMana: template.maxMana,
      armor: template.armor + (monster.star - 1) * 3,
      magicResist: template.magicResist + (monster.star - 1) * 5
    };
  }

  // 计算实际伤害
  calcDamage(baseDamage, damageType, armor, magicResist) {
    if (damageType === 'physical') {
      // 物理伤害：减免 = 护甲 / (护甲 + 100)
      const reduction = armor / (armor + 100);
      return Math.max(1, Math.floor(baseDamage * (1 - reduction)));
    } else {
      // 魔法伤害：减免 = 魔抗 / (魔抗 + 100)
      const reduction = magicResist / (magicResist + 100);
      return Math.max(1, Math.floor(baseDamage * (1 - reduction)));
    }
  }

  // 两点之间的距离
  distance(a, b) {
    return Math.sqrt((a.row - b.row) ** 2 + (a.col - b.col) ** 2);
  }

  // 获取棋盘上的相邻格子
  getAdjacentPositions(row, col) {
    const positions = [];
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = row + dr;
        const nc = col + dc;
        if (nr >= 0 && nr < this.boardRows && nc >= 0 && nc < this.boardCols) {
          positions.push({ row: nr, col: nc });
        }
      }
    }
    return positions;
  }

  // 模拟完整战斗
  simulate(playerUnits, enemyUnits) {
    const units = [];
    const unitMap = {};

    // 初始化战斗单位
    for (const pu of playerUnits) {
      const stats = this.getStats(pu);
      if (!stats) continue;
      const unit = {
        ...stats,
        team: 0, // 玩家
        row: pu.row,
        col: pu.col,
        alive: true,
        attackCooldown: 0,
        stunTimer: 0,
        slowTimer: 0,
        shield: 0
      };
      units.push(unit);
      unitMap[unit.uid] = unit;
    }

    for (const eu of enemyUnits) {
      const stats = this.getStats(eu);
      if (!stats) continue;
      const unit = {
        ...stats,
        team: 1, // 敌人
        row: eu.row,
        col: eu.col,
        alive: true,
        attackCooldown: 0,
        stunTimer: 0,
        slowTimer: 0,
        shield: 0
      };
      units.push(unit);
      unitMap[unit.uid] = unit;
    }

    const ticks = [];
    const maxTicks = 150; // 最大战斗时长
    let tickCount = 0;

    while (tickCount < maxTicks) {
      const aliveUnits = units.filter(u => u.alive);
      const team0 = aliveUnits.filter(u => u.team === 0);
      const team1 = aliveUnits.filter(u => u.team === 1);

      // 检查战斗是否结束
      if (team0.length === 0 || team1.length === 0) break;

      const actions = [];

      for (const unit of aliveUnits) {
        if (!unit.alive) continue;
        if (unit.stunTimer > 0) {
          unit.stunTimer--;
          continue;
        }

        // 减少攻击冷却
        unit.attackCooldown = Math.max(0, unit.attackCooldown - 1);

        // 找最近的敌人
        const enemies = aliveUnits.filter(u => u.team !== unit.team && u.alive);
        if (enemies.length === 0) continue;

        let closestEnemy = null;
        let closestDist = Infinity;
        for (const enemy of enemies) {
          const dist = this.distance(unit, enemy);
          if (dist < closestDist) {
            closestDist = dist;
            closestEnemy = enemy;
          }
        }

        if (!closestEnemy) continue;

        const atkRange = unit.range;
        const isSlow = unit.slowTimer > 0;
        if (isSlow) unit.slowTimer--;

        // 判断是否在攻击范围内
        if (closestDist <= atkRange + 0.5) {
          // 在攻击范围内
          if (unit.attackCooldown <= 0) {
            // 检查是否满蓝释放技能
            if (unit.mana >= unit.maxMana) {
              // 释放技能
              const skillActions = this.castSkill(unit, enemies, aliveUnits.filter(u => u.team === unit.team), unitMap);
              actions.push(...skillActions);
              unit.mana = 0;
              unit.attackCooldown = Math.ceil(1 / unit.atkSpeed) + 2; // 技能释放后有较长冷却
            } else {
              // 普通攻击
              const attackAction = this.normalAttack(unit, closestEnemy, unitMap);
              actions.push(attackAction);
              // 攻击回蓝
              unit.mana = Math.min(unit.maxMana, unit.mana + 10);
              unit.attackCooldown = Math.ceil(1 / unit.atkSpeed);
            }
          }
        } else {
          // 不在攻击范围，移动
          const moveSpeed = isSlow ? 0.5 : 1;
          const newPos = this.moveToward(unit, closestEnemy, aliveUnits, moveSpeed);
          if (newPos) {
            actions.push({
              type: 'move',
              uid: unit.uid,
              from: { row: unit.row, col: unit.col },
              to: { row: newPos.row, col: newPos.col }
            });
            unit.row = newPos.row;
            unit.col = newPos.col;
          }
        }
      }

      // 生成当前tick的状态快照
      const tick = {
        frame: tickCount,
        actions: actions,
        units: units.filter(u => u.alive).map(u => ({
          uid: u.uid,
          id: u.id,
          name: u.name,
          team: u.team,
          star: u.star,
          row: u.row,
          col: u.col,
          hp: u.hp,
          maxHp: u.maxHp,
          mana: u.mana,
          maxMana: u.maxMana,
          alive: u.alive,
          isRanged: u.isRanged,
          color: u.color,
          shield: u.shield,
          stunTimer: u.stunTimer
        }))
      };
      ticks.push(tick);
      tickCount++;
    }

    // 判定胜负
    const finalAlive = units.filter(u => u.alive);
    const playerAlive = finalAlive.filter(u => u.team === 0);
    const enemyAlive = finalAlive.filter(u => u.team === 1);

    let winner = 'draw';
    if (playerAlive.length > 0 && enemyAlive.length === 0) winner = 'player';
    else if (enemyAlive.length > 0 && playerAlive.length === 0) winner = 'enemy';

    return {
      winner,
      playerSurvived: playerAlive.length,
      enemySurvived: enemyAlive.length,
      totalDamageToPlayer: this.calcTotalDamage(units, 1), // 敌人对玩家造成的伤害
      totalDamageToEnemy: this.calcTotalDamage(units, 0),  // 玩家对敌人造成的伤害
      ticks
    };
  }

  // 普通攻击
  normalAttack(attacker, target, unitMap) {
    const damage = this.calcDamage(attacker.atk, 'physical', target.armor, target.magicResist);
    this.applyDamage(target, damage);

    const action = {
      type: 'attack',
      uid: attacker.uid,
      targetUid: target.uid,
      damage: damage,
      damageType: 'physical',
      isRanged: attacker.isRanged
    };

    if (attacker.isRanged) {
      action.projectile = {
        from: { row: attacker.row, col: attacker.col },
        to: { row: target.row, col: target.col }
      };
    }

    // 被攻击回蓝
    target.mana = Math.min(target.maxMana, target.mana + 8);

    return action;
  }

  // 释放技能
  castSkill(caster, enemies, allies, unitMap) {
    const actions = [];
    const skill = caster.skill;

    actions.push({
      type: 'cast',
      uid: caster.uid,
      skillName: skill.name,
      damageType: skill.damageType,
      casterPos: { row: caster.row, col: caster.col }
    });

    // 处理治疗
    if (skill.heal) {
      // 治疗最低血量的友军
      const woundedAllies = allies.filter(a => a.alive && a.hp < a.maxHp)
        .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp);
      for (let i = 0; i < Math.min(3, woundedAllies.length); i++) {
        const ally = woundedAllies[i];
        ally.hp = Math.min(ally.maxHp, ally.hp + skill.heal);
        actions.push({
          type: 'heal',
          uid: caster.uid,
          targetUid: ally.uid,
          amount: skill.heal
        });
      }
    }

    // 处理护盾
    if (skill.shield) {
      caster.shield += skill.shield;
      actions.push({
        type: 'shield',
        uid: caster.uid,
        amount: skill.shield
      });
    }

    // 根据技能目标类型处理伤害
    let targets = [];
    if (skill.targetType === 'single') {
      // 单体：攻击血量最低的敌人
      const sorted = enemies.filter(e => e.alive).sort((a, b) => a.hp - b.hp);
      if (sorted.length > 0) targets = [sorted[0]];
    } else if (skill.targetType === 'aoe') {
      // 范围攻击：以最近敌人为中心
      const closest = this.findClosestEnemy(caster, enemies);
      if (closest) {
        const radius = skill.aoeRadius || 2;
        targets = enemies.filter(e => e.alive && this.distance(e, closest) <= radius);
        actions.push({
          type: 'aoe',
          uid: caster.uid,
          center: { row: closest.row, col: closest.col },
          radius: radius,
          damageType: skill.damageType
        });
      }
    } else if (skill.targetType === 'line') {
      // 直线攻击：向最近敌人方向
      const closest = this.findClosestEnemy(caster, enemies);
      if (closest) {
        targets = this.getLineTargets(caster, closest, enemies);
        actions.push({
          type: 'line',
          uid: caster.uid,
          from: { row: caster.row, col: caster.col },
          to: { row: closest.row, col: closest.col },
          damageType: skill.damageType
        });
      }
    }

    // 对目标造成伤害
    for (const target of targets) {
      if (!target.alive) continue;
      const starMult = STAR_MULTIPLIERS[caster.star] || STAR_MULTIPLIERS[1];
      const baseDamage = Math.floor(skill.damage * (starMult.atk / STAR_MULTIPLIERS[1].atk));
      const damage = this.calcDamage(baseDamage, skill.damageType, target.armor, target.magicResist);
      this.applyDamage(target, damage);

      actions.push({
        type: 'skillDamage',
        uid: caster.uid,
        targetUid: target.uid,
        damage: damage,
        damageType: skill.damageType,
        skillName: skill.name
      });

      // 眩晕效果
      if (skill.stunDuration && target.alive) {
        target.stunTimer = skill.stunDuration;
        actions.push({
          type: 'stun',
          targetUid: target.uid,
          duration: skill.stunDuration
        });
      }

      // 减速效果
      if (skill.slowDuration && target.alive) {
        target.slowTimer = skill.slowDuration;
        actions.push({
          type: 'slow',
          targetUid: target.uid,
          duration: skill.slowDuration
        });
      }
    }

    return actions;
  }

  // 造成伤害（考虑护盾）
  applyDamage(unit, damage) {
    if (unit.shield > 0) {
      if (unit.shield >= damage) {
        unit.shield -= damage;
        return;
      } else {
        damage -= unit.shield;
        unit.shield = 0;
      }
    }
    unit.hp -= damage;
    if (unit.hp <= 0) {
      unit.hp = 0;
      unit.alive = false;
    }
  }

  // 找最近敌人
  findClosestEnemy(unit, enemies) {
    let closest = null;
    let minDist = Infinity;
    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      const dist = this.distance(unit, enemy);
      if (dist < minDist) {
        minDist = dist;
        closest = enemy;
      }
    }
    return closest;
  }

  // 获取直线上的目标
  getLineTargets(caster, target, enemies) {
    const targets = [];
    const dr = Math.sign(target.row - caster.row);
    const dc = Math.sign(target.col - caster.col);
    const dist = Math.max(Math.abs(target.row - caster.row), Math.abs(target.col - caster.col));

    for (let i = 1; i <= dist; i++) {
      const r = caster.row + dr * i;
      const c = caster.col + dc * i;
      for (const enemy of enemies) {
        if (enemy.alive && enemy.row === r && enemy.col === c) {
          targets.push(enemy);
        }
      }
    }
    return targets;
  }

  // 移动向目标
  moveToward(unit, target, allUnits, speed) {
    const dr = target.row - unit.row;
    const dc = target.col - unit.col;
    const dist = Math.sqrt(dr * dr + dc * dc);
    if (dist === 0) return null;

    const moveDr = Math.round(dr / dist * speed);
    const moveDc = Math.round(dc / dist * speed);

    let newRow = unit.row + moveDr;
    let newCol = unit.col + moveDc;

    // 边界限制
    newRow = Math.max(0, Math.min(this.boardRows - 1, newRow));
    newCol = Math.max(0, Math.min(this.boardCols - 1, newCol));

    // 检查目标位置是否有其他单位
    const occupied = allUnits.some(u => u.alive && u.uid !== unit.uid && u.row === newRow && u.col === newCol);
    if (occupied) {
      // 尝试只移动行或列
      const altRow = Math.max(0, Math.min(this.boardRows - 1, unit.row + moveDr));
      const altCol = Math.max(0, Math.min(this.boardCols - 1, unit.col + moveDc));
      const occupiedRow = allUnits.some(u => u.alive && u.uid !== unit.uid && u.row === altRow && u.col === unit.col);
      const occupiedCol = allUnits.some(u => u.alive && u.uid !== unit.uid && u.row === unit.row && u.col === altCol);

      if (!occupiedRow && moveDr !== 0) {
        newRow = altRow;
        newCol = unit.col;
      } else if (!occupiedCol && moveDc !== 0) {
        newRow = unit.row;
        newCol = altCol;
      } else {
        return null; // 无法移动
      }
    }

    if (newRow === unit.row && newCol === unit.col) return null;
    return { row: newRow, col: newCol };
  }

  // 计算总伤害
  calcTotalDamage(units, attackerTeam) {
    // 简单估算
    return units.filter(u => u.team === attackerTeam)
      .reduce((sum, u) => sum + (u.maxHp - u.hp), 0);
  }

  // 瞬间计算结果（不返回详细过程）
  quickSimulate(playerUnits, enemyUnits) {
    const result = this.simulate(playerUnits, enemyUnits);
    return {
      winner: result.winner,
      playerSurvived: result.playerSurvived,
      enemySurvived: result.enemySurvived
    };
  }
}

module.exports = BattleEngine;

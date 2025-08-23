// ゲーム状態管理
let gameState = {
    player: {
        name: "主人公",
        level: 1,
        hp: 100,
        maxHp: 100,
        mp: 30,
        maxMp: 30,
        attack: 20,
        defense: 10,
        magic: 15,
        speed: 12,
        exp: 0,
        gold: 100
    },
    enemy: null, // CSVから動的に生成
    battle: {
        chapter: 1,
        battleCount: 1,
        maxBattles: 10,
        isPlayerTurn: true,
        isAutoMode: false,
        battleEnded: false
    },
    inventory: {
        potion: 3,
        ether: 1
    },
    dataLoaded: false
};

// DOM要素の取得
const elements = {
    playerLevel: document.getElementById('playerLevel'),
    battleCount: document.getElementById('battleCount'),
    enemyImage: document.getElementById('enemyImage'),
    enemyName: document.getElementById('enemyName'),
    enemyHpBar: document.getElementById('enemyHpBar'),
    enemyHpText: document.getElementById('enemyHpText'),
    playerHpBar: document.getElementById('playerHpBar'),
    playerHpText: document.getElementById('playerHpText'),
    playerMpBar: document.getElementById('playerMpBar'),
    playerMpText: document.getElementById('playerMpText'),
    playerAttack: document.getElementById('playerAttack'),
    playerDefense: document.getElementById('playerDefense'),
    playerMagic: document.getElementById('playerMagic'),
    playerSpeed: document.getElementById('playerSpeed'),
    battleLogContent: document.getElementById('battleLogContent'),
    attackBtn: document.getElementById('attackBtn'),
    skillBtn: document.getElementById('skillBtn'),
    itemBtn: document.getElementById('itemBtn'),
    autoBtn: document.getElementById('autoBtn'),
    skillModal: document.getElementById('skillModal'),
    itemModal: document.getElementById('itemModal'),
    closeSkillModal: document.getElementById('closeSkillModal'),
    closeItemModal: document.getElementById('closeItemModal')
};

// 音響効果生成関数（Web Audio API使用）
class SoundEffects {
    constructor() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.audioContext.createGain();
        this.masterGain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        this.masterGain.connect(this.audioContext.destination);
    }

    playClick() {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(400, this.audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.1);
    }

    playAttack() {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(300, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.2);
        
        filter.frequency.setValueAtTime(1000, this.audioContext.currentTime);
        filter.Q.setValueAtTime(5, this.audioContext.currentTime);
        
        gainNode.gain.setValueAtTime(0.4, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.2);
    }

    playSkill() {
        const oscillator1 = this.audioContext.createOscillator();
        const oscillator2 = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator1.connect(gainNode);
        oscillator2.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        oscillator1.frequency.setValueAtTime(440, this.audioContext.currentTime);
        oscillator2.frequency.setValueAtTime(660, this.audioContext.currentTime);
        
        oscillator1.frequency.exponentialRampToValueAtTime(880, this.audioContext.currentTime + 0.3);
        oscillator2.frequency.exponentialRampToValueAtTime(1320, this.audioContext.currentTime + 0.3);
        
        gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
        
        oscillator1.start(this.audioContext.currentTime);
        oscillator2.start(this.audioContext.currentTime);
        oscillator1.stop(this.audioContext.currentTime + 0.3);
        oscillator2.stop(this.audioContext.currentTime + 0.3);
    }

    playHeal() {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(523, this.audioContext.currentTime);
        oscillator.frequency.setValueAtTime(659, this.audioContext.currentTime + 0.1);
        oscillator.frequency.setValueAtTime(784, this.audioContext.currentTime + 0.2);
        
        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.4);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.4);
    }
}

const soundEffects = new SoundEffects();

// UI更新関数
function updateUI() {
    elements.playerLevel.textContent = gameState.player.level;
    elements.battleCount.textContent = `${gameState.battle.battleCount}/${gameState.battle.maxBattles}`;
    
    elements.enemyName.textContent = gameState.enemy.name;
    
    // 敵画像を更新
    if (gameState.enemy && gameState.enemy.image) {
        const imagePath = `./assets/images/enemies/${gameState.enemy.image}`;
        elements.enemyImage.src = imagePath;
        elements.enemyImage.onerror = function() {
            // 画像読み込み失敗時のフォールバック
            this.style.backgroundColor = '#FF6BF5';
            this.style.color = 'white';
            this.style.display = 'flex';
            this.style.alignItems = 'center';
            this.style.justifyContent = 'center';
            this.innerHTML = `<span>${gameState.enemy.name}</span>`;
        };
    }
    
    const enemyHpPercent = (gameState.enemy.hp / gameState.enemy.maxHp) * 100;
    elements.enemyHpBar.style.width = `${enemyHpPercent}%`;
    elements.enemyHpText.textContent = `${gameState.enemy.hp}/${gameState.enemy.maxHp}`;
    
    const playerHpPercent = (gameState.player.hp / gameState.player.maxHp) * 100;
    elements.playerHpBar.style.width = `${playerHpPercent}%`;
    elements.playerHpText.textContent = `${gameState.player.hp}/${gameState.player.maxHp}`;
    
    const playerMpPercent = (gameState.player.mp / gameState.player.maxMp) * 100;
    elements.playerMpBar.style.width = `${playerMpPercent}%`;
    elements.playerMpText.textContent = `${gameState.player.mp}/${gameState.player.maxMp}`;
    
    elements.playerAttack.textContent = gameState.player.attack;
    elements.playerDefense.textContent = gameState.player.defense;
    elements.playerMagic.textContent = gameState.player.magic;
    elements.playerSpeed.textContent = gameState.player.speed;
}

// ログ追加関数
function addBattleLog(message) {
    const logEntry = document.createElement('div');
    logEntry.className = 'log-entry';
    logEntry.textContent = message;
    elements.battleLogContent.appendChild(logEntry);
    elements.battleLogContent.scrollTop = elements.battleLogContent.scrollHeight;
}

// ダメージ計算関数
function calculateDamage(attacker, defender, isSkill = false, skillMultiplier = 1) {
    let baseDamage = isSkill ? 
        Math.floor(attacker.magic * skillMultiplier) : 
        attacker.attack;
    
    let damage = Math.max(1, baseDamage - defender.defense);
    
    // クリティカル判定
    const criticalChance = attacker.speed / 200;
    if (Math.random() < criticalChance) {
        damage = Math.floor(damage * 1.5);
        return { damage, critical: true };
    }
    
    return { damage, critical: false };
}

// プレイヤーの攻撃
function playerAttack() {
    if (!gameState.battle.isPlayerTurn || gameState.battle.battleEnded) return;
    
    soundEffects.playAttack();
    const result = calculateDamage(gameState.player, gameState.enemy);
    gameState.enemy.hp = Math.max(0, gameState.enemy.hp - result.damage);
    
    let message = `プレイヤーの攻撃！ ${gameState.enemy.name}に${result.damage}のダメージ！`;
    if (result.critical) {
        message += " クリティカルヒット！";
    }
    addBattleLog(message);
    
    updateUI();
    
    if (gameState.enemy.hp <= 0) {
        addBattleLog(`${gameState.enemy.name}を倒した！`);
        setTimeout(nextBattle, 1500);
        return;
    }
    
    gameState.battle.isPlayerTurn = false;
    setTimeout(enemyTurn, 1000);
}

// プレイヤーのスキル使用
function useSkill(skillName) {
    if (!gameState.battle.isPlayerTurn || gameState.battle.battleEnded) return;
    
    if (skillName === 'fireball' && gameState.player.mp >= 10) {
        soundEffects.playSkill();
        gameState.player.mp -= 10;
        const result = calculateDamage(gameState.player, gameState.enemy, true, 1.5);
        gameState.enemy.hp = Math.max(0, gameState.enemy.hp - result.damage);
        
        let message = `ファイアボール！ ${gameState.enemy.name}に${result.damage}の炎ダメージ！`;
        if (result.critical) {
            message += " クリティカルヒット！";
        }
        addBattleLog(message);
        
    } else if (skillName === 'heal' && gameState.player.mp >= 8) {
        soundEffects.playHeal();
        gameState.player.mp -= 8;
        const healAmount = 40;
        gameState.player.hp = Math.min(gameState.player.maxHp, gameState.player.hp + healAmount);
        addBattleLog(`ヒール！ HPを${healAmount}回復した！`);
        
    } else {
        addBattleLog("MPが足りません！");
        return;
    }
    
    updateUI();
    
    if (gameState.enemy.hp <= 0) {
        addBattleLog(`${gameState.enemy.name}を倒した！`);
        setTimeout(nextBattle, 1500);
        return;
    }
    
    gameState.battle.isPlayerTurn = false;
    setTimeout(enemyTurn, 1000);
}

// アイテム使用
function useItem(itemName) {
    if (!gameState.battle.isPlayerTurn || gameState.battle.battleEnded) return;
    
    if (itemName === 'potion' && gameState.inventory.potion > 0) {
        soundEffects.playHeal();
        gameState.inventory.potion--;
        const healAmount = 50;
        gameState.player.hp = Math.min(gameState.player.maxHp, gameState.player.hp + healAmount);
        addBattleLog(`ポーションを使用！ HPを${healAmount}回復した！`);
        
    } else if (itemName === 'ether' && gameState.inventory.ether > 0) {
        soundEffects.playHeal();
        gameState.inventory.ether--;
        const mpRecover = 30;
        gameState.player.mp = Math.min(gameState.player.maxMp, gameState.player.mp + mpRecover);
        addBattleLog(`エーテルを使用！ MPを${mpRecover}回復した！`);
        
    } else {
        addBattleLog("アイテムがありません！");
        return;
    }
    
    updateUI();
    gameState.battle.isPlayerTurn = false;
    setTimeout(enemyTurn, 1000);
}

// 敵のターン（CSV駆動）
function enemyTurn() {
    if (gameState.battle.battleEnded) return;
    
    // CSV駆動の敵行動選択
    if (dataManager.loaded && gameState.enemy && gameState.enemy.id) {
        const action = dataManager.selectEnemyAction(gameState.enemy.id);
        executeEnemyAction(action);
    } else {
        // フォールバック：従来の行動パターン
        if (Math.random() < 0.8) {
            const result = calculateDamage(gameState.enemy, gameState.player);
            gameState.player.hp = Math.max(0, gameState.player.hp - result.damage);
            
            let message = `${gameState.enemy.name}の攻撃！ ${result.damage}のダメージを受けた！`;
            if (result.critical) {
                message += " 急所に当たった！";
            }
            addBattleLog(message);
            
            if (gameState.player.hp <= 0) {
                handlePlayerDefeat();
                return;
            }
        } else {
            addBattleLog(`${gameState.enemy.name}は様子を見ている...`);
        }
    }
    
    updateUI();
    gameState.battle.isPlayerTurn = true;
    
    // オートモード時の自動攻撃
    if (gameState.battle.isAutoMode) {
        setTimeout(() => {
            if (gameState.battle.isPlayerTurn && !gameState.battle.battleEnded) {
                playerAttack();
            }
        }, 1000);
    }
}

// 敵の行動を実行
function executeEnemyAction(action) {
    if (!action) return;

    switch (action.action_type) {
        case 'skill':
            if (action.skill_id) {
                const skill = dataManager.getSkill(action.skill_id);
                if (skill) {
                    executeEnemySkill(skill);
                } else {
                    // フォールバック：通常攻撃
                    const result = calculateDamage(gameState.enemy, gameState.player);
                    gameState.player.hp = Math.max(0, gameState.player.hp - result.damage);
                    addBattleLog(`${gameState.enemy.name}の攻撃！ ${result.damage}のダメージを受けた！`);
                }
            }
            break;
            
        case 'wait':
            addBattleLog(`${gameState.enemy.name}は様子を見ている...`);
            break;
            
        default:
            addBattleLog(`${gameState.enemy.name}は何もしなかった...`);
    }
    
    if (gameState.player.hp <= 0) {
        handlePlayerDefeat();
    }
}

// 敵のスキル実行
function executeEnemySkill(skill) {
    // MP消費チェック（敵にMPがある場合）
    if (skill.mp_cost > 0 && gameState.enemy.mp !== undefined) {
        if (gameState.enemy.mp < skill.mp_cost) {
            // MP不足の場合は通常攻撃
            const result = calculateDamage(gameState.enemy, gameState.player);
            gameState.player.hp = Math.max(0, gameState.player.hp - result.damage);
            addBattleLog(`${gameState.enemy.name}の攻撃！ ${result.damage}のダメージを受けた！`);
            return;
        }
        gameState.enemy.mp -= skill.mp_cost;
    }

    if (skill.type === 'attack') {
        const damage = dataManager.calculateSkillDamage(skill, gameState.enemy, gameState.player);
        gameState.player.hp = Math.max(0, gameState.player.hp - damage);
        addBattleLog(`${gameState.enemy.name}の${skill.name}！ ${damage}のダメージを受けた！`);
        
        // 状態異常効果
        if (skill.status_effect && skill.status_duration > 0) {
            applyStatusEffect(gameState.player, skill.status_effect, skill.status_duration);
        }
    } else if (skill.type === 'healing') {
        const healAmount = skill.base_power || 50;
        gameState.enemy.hp = Math.min(gameState.enemy.maxHp, gameState.enemy.hp + healAmount);
        addBattleLog(`${gameState.enemy.name}の${skill.name}！ HPを${healAmount}回復した！`);
    }
}

// プレイヤー敗北処理
function handlePlayerDefeat() {
    addBattleLog("プレイヤーは倒れてしまった...");
    gameState.battle.battleEnded = true;
    
    // 経験値・金の半分保持
    const lostExp = Math.floor(gameState.player.exp * 0.5);
    const lostGold = Math.floor(gameState.player.gold * 0.5);
    gameState.player.exp -= lostExp;
    gameState.player.gold -= lostGold;
    
    setTimeout(() => {
        alert(`敗北しました。経験値${lostExp}、${lostGold}ゴールドを失い、章の最初からやり直しです。`);
        resetChapter();
    }, 1500);
}

// 状態異常を適用
function applyStatusEffect(target, effect, duration) {
    if (!target.statusEffects) {
        target.statusEffects = {};
    }
    target.statusEffects[effect] = duration;
    addBattleLog(`${target.name || 'プレイヤー'}は${effect}状態になった！`);
}

// 次の戦闘
function nextBattle() {
    gameState.battle.battleCount++;
    
    const currentStage = dataManager.getStage(gameState.battle.chapter);
    const maxBattles = currentStage ? currentStage.max_battles : 10;
    
    if (gameState.battle.battleCount > maxBattles) {
        addBattleLog("章をクリアしました！");
        // 経験値と金の獲得
        if (currentStage) {
            gameState.player.exp += currentStage.reward_exp;
            gameState.player.gold += currentStage.reward_gold;
            addBattleLog(`経験値${currentStage.reward_exp}、${currentStage.reward_gold}ゴールドを獲得！`);
        }
        setTimeout(() => {
            alert(`${gameState.battle.chapter}章クリア！次の章に進みます。`);
            nextChapter();
        }, 1500);
        return;
    }
    
    // CSVから新しい敵を生成
    generateNewEnemy();
    
    gameState.battle.isPlayerTurn = true;
    addBattleLog(`${gameState.enemy.name}が現れた！`);
    updateUI();
}

// 新しい敵を生成（CSV駆動）
function generateNewEnemy() {
    if (!dataManager.loaded) {
        // フォールバック敵
        gameState.enemy = {
            id: 'fallback_slime',
            name: 'スライム',
            hp: 50,
            maxHp: 50,
            attack: 15,
            defense: 5,
            magic: 0,
            speed: 8
        };
        return;
    }

    const enemyData = dataManager.generateRandomEnemy(gameState.battle.chapter);
    if (enemyData) {
        gameState.enemy = {
            id: enemyData.id,
            name: enemyData.name,
            hp: enemyData.hp,
            maxHp: enemyData.hp,
            attack: enemyData.attack,
            defense: enemyData.defense,
            magic: enemyData.magic || 0,
            speed: enemyData.speed,
            exp_reward: enemyData.exp_reward || 10,
            gold_reward: enemyData.gold_reward || 5,
            drop_rate: enemyData.drop_rate || 0,
            drop_item: enemyData.drop_item,
            image: enemyData.image || 'slime.png'
        };
    }
}

// 章リセット
function resetChapter() {
    gameState.battle.battleCount = 1;
    gameState.battle.battleEnded = false;
    gameState.player.hp = gameState.player.maxHp;
    gameState.player.mp = gameState.player.maxMp;
    
    // 状態異常クリア
    gameState.player.statusEffects = {};
    
    // 新しい敵を生成
    generateNewEnemy();
    
    gameState.battle.isPlayerTurn = true;
    elements.battleLogContent.innerHTML = '<div class="log-entry">戦闘が開始されました</div>';
    addBattleLog(`${gameState.enemy.name}が現れた！`);
    updateUI();
}

// 次章へ
function nextChapter() {
    gameState.battle.chapter++;
    gameState.battle.battleCount = 1;
    gameState.battle.battleEnded = false;
    
    // CSVから章データを取得
    const stageData = dataManager.getStage(gameState.battle.chapter);
    if (stageData) {
        gameState.battle.maxBattles = stageData.max_battles;
    } else {
        gameState.battle.maxBattles = 8 + (gameState.battle.chapter * 2);
    }
    
    gameState.player.hp = gameState.player.maxHp;
    gameState.player.mp = gameState.player.maxMp;
    
    resetChapter();
    addBattleLog(`${gameState.battle.chapter}章が始まりました！`);
}

// イベントリスナーの設定
function setupEventListeners() {
    // コマンドボタン
    elements.attackBtn.addEventListener('click', () => {
        soundEffects.playClick();
        playerAttack();
    });
    
    elements.skillBtn.addEventListener('click', () => {
        soundEffects.playClick();
        elements.skillModal.style.display = 'flex';
    });
    
    elements.itemBtn.addEventListener('click', () => {
        soundEffects.playClick();
        elements.itemModal.style.display = 'flex';
    });
    
    elements.autoBtn.addEventListener('click', () => {
        soundEffects.playClick();
        gameState.battle.isAutoMode = !gameState.battle.isAutoMode;
        elements.autoBtn.style.backgroundColor = gameState.battle.isAutoMode ? '#38a169' : '';
        addBattleLog(gameState.battle.isAutoMode ? 'オートモード ON' : 'オートモード OFF');
        
        if (gameState.battle.isAutoMode && gameState.battle.isPlayerTurn && !gameState.battle.battleEnded) {
            setTimeout(playerAttack, 1000);
        }
    });
    
    // モーダル関連
    elements.closeSkillModal.addEventListener('click', () => {
        soundEffects.playClick();
        elements.skillModal.style.display = 'none';
    });
    
    elements.closeItemModal.addEventListener('click', () => {
        soundEffects.playClick();
        elements.itemModal.style.display = 'none';
    });
    
    // スキル選択
    document.querySelectorAll('.skill-option').forEach(button => {
        button.addEventListener('click', () => {
            soundEffects.playClick();
            const skill = button.dataset.skill;
            elements.skillModal.style.display = 'none';
            useSkill(skill);
        });
    });
    
    // アイテム選択
    document.querySelectorAll('.item-option').forEach(button => {
        button.addEventListener('click', () => {
            soundEffects.playClick();
            const item = button.dataset.item;
            elements.itemModal.style.display = 'none';
            useItem(item);
        });
    });
    
    // モーダル外クリックで閉じる
    elements.skillModal.addEventListener('click', (e) => {
        if (e.target === elements.skillModal) {
            elements.skillModal.style.display = 'none';
        }
    });
    
    elements.itemModal.addEventListener('click', (e) => {
        if (e.target === elements.itemModal) {
            elements.itemModal.style.display = 'none';
        }
    });
}

// ゲーム初期化
async function initGame() {
    setupEventListeners();
    
    // CSVデータ読み込み
    addBattleLog("ゲームデータを読み込み中...");
    const loadSuccess = await dataManager.loadAllData();
    
    if (loadSuccess) {
        gameState.dataLoaded = true;
        addBattleLog("データ読み込み完了！");
        
        // CSV駆動でプレイヤーデータを初期化
        const playerData = dataManager.getCharacter('player');
        if (playerData) {
            gameState.player.name = playerData.name;
            gameState.player.hp = playerData.base_hp;
            gameState.player.maxHp = playerData.base_hp;
            gameState.player.mp = playerData.base_mp;
            gameState.player.maxMp = playerData.base_mp;
            gameState.player.attack = playerData.base_attack;
            gameState.player.defense = playerData.base_defense;
            gameState.player.magic = playerData.base_magic;
            gameState.player.speed = playerData.base_speed;
        }
    } else {
        addBattleLog("データ読み込み失敗。フォールバックモードで開始。");
    }
    
    // 章情報を設定
    const currentStage = dataManager.getStage(gameState.battle.chapter);
    if (currentStage) {
        gameState.battle.maxBattles = currentStage.max_battles;
    }
    
    // 最初の敵を生成
    generateNewEnemy();
    
    updateUI();
    addBattleLog("戦闘が開始されました");
    addBattleLog(`${gameState.enemy.name}が現れた！`);
}

// ページ読み込み完了時にゲーム開始
document.addEventListener('DOMContentLoaded', initGame);
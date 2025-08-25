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
        gold: 99999,
        statPoints: 0,
        equipment: {
            weapon: null,     // 武器
            shield: null,     // 盾
            head: null,       // 頭防具
            body: null        // 胴防具
        },
        clothingState: {
            isDamaged: false,     // 衣服が損傷しているか
            damageLevel: 0,       // ダメージレベル (0=無傷, 1=軽傷, 2=中傷, 3=重傷, 4=瀕死)
            canRepair: false      // 修理可能か（一度ダメージを受けると true）
        }
    },
    enemy: null, // CSVから動的に生成
    battle: {
        chapter: 1,
        battleCount: 1,
        maxBattles: 10,
        isPlayerTurn: true,
        isAutoMode: false,
        battleEnded: false,
        location: null, // 探索場所が選択されるまではnull
        dungeonFloor: 1,
        fieldMode: false, // 探索場所が選択されるまではfalse
        inTown: true // ゲーム開始時は町にいる状態
    },
    inventory: {
        potion: 3,
        ether: 1,
        'hi-potion': 0,
        'bomb-stone': 0,
        'power-crystal': 0,
        'shield-stone': 0,
        'magic-gem': 0,
        'speed-boots': 0,
        'life-crystal': 0,
        'mana-crystal': 0,
        'antidote': 0,
        'paralysis-cure': 0,
        'phoenix-down': 0
    },
    dataLoaded: false
};;

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
    playerExp: document.getElementById('playerExp'),
    playerGold: document.getElementById('playerGold'),
    nextLevelExp: document.getElementById('nextLevelExp'),
    equippedWeapon: document.getElementById('equippedWeapon'),
    equippedShield: document.getElementById('equippedShield'),
    equippedHead: document.getElementById('equippedHead'),
    equippedBody: document.getElementById('equippedBody'),
    battleLogContent: document.getElementById('battleLogContent'),
    attackBtn: document.getElementById('attackBtn'),
    skillBtn: document.getElementById('skillBtn'),
    itemBtn: document.getElementById('itemBtn'),
    autoBtn: document.getElementById('autoBtn'),
    skillModal: document.getElementById('skillModal'),
    itemModal: document.getElementById('itemModal'),
    closeSkillModal: document.getElementById('closeSkillModal'),
    closeItemModal: document.getElementById('closeItemModal'),
    shopBtn: document.getElementById('shopBtn'),
    shopModal: document.getElementById('shopModal'),
    closeShopModal: document.getElementById('closeShopModal'),
    shopPlayerGold: document.getElementById('shopPlayerGold'),
    shopItemsList: document.getElementById('shopItemsList'),
    repairTab: document.getElementById('repairTab'),
    repairItemsList: document.getElementById('repairItemsList'),
    itemList: document.getElementById('itemList'),
    levelUpModal: document.getElementById('levelUpModal'),
    levelUpDisplay: document.getElementById('levelUpDisplay'),
    availablePoints: document.getElementById('availablePoints'),
    confirmLevelUp: document.getElementById('confirmLevelUp')
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

    playHurt() {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(80, this.audioContext.currentTime + 0.3);
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, this.audioContext.currentTime);
        filter.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 0.3);
        
        gainNode.gain.setValueAtTime(0.4, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.3);
    }
}

const soundEffects = new SoundEffects();
// スクリーンシェイク機能
function screenShake(intensity = 10, duration = 500) {
    const gameContainer = document.querySelector('.game-container');
    gameContainer.classList.add('screen-shake');
    
    // CSSカスタムプロパティでシェイクの強度を設定
    gameContainer.style.setProperty('--shake-intensity', `${intensity}px`);
    
    setTimeout(() => {
        gameContainer.classList.remove('screen-shake');
        gameContainer.style.removeProperty('--shake-intensity');
    }, duration);
}

// UI更新関数
function updateUI() {
    elements.playerLevel.textContent = gameState.player.level;
    
    // 新しいHTML構造に対応
    const chapterDisplay = document.getElementById('chapterDisplay');
    const maxBattlesDisplay = document.getElementById('maxBattles');
    
    if (chapterDisplay) {
        chapterDisplay.textContent = `${gameState.battle.chapter}章`;
    }
    if (maxBattlesDisplay) {
        maxBattlesDisplay.textContent = gameState.battle.maxBattles;
    }
    
    // フィールドでは戦闘数を「∞」で表示
    if (gameState.battle.location === 'field') {
        elements.battleCount.textContent = '∞';
    } else {
        elements.battleCount.textContent = gameState.battle.battleCount;
    }
    elements.enemyName.textContent = gameState.enemy ? gameState.enemy.name : '';
    
    // 町状態では敵を非表示にする
    const enemyImage = document.getElementById('enemyImage');
    if (gameState.battle.inTown) {
        if (enemyImage) {
            enemyImage.style.display = 'none';
        }
    } else {
        if (enemyImage) {
            enemyImage.style.display = 'block';
        }
    }
    
    // 町状態でない場合のみ背景を自動更新
    if (!gameState.battle.inTown) {
        updateStageBackground();
    }
    
    // 敵画像を更新（キャッシュバスター付き）
    if (gameState.enemy && gameState.enemy.image && !gameState.battle.inTown) {
        const timestamp = Date.now();
        const imagePath = `./assets/images/enemies/${gameState.enemy.image}?v=${timestamp}`;
        
        // 画像読み込み前にローディング状態を設定（背景色なし）
        elements.enemyImage.innerHTML = '<div class="placeholder-text">読み込み中...</div>';
        
        elements.enemyImage.src = imagePath;
        elements.enemyImage.onload = function() {
            // 読み込み成功時
            this.innerHTML = '';
            this.style.backgroundColor = '';
            console.log(`✅ Enemy image loaded: ${gameState.enemy.image}`);
        };
        elements.enemyImage.onerror = function() {
            // 画像読み込み失敗時のフォールバック
            console.error(`❌ Failed to load enemy image: ${gameState.enemy.image}`);
            this.style.backgroundColor = '#FF6BF5';
            this.style.color = 'white';
            this.style.display = 'flex';
            this.style.alignItems = 'center';
            this.style.justifyContent = 'center';
            this.innerHTML = `<div class="placeholder-text">${gameState.enemy.name}</div>`;
        };
    }
    
    if (gameState.enemy) {
        const enemyHpPercent = (gameState.enemy.hp / gameState.enemy.maxHp) * 100;
        elements.enemyHpBar.style.width = `${enemyHpPercent}%`;
        elements.enemyHpText.textContent = `${gameState.enemy.hp}/${gameState.enemy.maxHp}`;
    }
    
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
    
    // 経験値と所持金の表示更新
    elements.playerExp.textContent = gameState.player.exp;
    elements.playerGold.textContent = gameState.player.gold;
    elements.nextLevelExp.textContent = gameState.player.level * 20;
    
    // 装備表示更新
    updateEquipmentDisplay();
    
    // 宿屋ボタンの状態更新
    updateInnButtonState();
    
    // ガチャボタンの状態更新
    updateGachaButtonState();
    
    // ロケーション表示更新
    updateLocationDisplay();
    
    // 逃げるボタンの状態更新
    updateFleeButtonState();
}

// 背景画像を切り替える
function changeBackground(locationType) {
    const backgroundElement = document.getElementById('stageBackground');
    if (!backgroundElement) return;
    
    // データが読み込まれていない場合は、データ読み込み後に再実行
    if (!dataManager.loaded) {
        console.log(`Background change delayed: ${locationType} (data not loaded yet)`);
        // データ読み込み完了後に再実行するためのフラグを設定
        dataManager.pendingBackgroundChange = locationType;
        return;
    }
    
    // backgrounds.csvから該当する背景を取得
    const background = dataManager.data.backgrounds.find(bg => bg.location_type === locationType);
    if (background && background.background_image) {
        // キャッシュバスターを追加
        const timestamp = Date.now();
        const imagePath = `./${background.background_image}?v=${timestamp}`;
        
        console.log(`Changing background to: ${imagePath}`);
        backgroundElement.src = imagePath;
        backgroundElement.alt = background.description || locationType;
    } else {
        console.warn(`Background not found for location type: ${locationType}`);
        // フォールバック背景を設定
        const timestamp = Date.now();
        backgroundElement.src = `./assets/images/backgrounds/town.png?v=${timestamp}`;
        backgroundElement.alt = '背景画像';
    }
}

// 装備表示更新関数
function updateEquipmentDisplay() {
    if (!dataManager.loaded) {
        elements.equippedWeapon.textContent = 'なし';
        elements.equippedShield.textContent = 'なし';
        elements.equippedHead.textContent = 'なし';
        elements.equippedBody.textContent = 'なし';
        return;
    }
    
    // ガチャ専用アイテムの定義
    const gachaItems = {
        'gacha-sword': { item_name: 'レアソード' },
        'gacha-shield': { item_name: 'レアシールド' },
        'gacha-helmet': { item_name: 'レアヘルム' },
        'gacha-armor': { item_name: 'レアアーマー' },
        'legendary-sword': { item_name: 'レジェンドソード' },
        'legendary-shield': { item_name: 'レジェンドシールド' }
    };
    
    // 装備名を表示（IDから名前に変換、ガチャアイテムにも対応）
    const weaponId = gameState.player.equipment.weapon;
    const shieldId = gameState.player.equipment.shield;
    const headId = gameState.player.equipment.head;
    const bodyId = gameState.player.equipment.body;
    
    let weaponItem = weaponId ? dataManager.getShopItem(weaponId) : null;
    if (!weaponItem && weaponId && gachaItems[weaponId]) {
        weaponItem = gachaItems[weaponId];
    }
    
    let shieldItem = shieldId ? dataManager.getShopItem(shieldId) : null;
    if (!shieldItem && shieldId && gachaItems[shieldId]) {
        shieldItem = gachaItems[shieldId];
    }
    
    let headItem = headId ? dataManager.getShopItem(headId) : null;
    if (!headItem && headId && gachaItems[headId]) {
        headItem = gachaItems[headId];
    }
    
    let bodyItem = bodyId ? dataManager.getShopItem(bodyId) : null;
    if (!bodyItem && bodyId && gachaItems[bodyId]) {
        bodyItem = gachaItems[bodyId];
    }
    
    elements.equippedWeapon.textContent = weaponItem ? weaponItem.item_name : 'なし';
    elements.equippedShield.textContent = shieldItem ? shieldItem.item_name : 'なし';
    elements.equippedHead.textContent = headItem ? headItem.item_name : 'なし';
    elements.equippedBody.textContent = bodyItem ? bodyItem.item_name : 'なし';
}

// 宿屋ボタンの状態更新
function updateInnButtonState() {
    const innBtn = document.getElementById('innBtn');
    if (!innBtn) return;
    
    const isInField = gameState.battle.location === 'field';
    const hasEnoughGold = gameState.player.gold >= 100;
    const needsHealing = gameState.player.hp < gameState.player.maxHp || gameState.player.mp < gameState.player.maxMp;
    
    const canUseInn = isInField && hasEnoughGold && needsHealing;
    
    innBtn.disabled = !canUseInn;
    
    // ボタンテキストの更新
    const btnText = innBtn.querySelector('.btn-text');
    if (btnText) {
        if (!isInField) {
            btnText.textContent = '🏨 宿屋（フィールドのみ）';
        } else if (!hasEnoughGold) {
            btnText.textContent = '🏨 宿屋（ゴールド不足）';
        } else if (!needsHealing) {
            btnText.textContent = '🏨 宿屋（回復不要）';
        } else {
            btnText.textContent = '🏨 宿屋に泊まる';
        }
    }
}

// ガチャボタンの状態更新
function updateGachaButtonState() {
    const equipmentGachaBtn = document.getElementById('equipmentGachaBtn');
    const illustrationGachaBtn = document.getElementById('illustrationGachaBtn');
    
    if (equipmentGachaBtn) {
        const canUseEquipmentGacha = gameState.player.gold >= 500;
        equipmentGachaBtn.disabled = !canUseEquipmentGacha;
        
        const btnText = equipmentGachaBtn.querySelector('.btn-text');
        if (btnText && !canUseEquipmentGacha) {
            btnText.textContent = '⚔️ 装備ガチャ（ゴールド不足）';
        } else if (btnText) {
            btnText.textContent = '⚔️ 装備ガチャ';
        }
    }
    
    if (illustrationGachaBtn) {
        const canUseIllustrationGacha = gameState.player.gold >= 100;
        illustrationGachaBtn.disabled = !canUseIllustrationGacha;
        
        const btnText = illustrationGachaBtn.querySelector('.btn-text');
        if (btnText && !canUseIllustrationGacha) {
            btnText.textContent = '🖼️ イラストガチャ（ゴールド不足）';
        } else if (btnText) {
            btnText.textContent = '🖼️ イラストガチャ';
        }
    }
}

// ロケーション表示更新
function updateLocationDisplay() {
    if (!dataManager.loaded) return;
    
    const fieldBtn = document.getElementById('fieldBtn');
    const dungeonBtn = document.getElementById('dungeonBtn');
    const locationInfo = document.getElementById('locationInfo');
    
    const locations = dataManager.getCurrentLocations(gameState.battle.chapter);
    
    // ボタンテキスト更新
    if (fieldBtn && locations.field) {
        fieldBtn.textContent = locations.field.location_name;
    }
    if (dungeonBtn && locations.dungeon) {
        dungeonBtn.textContent = locations.dungeon.location_name;
    }
    
    // 現在のロケーション情報更新
    if (locationInfo) {
        const currentLocation = dataManager.getLocation(gameState.battle.location, gameState.battle.chapter);
        if (currentLocation) {
            if (gameState.battle.location === 'field') {
                locationInfo.textContent = `${currentLocation.location_name}で安全に戦闘`;
            } else {
                locationInfo.textContent = `${currentLocation.location_name}で高リスク・高リターン戦闘`;
            }
        }
    }
}

// 逃げるボタンの状態更新
function updateFleeButtonState() {
    const fleeBtn = document.getElementById('fleeBtn');
    if (!fleeBtn) return;
    
    const isBoss = gameState.enemy && gameState.enemy.name.includes('ボス');
    const canFlee = !isBoss && gameState.battle.isPlayerTurn && !gameState.battle.battleEnded;
    
    fleeBtn.disabled = !canFlee;
    
    if (isBoss) {
        fleeBtn.textContent = '逃げる（ボス戦不可）';
        fleeBtn.title = 'ボス戦では逃走できません';
    } else {
        fleeBtn.textContent = '逃げる';
        fleeBtn.title = '50%の確率で逃走成功';
    }
}

// 章に応じた背景画像更新（ロケーション対応）
function updateStageBackground() {
    const stageBackground = document.getElementById('stageBackground');
    if (!stageBackground || !dataManager.loaded) return;
    
    // 現在のロケーション情報を取得
    const locationInfo = dataManager.getLocation(gameState.battle.location, gameState.battle.chapter);
    
    if (locationInfo && locationInfo.background_image) {
        const timestamp = Date.now();
        const backgroundPath = `./assets/images/backgrounds/${locationInfo.background_image}?v=${timestamp}`;
        stageBackground.src = backgroundPath;
        stageBackground.onerror = function() {
            // 背景画像読み込み失敗時のフォールバック
            console.warn(`Background image not found: ${locationInfo.background_image}`);
            this.style.backgroundColor = getLocationBackgroundColor(gameState.battle.location, gameState.battle.chapter);
            this.innerHTML = `<div class="placeholder-text">${locationInfo.location_name}<br>背景</div>`;
            this.style.display = 'flex';
            this.style.alignItems = 'center';
            this.style.justifyContent = 'center';
        };
    } else {
        // フォールバック：章ベースの背景
        const stageInfo = dataManager.getStageInfo(gameState.battle.chapter);
        if (stageInfo && stageInfo.background_image) {
            const timestamp = Date.now();
            const backgroundPath = `./assets/images/backgrounds/${stageInfo.background_image}?v=${timestamp}`;
            stageBackground.src = backgroundPath;
            stageBackground.onerror = function() {
                this.style.backgroundColor = getChapterBackgroundColor(gameState.battle.chapter);
                this.innerHTML = `<div class="placeholder-text">${gameState.battle.chapter}章<br>背景</div>`;
            };
        }
    }
}

// 章ごとのフォールバック背景色
function getChapterBackgroundColor(chapter) {
    const colors = {
        1: '#87CEEB', // 平原：空色
        2: '#2F4F4F', // 暗黒の森：暗緑
        3: '#8B4513', // 魔の洞窟：茶色
        4: '#E6E6FA', // 天空の塔：薄紫
        5: '#8B0000', // 魔王の城：暗赤
        6: '#2F2F2F', // 虚無の間：灰色
        7: '#FFD700'  // 真実の世界：金色
    };
    return colors[chapter] || '#87CEEB';
}

// ロケーション別フォールバック背景色
function getLocationBackgroundColor(locationType, chapter) {
    if (locationType === 'field') {
        const fieldColors = {
            1: '#90EE90', // 緑の平原：薄緑
            2: '#228B22', // 暗い森：緑
            3: '#D2B48C', // 荒野：ベージュ
            4: '#E0FFFF', // 雪山：薄水色
            5: '#FF4500'  // 火山：オレンジ赤
        };
        return fieldColors[chapter] || '#90EE90';
    } else {
        const dungeonColors = {
            1: '#696969', // スライムの洞窟：灰色
            2: '#556B2F', // ゴブリンの巣窟：ダークオリーブ
            3: '#8B7D6B', // 古代遺跡：古い石色
            4: '#B0E0E6', // 氷の神殿：アイスブルー
            5: '#8B0000'  // 竜の巣：深紅
        };
        return dungeonColors[chapter] || '#696969';
    }
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
    console.log('🎯 playerAttack関数が呼ばれました！');
    if (!gameState.battle.isPlayerTurn || gameState.battle.battleEnded) {
        console.log('❌ プレイヤーのターンではない、または戦闘終了済み');
        return;
    }
    
    console.log('✅ 戦闘条件OK、エフェクト実行中...');
    
    // 攻撃エフェクトを表示
    showPlayerAttackEffect();
    
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
function useItem(itemId) {
    if (!dataManager.loaded) return;
    
    // ガチャ専用アイテムの定義
    const gachaItems = {
        'gacha-sword': { item_name: 'レアソード', item_id: 'gacha-sword', effect_type: 'equip_weapon', effect_value: 15 },
        'gacha-shield': { item_name: 'レアシールド', item_id: 'gacha-shield', effect_type: 'equip_shield', effect_value: 8 },
        'gacha-helmet': { item_name: 'レアヘルム', item_id: 'gacha-helmet', effect_type: 'equip_head', effect_value: 6 },
        'gacha-armor': { item_name: 'レアアーマー', item_id: 'gacha-armor', effect_type: 'equip_body', effect_value: 10 },
        'legendary-sword': { item_name: 'レジェンドソード', item_id: 'legendary-sword', effect_type: 'equip_weapon', effect_value: 25 },
        'legendary-shield': { item_name: 'レジェンドシールド', item_id: 'legendary-shield', effect_type: 'equip_shield', effect_value: 15 }
    };
    
    // アイテム情報を取得（ショップアイテムまたはガチャアイテム）
    let itemInfo = dataManager.getShopItem(itemId);
    if (!itemInfo && gachaItems[itemId]) {
        itemInfo = gachaItems[itemId];
    }
    
    if (!itemInfo) {
        addBattleLog("アイテム情報が見つかりません！");
        return;
    }
    
    const isEquipmentItem = itemInfo.effect_type.startsWith('equip_');
    
    // 町状態では装備のみ可能、戦闘中でない場合は通常アイテム使用不可
    if (gameState.battle.inTown) {
        if (!isEquipmentItem) {
            addBattleLog("探索中以外では装備アイテムのみ使用できます");
            return;
        }
    } else {
        // 通常の戦闘制限
        if (!gameState.battle.isPlayerTurn || gameState.battle.battleEnded) return;
    }
    
    // インベントリチェック
    if (!gameState.inventory[itemId] || gameState.inventory[itemId] <= 0) {
        addBattleLog("アイテムがありません！");
        return;
    }
    
    // 効果を適用
    let effectMessage = '';
    let isDamageItem = false;
    
    switch (itemInfo.effect_type) {
        case 'heal_hp':
            // 消費アイテム：使用前にインベントリから削除
            gameState.inventory[itemId]--;
            const healAmount = itemInfo.effect_value;
            const actualHeal = Math.min(healAmount, gameState.player.maxHp - gameState.player.hp);
            gameState.player.hp += actualHeal;
            effectMessage = `HPを${actualHeal}回復した！`;
            // HP変更時にプレイヤーメディアを更新
            updatePlayerMedia();
            break;
            
        case 'heal_mp':
            // 消費アイテム：使用前にインベントリから削除
            gameState.inventory[itemId]--;
            const mpRecover = itemInfo.effect_value;
            const actualMpRecover = Math.min(mpRecover, gameState.player.maxMp - gameState.player.mp);
            gameState.player.mp += actualMpRecover;
            effectMessage = `MPを${actualMpRecover}回復した！`;
            break;
            
        case 'damage_hp':
            // 消費アイテム：使用前にインベントリから削除
            gameState.inventory[itemId]--;
            const damage = itemInfo.effect_value;
            gameState.enemy.hp = Math.max(0, gameState.enemy.hp - damage);
            effectMessage = `${gameState.enemy.name}に${damage}のダメージを与えた！`;
            isDamageItem = true;
            break;
            
        case 'boost_attack':
            // 消費アイテム：使用前にインベントリから削除
            gameState.inventory[itemId]--;
            gameState.player.attack += itemInfo.effect_value;
            effectMessage = `攻撃力が${itemInfo.effect_value}上がった！`;
            break;
            
        case 'boost_defense':
            // 消費アイテム：使用前にインベントリから削除
            gameState.inventory[itemId]--;
            gameState.player.defense += itemInfo.effect_value;
            effectMessage = `防御力が${itemInfo.effect_value}上がった！`;
            break;
            
        case 'boost_magic':
            // 消費アイテム：使用前にインベントリから削除
            gameState.inventory[itemId]--;
            gameState.player.magic += itemInfo.effect_value;
            effectMessage = `魔力が${itemInfo.effect_value}上がった！`;
            break;
            
        case 'boost_speed':
            // 消費アイテム：使用前にインベントリから削除
            gameState.inventory[itemId]--;
            gameState.player.speed += itemInfo.effect_value;
            effectMessage = `素早さが${itemInfo.effect_value}上がった！`;
            break;
            
        case 'boost_max_hp':
            // 消費アイテム：使用前にインベントリから削除
            gameState.inventory[itemId]--;
            gameState.player.maxHp += itemInfo.effect_value;
            gameState.player.hp = Math.min(gameState.player.hp + itemInfo.effect_value, gameState.player.maxHp);
            effectMessage = `最大HPが${itemInfo.effect_value}上がった！`;
            // HP変更時にプレイヤーメディアを更新
            updatePlayerMedia();
            break;
            
        case 'boost_max_mp':
            // 消費アイテム：使用前にインベントリから削除
            gameState.inventory[itemId]--;
            gameState.player.maxMp += itemInfo.effect_value;
            gameState.player.mp = Math.min(gameState.player.mp + itemInfo.effect_value, gameState.player.maxMp);
            effectMessage = `最大MPが${itemInfo.effect_value}上がった！`;
            break;
            
        case 'cure_poison':
            // 消費アイテム：使用前にインベントリから削除
            gameState.inventory[itemId]--;
            // 状態異常システムが実装されたら対応
            effectMessage = '毒を治療した！';
            break;
            
        case 'cure_paralysis':
            // 消費アイテム：使用前にインベントリから削除
            gameState.inventory[itemId]--;
            // 状態異常システムが実装されたら対応
            effectMessage = '麻痺を治療した！';
            break;
            
        case 'revival':
            // 消費アイテム：使用前にインベントリから削除
            gameState.inventory[itemId]--;
            // 復活システムが実装されたら対応
            effectMessage = 'パワーを感じる...！';
            break;
            
        case 'equip_weapon':
            // 装備アイテム：装備後にインベントリから削除
            gameState.inventory[itemId]--;
            if (equipItem('weapon', itemInfo)) {
                effectMessage = `${itemInfo.item_name}を装備した！`;
            } else {
                effectMessage = `${itemInfo.item_name}を装備できませんでした`;
                // 装備失敗時はアイテムをインベントリに戻す
                gameState.inventory[itemId]++;
            }
            break;
            
        case 'equip_shield':
            // 装備アイテム：装備後にインベントリから削除
            gameState.inventory[itemId]--;
            if (equipItem('shield', itemInfo)) {
                effectMessage = `${itemInfo.item_name}を装備した！`;
            } else {
                effectMessage = `${itemInfo.item_name}を装備できませんでした`;
                // 装備失敗時はアイテムをインベントリに戻す
                gameState.inventory[itemId]++;
            }
            break;
            
        case 'equip_head':
            // 装備アイテム：装備後にインベントリから削除
            gameState.inventory[itemId]--;
            if (equipItem('head', itemInfo)) {
                effectMessage = `${itemInfo.item_name}を装備した！`;
            } else {
                effectMessage = `${itemInfo.item_name}を装備できませんでした`;
                // 装備失敗時はアイテムをインベントリに戻す
                gameState.inventory[itemId]++;
            }
            break;
            
        case 'equip_body':
            // 装備アイテム：装備後にインベントリから削除
            gameState.inventory[itemId]--;
            if (equipItem('body', itemInfo)) {
                effectMessage = `${itemInfo.item_name}を装備した！`;
            } else {
                effectMessage = `${itemInfo.item_name}を装備できませんでした`;
                // 装備失敗時はアイテムをインベントリに戻す
                gameState.inventory[itemId]++;
            }
            break;
            
        default:
            effectMessage = '効果を発揮した！';
    }
    
    // 音響効果
    if (isDamageItem) {
        soundEffects.playAttack();
        screenShake(gameState.enemy.hp <= 0 ? 15 : 10);
    } else {
        soundEffects.playHeal();
    }
    
    addBattleLog(`${itemInfo.item_name}を使用！ ${effectMessage}`);
    
    // 敵が倒された場合の処理
    if (isDamageItem && gameState.enemy.hp <= 0) {
        addBattleLog(`${gameState.enemy.name}を倒した！`);
        updateItemDisplay();
        updateUI();
        setTimeout(nextBattle, 1500);
        return;
    }
    
    // アイテム表示を更新
    updateItemDisplay();
    updateUI();
    
    // 戦闘中の場合のみターン切り替え
    if (!gameState.battle.inTown) {
        gameState.battle.isPlayerTurn = false;
        setTimeout(enemyTurn, 1000);
    }
}

// アイテム表示更新関数
function updateItemDisplay() {
    if (!dataManager.loaded) return;
    
    elements.itemList.innerHTML = '';
    
    // ショップアイテムの情報を取得
    const shopItems = dataManager.getShopItems();
    
    // ガチャ専用アイテムの定義
    const gachaItems = {
        'gacha-sword': { item_name: 'レアソード', description: '攻撃力+15の強力な剣', effect_type: 'equip_weapon' },
        'gacha-shield': { item_name: 'レアシールド', description: '防御力+8の強力な盾', effect_type: 'equip_shield' },
        'gacha-helmet': { item_name: 'レアヘルム', description: '防御力+6の強力な兜', effect_type: 'equip_head' },
        'gacha-armor': { item_name: 'レアアーマー', description: '防御力+10の強力な鎧', effect_type: 'equip_body' },
        'legendary-sword': { item_name: 'レジェンドソード', description: '攻撃力+25の伝説の剣', effect_type: 'equip_weapon' },
        'legendary-shield': { item_name: 'レジェンドシールド', description: '防御力+15の伝説の盾', effect_type: 'equip_shield' }
    };
    
    // 所持しているアイテムをカウント
    let hasItems = false;
    
    // インベントリの各アイテムを処理（所持数が0より大きいもののみ）
    Object.keys(gameState.inventory).forEach(itemId => {
        const count = gameState.inventory[itemId];
        
        // 所持数が0以下の場合は表示しない（ネタバレ防止）
        if (count <= 0) return;
        
        // ショップアイテムから検索
        let itemInfo = shopItems.find(item => item.item_id === itemId);
        
        // ショップアイテムにない場合はガチャアイテムから検索
        if (!itemInfo && gachaItems[itemId]) {
            itemInfo = gachaItems[itemId];
        }
        
        if (itemInfo) {
            hasItems = true;
            
            const itemElement = document.createElement('button');
            itemElement.className = 'item-option';
            itemElement.dataset.item = itemId;
            
            itemElement.innerHTML = `
                <div class="item-name">${itemInfo.item_name}</div>
                <div class="item-count">所持数: ${count}</div>
                <div class="item-desc">${itemInfo.description}</div>
            `;
            
            itemElement.addEventListener('click', () => {
                useItem(itemId);
                elements.itemModal.style.display = 'none';
            });
            
            elements.itemList.appendChild(itemElement);
        }
    });
    
    // アイテムが何もない場合
    if (!hasItems) {
        elements.itemList.innerHTML = '<div class="shop-empty">使用可能なアイテムがありません</div>';
    }
}

// 敵のターン（CSV駆動）
function enemyTurn() {
    console.log('🔄 enemyTurn関数が呼ばれました！');
    if (gameState.battle.battleEnded) {
        console.log('❌ 戦闘終了済みのため敵ターンをスキップ');
        return;
    }
    
    console.log('📊 dataManager.loaded:', dataManager.loaded);
    console.log('👹 gameState.enemy:', gameState.enemy);
    
    // CSV駆動の敵行動選択
    if (dataManager.loaded && gameState.enemy && gameState.enemy.id) {
        console.log('✅ CSV駆動の敵行動を実行');
        const action = dataManager.selectEnemyAction(gameState.enemy.id);
        console.log('🎲 選択された行動:', action);
        executeEnemyAction(action);
    } else {
        console.log('⚠️ フォールバック：従来の行動パターン');
        // フォールバック：従来の行動パターン
        if (Math.random() < 0.8) {
            console.log('✅ executeEnemyAttack()を実行');
            executeEnemyAttack();
            
            if (gameState.player.hp <= 0) {
                handlePlayerDefeat();
                return;
            }
        } else {
            console.log('😴 敵は様子見');
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
    console.log('⚔️ executeEnemyAction関数が呼ばれました！');
    console.log('🎲 受け取った行動:', action);
    
    if (!action) {
        console.log('❌ 行動データがnullまたはundefined');
        return;
    }

    console.log('🔍 行動タイプ:', action.action_type);
    
    switch (action.action_type) {
        case 'skill':
            console.log('🪄 スキル行動を実行');
            if (action.skill_id) {
                const skill = dataManager.getSkill(action.skill_id);
                if (skill) {
                    executeEnemySkill(skill);
                } else {
                    console.log('⚠️ スキルが見つからないため通常攻撃に切り替え');
                    // フォールバック：通常攻撃
                    executeEnemyAttack();
                }
            }
            break;
            
        case 'wait':
            console.log('😴 敵は様子見');
            addBattleLog(`${gameState.enemy.name}は様子を見ている...`);
            break;
            
        default:
            console.log('❓ 不明な行動タイプ、何もしない');
            addBattleLog(`${gameState.enemy.name}は何もしなかった...`);
    }
    
    if (gameState.player.hp <= 0) {
        handlePlayerDefeat();
    }
}

// 敵の通常攻撃処理（ダメージSE+シェイク付き）
function executeEnemyAttack() {
    console.log('👹 executeEnemyAttack関数が呼ばれました！');
    
    // 敵攻撃エフェクトを表示
    showEnemyAttackEffect();
    
    const result = calculateDamage(gameState.enemy, gameState.player);
    gameState.player.hp = Math.max(0, gameState.player.hp - result.damage);
    
    // ダメージSE再生
    soundEffects.playHurt();
    
    // スクリーンシェイク（ダメージ量に応じて強度調整）
    const shakeIntensity = Math.min(15, Math.max(5, result.damage / 5));
    screenShake(shakeIntensity, 400);
    
    let message = `${gameState.enemy.name}の攻撃！ ${result.damage}のダメージを受けた！`;
    if (result.critical) {
        message += " 急所に当たった！";
        // クリティカル時は追加シェイク
        setTimeout(() => screenShake(20, 300), 200);
    }
    addBattleLog(message);
    
    // HPが変更されたのでプレイヤーメディアを更新
    updatePlayerMedia();
}

// 敵のスキル実行
function executeEnemySkill(skill) {
    console.log('🪄 executeEnemySkill関数が呼ばれました！');
    console.log('📋 スキルデータ:', skill);
    
    // MP消費チェック（敵にMPがある場合）
    if (skill.mp_cost > 0 && gameState.enemy.mp !== undefined) {
        if (gameState.enemy.mp < skill.mp_cost) {
            console.log('⚠️ MP不足のため通常攻撃に切り替え');
            // MP不足の場合は通常攻撃
            executeEnemyAttack();
            return;
        }
        gameState.enemy.mp -= skill.mp_cost;
    }

    console.log('🔍 スキルタイプ:', skill.type);
    
    if (skill.type === 'attack') {
        console.log('⚔️ 攻撃スキルを実行中');
        
        // 敵攻撃エフェクトを表示
        showEnemyAttackEffect();
        
        const damage = dataManager.calculateSkillDamage(skill, gameState.enemy, gameState.player);
        gameState.player.hp = Math.max(0, gameState.player.hp - damage);
        
        // ダメージSE再生
        soundEffects.playHurt();
        
        // スキル攻撃用の強めなシェイク
        const shakeIntensity = Math.min(20, Math.max(8, damage / 4));
        screenShake(shakeIntensity, 500);
        
        addBattleLog(`${gameState.enemy.name}の${skill.name}！ ${damage}のダメージを受けた！`);
        
        // 状態異常効果
        if (skill.status_effect && skill.status_duration > 0) {
            applyStatusEffect(gameState.player, skill.status_effect, skill.status_duration);
        }
        
        // HPが変更されたのでプレイヤーメディアを更新
        updatePlayerMedia();
    } else if (skill.type === 'healing') {
        console.log('💚 回復スキルを実行中');
        const healAmount = skill.base_power || 50;
        gameState.enemy.hp = Math.min(gameState.enemy.maxHp, gameState.enemy.hp + healAmount);
        addBattleLog(`${gameState.enemy.name}の${skill.name}！ HPを${healAmount}回復した！`);
    } else {
        console.log('❓ 不明なスキルタイプ:', skill.type);
    }
}

// プレイヤー敗北処理
function handlePlayerDefeat() {
    addBattleLog("プレイヤーは倒れてしまった...");
    gameState.battle.battleEnded = true;
    
    // フィールド/ダンジョン対応の敗北ペナルティ
    applyDefeatPenalty();
    
    setTimeout(() => {
        showDefeatModal();
    }, 1500);
}

// 敗北モーダル表示
function showDefeatModal() {
    const lostGold = Math.floor(gameState.player.gold * 0.5);
    const isInDungeon = gameState.battle.location === 'dungeon';
    
    const modal = document.createElement('div');
    modal.className = 'modal defeat-modal';
    modal.innerHTML = `
        <div class="modal-content defeat-content">
            <div class="defeat-header">
                <h2>💀 敗北...</h2>
            </div>
            <div class="defeat-body">
                <div class="defeat-image">
                    <div class="defeat-icon">⚰️</div>
                </div>
                <div class="defeat-message">
                    <p class="main-message">戦闘に敗北してしまいました...</p>
                    <p class="sub-message">しかし、これで終わりではありません。</p>
                </div>
                <div class="defeat-losses">
                    <h4>📉 失ったもの</h4>
                    <div class="loss-items">
                        <div class="loss-item">
                            <span class="loss-type">💰 ゴールド</span>
                            <span class="loss-value">${lostGold}</span>
                        </div>
                        ${isInDungeon ? '<div class="loss-item"><span class="loss-type">⛰️ 進行度</span><span class="loss-value">1階からやり直し</span></div>' : ''}
                    </div>
                </div>
                <div class="defeat-hope">
                    <p>💪 ${isInDungeon ? 'ダンジョン1階から' : '現在の場所で'}再び立ち上がり、挑戦しましょう！</p>
                </div>
                <button class="command-btn retry-btn" id="retryBtn">
                    <span class="btn-text">🔄 再挑戦</span>
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // 再挑戦ボタンのイベントリスナー
    document.getElementById('retryBtn').addEventListener('click', () => {
        soundEffects.playClick();
        document.body.removeChild(modal);
        resetAfterDefeat();
    });
    
    // モーダル外クリックで再挑戦
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
            resetAfterDefeat();
        }
    });
}

// 状態異常を適用
function applyStatusEffect(target, effect, duration) {
    if (!target.statusEffects) {
        target.statusEffects = {};
    }
    target.statusEffects[effect] = duration;
    addBattleLog(`${target.name || 'プレイヤー'}は${effect}状態になった！`);
}

// 逃走成功時の戦闘継続（経験値・金なし）
function nextBattleAfterFlee() {
    // レベルアップチェック（念のため）
    checkLevelUp();
    
    // 通常敵の場合の戦闘継続
    if (gameState.battle.location === 'field') {
        // フィールドでは無限戦闘（battleCountは増加しない）
        addBattleLog('フィールドでの戦闘継続...');
    } else {
        // ダンジョンでは戦闘カウントを増加
        gameState.battle.battleCount++;
    }
    
    // 敵データ更新とUI更新
    updateEnemyData();
    updateUI();
    
    // 戦闘状態をリセット
    gameState.battle.isPlayerTurn = true;
    gameState.battle.battleEnded = false;
}

// 次の戦闘
function nextBattle() {
    // 経験値・ゴールド獲得処理
    if (gameState.enemy.exp_reward) {
        gameState.player.exp += gameState.enemy.exp_reward;
        addBattleLog(`経験値${gameState.enemy.exp_reward}を獲得！`);
    }
    if (gameState.enemy.gold_reward) {
        gameState.player.gold += gameState.enemy.gold_reward;
        addBattleLog(`${gameState.enemy.gold_reward}ゴールドを獲得！`);
    }
    
    // レベルアップチェック
    checkLevelUp();
    
    // ボス戦後の章クリア判定
    if (gameState.enemy.isBoss) {
        addBattleLog(`${gameState.battle.chapter}章のボスを撃破しました！`);
        addBattleLog("章クリア！");
        
        // ボス撃破時のストーリートリガーをチェック
        const defeatedBossId = gameState.enemy.id;
        if (storyTriggerManager) {
            const trigger = storyTriggerManager.checkBossDefeat(defeatedBossId);
            if (trigger) {
                addBattleLog('📖 ストーリーイベントが発生しました');
                setTimeout(() => {
                    storyTriggerManager.triggerStory(trigger.story_id);
                }, 1000);
            }
        }
        
        const currentStage = dataManager.getStageInfo(gameState.battle.chapter);
        if (currentStage) {
            gameState.player.exp += parseInt(currentStage.reward_exp) || 0;
            gameState.player.gold += parseInt(currentStage.reward_gold) || 0;
            addBattleLog(`ボーナス報酬：経験値${currentStage.reward_exp}、${currentStage.reward_gold}ゴールドを獲得！`);
            
            // ボーナス経験値後のレベルアップチェック
            checkLevelUp();
        }
        
        setTimeout(() => {
            showChapterClearDialog();
        }, 2000);
        return;
    }
    
    // 通常敵の場合の戦闘継続
    if (gameState.battle.location === 'field') {
        // フィールドでは無限戦闘（battleCountは増加しない）
        addBattleLog('フィールドでの戦闘継続...');
    } else {
        // ダンジョンでは戦闘カウントを増加
        gameState.battle.battleCount++;
    }
    
    // CSVから新しい敵を生成
    generateNewEnemy();
    
    gameState.battle.isPlayerTurn = true;
    addBattleLog(`${gameState.enemy.name}が現れた！`);
    updateUI();
}

// 章クリア会話画面表示
function showChapterClearDialog() {
    const currentStage = dataManager.getStageInfo(gameState.battle.chapter);
    const chapterName = currentStage ? currentStage.stage_name : `第${gameState.battle.chapter}章`;
    
    // モーダルを作成
    const modal = document.createElement('div');
    modal.className = 'modal chapter-clear-modal';
    modal.innerHTML = `
        <div class="modal-content chapter-clear-content">
            <div class="modal-header chapter-clear-header">
                <h3>🏆 ${chapterName} クリア！</h3>
            </div>
            <div class="chapter-clear-body">
                <div class="clear-message">
                    <p>お疲れ様でした！<br>
                    ${gameState.battle.chapter}章のボスを見事に撃破しました。</p>
                </div>
                <div class="chapter-story">
                    <p>"${getChapterStoryText(gameState.battle.chapter)}"</p>
                </div>
                <div class="chapter-rewards">
                    <h4>📊 戦闘結果</h4>
                    <p>倒した敵の数: ${gameState.battle.battleCount - 1}体</p>
                    <p>現在のレベル: ${gameState.player.level}</p>
                    <p>所持ゴールド: ${gameState.player.gold}G</p>
                </div>
                <button class="command-btn next-chapter-btn" id="nextChapterBtn">
                    <span class="btn-text">次の章へ進む</span>
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // 次の章ボタンのイベントリスナー
    document.getElementById('nextChapterBtn').addEventListener('click', () => {
        soundEffects.playClick();
        document.body.removeChild(modal);
        nextChapter();
    });
    
    // モーダル外クリックで進む
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
            nextChapter();
        }
    });
}

// 章ごとのストーリーテキスト
function getChapterStoryText(chapter) {
    const storyTexts = {
        1: "平原の魔物たちを退けた主人公。しかし、これは長い戦いの始まりに過ぎなかった...",
        2: "暗黒の森を抜けた主人公。深い闇の奥で、より強大な敵の気配を感じ取る。",
        3: "魔の洞窟の奥で古代の秘宝を発見。しかし、それは更なる謎への手がかりだった。",
        4: "天空の塔を制覇した主人公。雲の上から見えた世界の真実とは...？",
        5: "魔王の城を攻略！だが、倒した魔王は本物だったのだろうか...？",
        6: "全ての真実が明かされる時が来た。世界の本当の支配者との最終決戦が始まる。"
    };
    
    return storyTexts[chapter] || "新たな冒険が待っている...";
}

// 新しい敵を生成（CSV駆動）
function generateNewEnemy() {
    console.log('🎲 generateNewEnemy関数が呼ばれました');
    console.log('📊 dataManager.loaded:', dataManager.loaded);
    console.log('📖 現在の章:', gameState.battle.chapter);
    
    if (!dataManager.loaded) {
        console.log('⚠️ データ未読み込み、フォールバック敵を使用');
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

    // 章の最大戦闘数を取得
    gameState.battle.maxBattles = dataManager.getChapterMaxBattles(gameState.battle.chapter);
    
    // ボス戦の判定
    if (gameState.battle.battleCount > gameState.battle.maxBattles) {
        console.log('👑 ボス戦生成中');
        // ボス敵を生成
        const bossData = dataManager.getBossEnemy(gameState.battle.chapter);
        if (bossData) {
            gameState.enemy = {
                id: bossData.id,
                name: bossData.name + ' (ボス)',
                hp: bossData.hp,
                maxHp: bossData.hp,
                attack: bossData.attack,
                defense: bossData.defense,
                magic: bossData.magic || 0,
                speed: bossData.speed,
                exp_reward: bossData.exp_reward || 100,
                gold_reward: bossData.gold_reward || 50,
                drop_rate: bossData.drop_rate || 0,
                drop_item: bossData.drop_item,
                image: bossData.image || 'boss.png',
                isBoss: true
            };
            addBattleLog(`章ボス「${gameState.enemy.name}」が現れた！`);
            
            // ボス遭遇時のストーリートリガーをチェック
            setTimeout(() => {
                if (storyTriggerManager) {
                    const trigger = storyTriggerManager.checkBossEncounter(bossData.id);
                    if (trigger) {
                        addBattleLog('📖 ストーリーイベントが発生しました');
                        storyTriggerManager.triggerStory(trigger.story_id);
                    }
                }
            }, 1000);
            
            return;
        }
    }

    // 通常敵を生成
    console.log('🎯 通常敵生成中...');
    const enemyData = dataManager.generateRandomEnemy(gameState.battle.chapter);
    console.log('🎲 選択された敵データ:', enemyData);
    
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
            image: enemyData.image || 'slime.png',
            isBoss: false
        };
        console.log('✅ 新しい敵を生成:', gameState.enemy);
        
        // 敵画像を表示
        const enemyImage = document.getElementById('enemyImage');
        if (enemyImage) {
            enemyImage.style.display = 'block';
        }
        
        // 敵情報オーバーレイを表示
        const enemyInfoOverlay = document.querySelector('.enemy-info-overlay');
        if (enemyInfoOverlay) {
            enemyInfoOverlay.style.display = 'block';
        }
        
        // オートモードが有効で戦闘中なら自動攻撃を開始
        if (gameState.battle.isAutoMode && gameState.battle.isPlayerTurn && !gameState.battle.battleEnded) {
            setTimeout(() => {
                playerAttack();
            }, 1000);
        }
    } else {
        console.log('❌ 敵データが取得できませんでした');
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

// 敗北後のリセット（フィールド/ダンジョン対応）
function resetAfterDefeat() {
    gameState.battle.battleCount = 1;
    gameState.battle.battleEnded = false;
    gameState.player.hp = gameState.player.maxHp;
    gameState.player.mp = gameState.player.maxMp;
    
    // 状態異常クリア
    gameState.player.statusEffects = {};
    
    // ダンジョンの場合は1階からやり直し
    if (gameState.battle.location === 'dungeon') {
        gameState.battle.dungeonFloor = 1;
    }
    
    // 新しい敵を生成
    generateNewEnemy();
    
    gameState.battle.isPlayerTurn = true;
    elements.battleLogContent.innerHTML = '<div class="log-entry">戦闘を再開しました</div>';
    addBattleLog(`${gameState.enemy.name}が現れた！`);
    updateUI();
}

// 次章へ
function nextChapter() {
    const previousChapter = gameState.battle.chapter;
    gameState.battle.chapter++;
    gameState.battle.battleCount = 1;
    gameState.battle.battleEnded = false;
    
    // 新章で解禁されるアイテムをチェック
    checkNewShopItems(previousChapter, gameState.battle.chapter);
    
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
    
    // 章開始時のストーリートリガーをチェック
    setTimeout(() => {
        if (storyTriggerManager) {
            const trigger = storyTriggerManager.checkChapterStart(gameState.battle.chapter);
            if (trigger) {
                addBattleLog('📖 ストーリーイベントが発生しました');
                storyTriggerManager.triggerStory(trigger.story_id);
            }
        }
    }, 1000);
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
        updateItemDisplay(); // アイテム表示を更新してからモーダルを表示
        elements.itemModal.style.display = 'flex';
    });
    
    // 逃げるボタン
    const fleeBtn = document.getElementById('fleeBtn');
    if (fleeBtn) {
        fleeBtn.addEventListener('click', () => {
            soundEffects.playClick();
            attemptFlee();
        });
    }
    
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
    
    // アイテム選択（動的に生成されるのでupdateItemDisplayで処理）
    
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
    
    // ショップイベントリスナー
    elements.shopBtn.addEventListener('click', () => {
        soundEffects.playClick();
        openShop();
    });

    // ストーリーイベントリスナー
    elements.storyBtn = document.getElementById('storyBtn');
    if (elements.storyBtn) {
        elements.storyBtn.addEventListener('click', () => {
            soundEffects.playClick();
            window.location.href = 'story.html?story=chapter_1';
        });
    }
    
    // オプションイベントリスナー
    elements.optionsBtn = document.getElementById('optionsBtn');
    if (elements.optionsBtn) {
        elements.optionsBtn.addEventListener('click', () => {
            soundEffects.playClick();
            openOptionsFromGame();
        });
    }
    
    elements.closeShopModal.addEventListener('click', () => {
        soundEffects.playClick();
        closeShop();
    });
    
    // ショップタブ切り替え
    document.getElementById('buyTab').addEventListener('click', () => {
        soundEffects.playClick();
        switchShopTab('buy');
    });
    
    document.getElementById('sellTab').addEventListener('click', () => {
        soundEffects.playClick();
        switchShopTab('sell');
    });
    
    document.getElementById('repairTab').addEventListener('click', () => {
        soundEffects.playClick();
        switchShopTab('repair');
    });
    
    elements.shopModal.addEventListener('click', (e) => {
        if (e.target === elements.shopModal) {
            closeShop();
        }
    });
    
    // レベルアップモーダルイベントリスナー
    elements.confirmLevelUp.addEventListener('click', () => {
        confirmLevelUpAllocation();
    });
    
    // ステータスポイント割り振りボタン
    document.querySelectorAll('.stat-btn').forEach(button => {
        button.addEventListener('click', () => {
            const stat = button.dataset.stat;
            const type = button.dataset.type;
            allocateStatPoint(stat, type);
        });
    });
    
    // フィールド/ダンジョン選択ボタン
    const fieldBtn = document.getElementById('fieldBtn');
    const dungeonBtn = document.getElementById('dungeonBtn');
    const locationInfo = document.getElementById('locationInfo');
    
    if (fieldBtn && dungeonBtn && locationInfo) {
        fieldBtn.addEventListener('click', () => {
            soundEffects.playClick();
            switchLocation('field');
        });
        
        dungeonBtn.addEventListener('click', () => {
            soundEffects.playClick();
            switchLocation('dungeon');
        });
    }
    
    // 宿屋ボタン
    const innBtn = document.getElementById('innBtn');
    if (innBtn) {
        innBtn.addEventListener('click', () => {
            soundEffects.playClick();
            stayAtInn();
        });
    }
    
    // ガチャショップボタン
    const gachaShopBtn = document.getElementById('gachaShopBtn');
    if (gachaShopBtn) {
        gachaShopBtn.addEventListener('click', () => {
            soundEffects.playClick();
            openGachaShop();
        });
    }
    
    // ガチャモーダルイベントリスナー
    const closeGachaModal = document.getElementById('closeGachaModal');
    if (closeGachaModal) {
        closeGachaModal.addEventListener('click', () => {
            soundEffects.playClick();
            closeGachaShop();
        });
    }
    
    // ガチャアクションボタン
    document.getElementById('equipmentGacha1')?.addEventListener('click', () => {
        soundEffects.playClick();
        drawEquipmentGacha(1);
    });
    
    document.getElementById('equipmentGacha10')?.addEventListener('click', () => {
        soundEffects.playClick();
        drawEquipmentGacha(10);
    });
    
    document.getElementById('illustrationGacha1')?.addEventListener('click', () => {
        soundEffects.playClick();
        drawIllustrationGacha(1);
    });
    
    document.getElementById('illustrationGacha10')?.addEventListener('click', () => {
        soundEffects.playClick();
        drawIllustrationGacha(10);
    });
}

// ショップ機能
function openShop() {
    if (!dataManager.loaded) {
        addBattleLog('ショップデータの読み込み中です...');
        return;
    }
    
    // 背景をアイテムショップ用に変更
    changeBackground('item_shop');
    
    // 敵情報を隠す
    const enemyInfoOverlay = document.querySelector('.enemy-info-overlay');
    if (enemyInfoOverlay) {
        enemyInfoOverlay.style.display = 'none';
    }
    
    // プレイヤーの所持金を表示
    elements.shopPlayerGold.textContent = gameState.player.gold;
    
    // デフォルトで購入タブを選択
    switchShopTab('buy');
    
    // ショップモーダルを表示
    elements.shopModal.style.display = 'flex';
}

function closeShop() {
    elements.shopModal.style.display = 'none';
    
    // 背景を町に戻す
    changeBackground('town');
    
    // ショップ利用後は町の状態にする（敵は出ない）
    gameState.battle.battleCount = 1;
    gameState.battle.battleEnded = true; // 敵が出ない状態
    gameState.battle.inTown = true; // 町にいる状態
    
    // 敵を非表示にする
    const enemyImage = document.getElementById('enemyImage');
    if (enemyImage) {
        enemyImage.style.display = 'none';
    }
    
    // 敵情報も非表示にする
    const enemyInfoOverlay = document.querySelector('.enemy-info-overlay');
    if (enemyInfoOverlay) {
        enemyInfoOverlay.style.display = 'none';
    }
    
    updateUI();
    addBattleLog('ショップを出ました。探索場所を選んでください。');
}

// ショップタブ切り替え
function switchShopTab(tab) {
    const buyTab = document.getElementById('buyTab');
    const sellTab = document.getElementById('sellTab');
    const repairTab = document.getElementById('repairTab');
    const shopItemsList = document.getElementById('shopItemsList');
    const sellItemsList = document.getElementById('sellItemsList');
    const repairItemsList = document.getElementById('repairItemsList');
    
    if (tab === 'buy') {
        buyTab.classList.add('active');
        sellTab.classList.remove('active');
        repairTab.classList.remove('active');
        shopItemsList.style.display = 'block';
        sellItemsList.style.display = 'none';
        repairItemsList.style.display = 'none';
        populateShopItems();
    } else if (tab === 'sell') {
        buyTab.classList.remove('active');
        sellTab.classList.add('active');
        repairTab.classList.remove('active');
        shopItemsList.style.display = 'none';
        sellItemsList.style.display = 'block';
        repairItemsList.style.display = 'none';
        populateSellItems();
    } else if (tab === 'repair') {
        buyTab.classList.remove('active');
        sellTab.classList.remove('active');
        repairTab.classList.add('active');
        shopItemsList.style.display = 'none';
        sellItemsList.style.display = 'none';
        repairItemsList.style.display = 'block';
        populateRepairItems();
    }
}

// 売却アイテムリスト生成
function populateSellItems() {
    const sellItemsList = document.getElementById('sellItemsList');
    sellItemsList.innerHTML = '';
    
    const sellableItems = [];
    
    // インベントリから売却可能なアイテムを取得
    for (const itemId in gameState.inventory) {
        const count = gameState.inventory[itemId];
        if (count > 0) {
            const shopItem = dataManager.getShopItem(itemId);
            if (shopItem && shopItem.sell_price) {
                sellableItems.push({
                    id: itemId,
                    item: shopItem,
                    count: count
                });
            }
        }
    }
    
    if (sellableItems.length === 0) {
        sellItemsList.innerHTML = '<div class="shop-empty">売却可能なアイテムがありません</div>';
        return;
    }
    
    sellableItems.forEach(sellableItem => {
        const itemElement = document.createElement('div');
        itemElement.className = 'sell-item';
        itemElement.innerHTML = `
            <div class="sell-item-info">
                <div class="sell-item-name">${sellableItem.item.item_name}</div>
                <div class="sell-item-desc">${sellableItem.item.description}</div>
            </div>
            <div class="sell-item-count">所持: ${sellableItem.count}個</div>
            <div class="sell-item-price">${sellableItem.item.sell_price}G</div>
        `;
        
        itemElement.addEventListener('click', () => {
            sellItem(sellableItem.id, sellableItem.item);
        });
        
        sellItemsList.appendChild(itemElement);
    });
}

// アイテム売却
function sellItem(itemId, item) {
    if (!gameState.inventory[itemId] || gameState.inventory[itemId] <= 0) {
        addBattleLog('そのアイテムを持っていません');
        return;
    }
    
    // アイテムを1個減らす
    gameState.inventory[itemId]--;
    
    // ゴールドを追加
    const sellPrice = parseInt(item.sell_price);
    gameState.player.gold += sellPrice;
    
    // UI更新
    const shopPlayerGold = document.getElementById('shopPlayerGold');
    if (shopPlayerGold) {
        shopPlayerGold.textContent = gameState.player.gold;
    }
    
    // 売却リストを再生成
    populateSellItems();
    updateUI();
    updateItemDisplay();
    
    addBattleLog(`${item.item_name}を${sellPrice}Gで売却しました！`);
    soundEffects.playClick();
}

// 修理アイテムリスト生成
function populateRepairItems() {
    const repairItemsList = document.getElementById('repairItemsList');
    repairItemsList.innerHTML = '';
    
    // 衣服の修理サービスを表示
    if (gameState.player.clothingState.canRepair && gameState.player.clothingState.damageLevel > 0) {
        const repairCost = 100;
        
        const repairElement = document.createElement('div');
        repairElement.className = 'repair-item';
        repairElement.innerHTML = `
            <div class="repair-item-info">
                <div class="repair-item-name">👔 衣服の修理</div>
                <div class="repair-item-desc">戦闘で傷ついた衣服を修理して、元の立ち絵に戻します</div>
                <div class="repair-item-status">現在のダメージレベル: ${gameState.player.clothingState.damageLevel}</div>
            </div>
            <div class="repair-item-price">${repairCost}G</div>
        `;
        
        repairElement.addEventListener('click', () => {
            repairClothing();
        });
        
        repairItemsList.appendChild(repairElement);
    } else {
        repairItemsList.innerHTML = '<div class="repair-empty">修理が必要な衣服がありません</div>';
    }
}

// 衣服修理機能
function repairClothing() {
    const repairCost = 100;
    
    // 修理の必要性チェック
    if (!gameState.player.clothingState.canRepair || gameState.player.clothingState.damageLevel <= 0) {
        addBattleLog('🔧 修理が必要な衣服がありません');
        return;
    }
    
    // 所持金チェック
    if (gameState.player.gold < repairCost) {
        addBattleLog(`🔧 衣服の修理には${repairCost}Gが必要です`);
        soundEffects.playClick();
        return;
    }
    
    // 修理実行
    gameState.player.gold -= repairCost;
    gameState.player.clothingState.damageLevel = 0;
    gameState.player.clothingState.isDamaged = false;
    gameState.player.clothingState.canRepair = false;
    
    // UI更新
    elements.shopPlayerGold.textContent = gameState.player.gold;
    updateUI();
    
    // プレイヤーの立ち絵を更新（元の状態に戻す）
    updatePlayerMedia();
    
    // 修理アイテムリストを再生成
    populateRepairItems();
    
    addBattleLog('👔 衣服を修理しました！元の立ち絵に戻りました');
    addBattleLog(`💰 ${repairCost}ゴールドを支払いました`);
    soundEffects.playClick();
}

function populateShopItems() {
    const shopItems = dataManager.getShopItems();
    elements.shopItemsList.innerHTML = '';
    
    // 現在の章以下のアイテムのみフィルタリング
    const availableItems = shopItems.filter(item => {
        const itemChapter = parseInt(item.chapter) || 1;
        return itemChapter <= gameState.battle.chapter;
    });
    
    if (availableItems.length === 0) {
        elements.shopItemsList.innerHTML = '<div class="shop-empty">この章では販売アイテムがありません</div>';
        return;
    }
    
    availableItems.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'shop-item';
        itemElement.innerHTML = `
            <div class="shop-item-info">
                <div class="shop-item-name">${item.item_name}</div>
                <div class="shop-item-desc">${item.description}</div>
            </div>
            <div class="shop-item-price">${item.price}G</div>
        `;
        
        itemElement.addEventListener('click', () => {
            buyItem(item);
        });
        
        elements.shopItemsList.appendChild(itemElement);
    });
}

function buyItem(item) {
    // 所持金チェック
    if (gameState.player.gold < item.price) {
        addBattleLog(`${item.item_name}を購入するには${item.price}G必要です。`);
        soundEffects.playClick();
        return;
    }
    
    // アイテムを購入
    gameState.player.gold -= item.price;
    
    // インベントリに追加
    if (gameState.inventory[item.item_id]) {
        gameState.inventory[item.item_id]++;
    } else {
        gameState.inventory[item.item_id] = 1;
    }
    
    // UI更新
    elements.shopPlayerGold.textContent = gameState.player.gold;
    updateUI();
    updateItemDisplay();
    
    addBattleLog(`${item.item_name}を購入しました！`);
    soundEffects.playClick();
}

// レベルアップシステム
let tempStatPoints = 0;
let tempStats = {};

function checkLevelUp() {
    const currentLevel = gameState.player.level;
    const requiredExp = currentLevel * 20;
    
    if (gameState.player.exp >= requiredExp) {
        // レベルアップ！
        gameState.player.level++;
        gameState.player.exp -= requiredExp;
        gameState.player.statPoints += 3; // レベルアップごとに3ポイント獲得
        
        addBattleLog(`レベルアップ！Lv.${gameState.player.level}になりました！`);
        addBattleLog(`ステータスポイントを3獲得しました！`);
        
        // レベルアップモーダルを表示
        setTimeout(() => {
            showLevelUpModal();
        }, 1500);
    }
}

function showLevelUpModal() {
    // モーダル内の表示を更新
    elements.levelUpDisplay.textContent = gameState.player.level;
    elements.availablePoints.textContent = gameState.player.statPoints;
    
    // テンポラリステータスを初期化
    tempStatPoints = gameState.player.statPoints;
    tempStats = {
        maxHp: gameState.player.maxHp,
        maxMp: gameState.player.maxMp,
        attack: gameState.player.attack,
        defense: gameState.player.defense,
        magic: gameState.player.magic,
        speed: gameState.player.speed
    };
    
    // ステータス表示を更新
    updateLevelUpDisplay();
    
    // モーダルを表示
    elements.levelUpModal.style.display = 'flex';
}

function updateLevelUpDisplay() {
    // 各ステータスの現在値を表示
    document.getElementById('statHp').textContent = tempStats.maxHp;
    document.getElementById('statMp').textContent = tempStats.maxMp;
    document.getElementById('statAttack').textContent = tempStats.attack;
    document.getElementById('statDefense').textContent = tempStats.defense;
    document.getElementById('statMagic').textContent = tempStats.magic;
    document.getElementById('statSpeed').textContent = tempStats.speed;
    
    // 残りポイント数を表示
    elements.availablePoints.textContent = tempStatPoints;
}

function allocateStatPoint(stat, type) {
    if (type === 'plus') {
        if (tempStatPoints <= 0) return;
        
        // ステータス増加
        if (stat === 'maxHp' || stat === 'maxMp') {
            tempStats[stat] += 10;
        } else {
            tempStats[stat] += 1;
        }
        tempStatPoints--;
    } else if (type === 'minus') {
        // ポイントを戻す処理
        const originalValue = gameState.player[stat];
        if (tempStats[stat] <= originalValue) return;
        
        if (stat === 'maxHp' || stat === 'maxMp') {
            tempStats[stat] -= 10;
        } else {
            tempStats[stat] -= 1;
        }
        tempStatPoints++;
    }
    
    updateLevelUpDisplay();
    soundEffects.playClick();
}

function confirmLevelUpAllocation() {
    // ステータスを実際に適用
    gameState.player.maxHp = tempStats.maxHp;
    gameState.player.maxMp = tempStats.maxMp;
    gameState.player.attack = tempStats.attack;
    gameState.player.defense = tempStats.defense;
    gameState.player.magic = tempStats.magic;
    gameState.player.speed = tempStats.speed;
    gameState.player.statPoints = tempStatPoints;
    
    // HP/MPを最大値に回復
    gameState.player.hp = gameState.player.maxHp;
    gameState.player.mp = gameState.player.maxMp;
    
    // UI更新
    updateUI();
    // HP全回復したのでプレイヤーメディアを更新
    updatePlayerMedia();
    
    // モーダルを閉じる
    elements.levelUpModal.style.display = 'none';
    
    addBattleLog('ステータスを振り分けました！');
    addBattleLog('HP・MPが全回復しました！');
    
    soundEffects.playClick();
}

// 逃走システム
function attemptFlee() {
    if (!gameState.battle.isPlayerTurn || gameState.battle.battleEnded) return;
    
    // ボス戦では100%失敗
    const isBoss = gameState.enemy.name.includes('ボス');
    if (isBoss) {
        addBattleLog('💀 ボス戦では逃げることができない！');
        gameState.battle.isPlayerTurn = false;
        setTimeout(enemyTurn, 1500);
        return;
    }
    
    // 50%の確率で成功
    const fleeSuccess = Math.random() < 0.5;
    
    if (fleeSuccess) {
        // 逃走成功
        addBattleLog('💨 逃走成功！戦闘から離脱した');
        addBattleLog('（経験値・ゴールドは獲得できません）');
        soundEffects.playClick();
        
        // 経験値・金なしで次の戦闘へ
        setTimeout(() => {
            nextBattleAfterFlee();
        }, 1500);
    } else {
        // 逃走失敗
        addBattleLog('❌ 逃走失敗！敵に阻まれた');
        soundEffects.playClick();
        
        // 敵のターンになる
        gameState.battle.isPlayerTurn = false;
        setTimeout(enemyTurn, 1500);
    }
}

// 装備システム
function equipItem(slot, item) {
    // ガチャ専用アイテムの定義
    const gachaItems = {
        'gacha-sword': { item_name: 'レアソード', item_id: 'gacha-sword', effect_value: 15 },
        'gacha-shield': { item_name: 'レアシールド', item_id: 'gacha-shield', effect_value: 8 },
        'gacha-helmet': { item_name: 'レアヘルム', item_id: 'gacha-helmet', effect_value: 6 },
        'gacha-armor': { item_name: 'レアアーマー', item_id: 'gacha-armor', effect_value: 10 },
        'legendary-sword': { item_name: 'レジェンドソード', item_id: 'legendary-sword', effect_value: 25 },
        'legendary-shield': { item_name: 'レジェンドシールド', item_id: 'legendary-shield', effect_value: 15 }
    };

    // アイテムIDを確定（itemオブジェクトから取得、またはガチャアイテムの場合は直接指定）
    const itemId = item.item_id;
    
    // 古い装備を外してインベントリに戻す
    const oldEquipment = gameState.player.equipment[slot];
    if (oldEquipment) {
        let oldItem = dataManager.getShopItem(oldEquipment);
        if (!oldItem && gachaItems[oldEquipment]) {
            oldItem = gachaItems[oldEquipment];
        }
        
        if (oldItem) {
            // 古い装備の効果を削除
            removeEquipmentEffect(oldItem);
            // 古い装備をインベントリに戻す
            if (gameState.inventory[oldEquipment]) {
                gameState.inventory[oldEquipment]++;
            } else {
                gameState.inventory[oldEquipment] = 1;
            }
            addBattleLog(`${oldItem.item_name}をインベントリに戻しました`);
        }
    }
    
    // 両手武器の場合の盾制約チェック
    if (slot === 'weapon' && itemId === 'two-hand-sword') {
        // 盾を強制的に外してインベントリに戻す
        const oldShield = gameState.player.equipment.shield;
        if (oldShield) {
            let shieldItem = dataManager.getShopItem(oldShield);
            if (!shieldItem && gachaItems[oldShield]) {
                shieldItem = gachaItems[oldShield];
            }
            
            if (shieldItem) {
                removeEquipmentEffect(shieldItem);
                // 盾をインベントリに戻す
                if (gameState.inventory[oldShield]) {
                    gameState.inventory[oldShield]++;
                } else {
                    gameState.inventory[oldShield] = 1;
                }
                addBattleLog(`${shieldItem.item_name}をインベントリに戻しました（両手武器のため）`);
            }
            gameState.player.equipment.shield = null;
        }
    }
    
    // 盾を装備しようとした時に両手武器をチェック
    if (slot === 'shield' && gameState.player.equipment.weapon === 'two-hand-sword') {
        addBattleLog('両手武器を装備中のため盾は装備できません！');
        return false;
    }
    
    // 新しい装備を着ける
    gameState.player.equipment[slot] = itemId;
    
    // 新しい装備の効果を適用
    applyEquipmentEffect(item);
    
    return true;
}

function applyEquipmentEffect(item) {
    // ガチャアイテムの場合、effect_typeがないのでスロットに基づいて判定
    const effectValue = item.effect_value || 0;
    
    if (item.effect_type === 'equip_weapon' || item.item_id === 'gacha-sword' || item.item_id === 'legendary-sword') {
        gameState.player.attack += effectValue;
    } else if (item.effect_type === 'equip_shield' || item.item_id === 'gacha-shield' || item.item_id === 'legendary-shield') {
        gameState.player.defense += effectValue;
    } else if (item.effect_type === 'equip_head' || item.item_id === 'gacha-helmet') {
        gameState.player.defense += effectValue;
    } else if (item.effect_type === 'equip_body' || item.item_id === 'gacha-armor') {
        gameState.player.defense += effectValue;
    }
}

function removeEquipmentEffect(item) {
    // ガチャアイテムの場合、effect_typeがないのでスロットに基づいて判定
    const effectValue = item.effect_value || 0;
    
    if (item.effect_type === 'equip_weapon' || item.item_id === 'gacha-sword' || item.item_id === 'legendary-sword') {
        gameState.player.attack -= effectValue;
    } else if (item.effect_type === 'equip_shield' || item.item_id === 'gacha-shield' || item.item_id === 'legendary-shield') {
        gameState.player.defense -= effectValue;
    } else if (item.effect_type === 'equip_head' || item.item_id === 'gacha-helmet') {
        gameState.player.defense -= effectValue;
    } else if (item.effect_type === 'equip_body' || item.item_id === 'gacha-armor') {
        gameState.player.defense -= effectValue;
    }
}

// 新章でのショップアイテム解禁チェック
function checkNewShopItems(previousChapter, currentChapter) {
    if (!dataManager.loaded) return;
    
    const shopItems = dataManager.getShopItems();
    const newItems = shopItems.filter(item => {
        const itemChapter = parseInt(item.chapter) || 1;
        return itemChapter === currentChapter;
    });
    
    if (newItems.length > 0) {
        const itemNames = newItems.map(item => item.item_name).join('、');
        addBattleLog(`🏪 ショップに新アイテムが入荷しました！`);
        addBattleLog(`新商品: ${itemNames}`);
    }
}

// フィールド/ダンジョン切り替え機能
function switchLocation(location) {
    const fieldBtn = document.getElementById('fieldBtn');
    const dungeonBtn = document.getElementById('dungeonBtn');
    const locationInfo = document.getElementById('locationInfo');
    
    if (gameState.battle.location === location && !gameState.battle.inTown) {
        return; // 既に同じ場所で町状態でない場合は何もしない
    }
    
    const previousLocation = gameState.battle.location;
    gameState.battle.location = location;
    gameState.battle.fieldMode = (location === 'field');
    
    // 背景を探索場所に応じて変更
    changeBackground(location);
    
    // UI更新
    fieldBtn.classList.toggle('active', location === 'field');
    dungeonBtn.classList.toggle('active', location === 'dungeon');
    
    // 敵情報オーバーレイを初期化（探索開始時は非表示）
    const enemyInfoOverlay = document.querySelector('.enemy-info-overlay');
    if (enemyInfoOverlay) {
        enemyInfoOverlay.style.display = 'none';
        console.log("🔧 Enemy info overlay hidden when switching location");
    }
    
    // CSVからロケーション情報を取得
    if (dataManager.loaded) {
        const locationData = dataManager.getLocation(location, gameState.battle.chapter);
        if (locationData) {
            if (location === 'field') {
                locationInfo.textContent = `${locationData.location_name}で安全に戦闘`;
                addBattleLog(`📍 ${locationData.location_name}に移動しました`);
                addBattleLog('・負けても所持金の半分を失うだけで済みます');
                addBattleLog('・章ごとに強い敵が登場します');
            } else {
                locationInfo.textContent = `${locationData.location_name}で高リスク・高リターン戦闘`;
                gameState.battle.dungeonFloor = 1;
                addBattleLog(`⛰️ ${locationData.location_name}に入りました`);
                addBattleLog('・負けると所持金の半分を失い、1階からやり直しです');
                addBattleLog('・連戦でレベル上げと金稼ぎが効率的にできます');
            }
        }
    } else {
        // フォールバック表示
        if (location === 'field') {
            locationInfo.textContent = 'フィールドで安全に戦闘';
            addBattleLog('📍 フィールドに移動しました');
        } else {
            locationInfo.textContent = 'ダンジョンで高リスク・高リターン戦闘';
            gameState.battle.dungeonFloor = 1;
            addBattleLog('⛰️ ダンジョンに入りました');
        }
    }
    
    // ダンジョン初回入場時のストーリートリガーをチェック
    if (location !== 'field' && previousLocation !== location && storyTriggerManager) {
        setTimeout(() => {
            const dungeonId = `${location}_${gameState.battle.chapter}`;
            const trigger = storyTriggerManager.checkDungeonFirstEnter(dungeonId);
            if (trigger) {
                addBattleLog('📖 ストーリーイベントが発生しました');
                storyTriggerManager.triggerStory(trigger.story_id);
            }
        }, 500);
    }
    
    // 戦闘をリセットして新しい敵を生成
    gameState.battle.battleCount = 1;
    gameState.battle.battleEnded = false;
    gameState.battle.inTown = false; // 探索場所を選んだので町を出る
    generateNewEnemy();
    updateUI();
}

// 敗北時のペナルティ処理
function applyDefeatPenalty() {
    const goldLoss = Math.floor(gameState.player.gold / 2);
    gameState.player.gold -= goldLoss;
    
    if (gameState.battle.location === 'dungeon') {
        // ダンジョンでの敗北：1階からやり直し
        gameState.battle.dungeonFloor = 1;
        addBattleLog(`💀 敗北... 所持金${goldLoss}Gを失い、ダンジョン1階からやり直しです`);
    } else {
        // フィールドでの敗北：現在の場所で継続
        addBattleLog(`💀 敗北... 所持金${goldLoss}Gを失いました`);
    }
}

// 宿屋システム
function stayAtInn() {
    const innCost = 100;
    
    // フィールドでのみ利用可能
    if (gameState.battle.location !== 'field') {
        addBattleLog('❌ 宿屋はフィールドからのみ利用できます');
        return;
    }
    
    // 所持金チェック
    if (gameState.player.gold < innCost) {
        addBattleLog(`❌ 宿屋の料金${innCost}Gが不足しています`);
        return;
    }
    
    // HP/MPが既に満タンの場合
    if (gameState.player.hp >= gameState.player.maxHp && gameState.player.mp >= gameState.player.maxMp) {
        addBattleLog('❌ HP・MPは既に満タンです');
        return;
    }
    
    // 背景を宿屋用に変更
    changeBackground('inn');
    
    // 敵情報を隠す
    const enemyInfoOverlay = document.querySelector('.enemy-info-overlay');
    if (enemyInfoOverlay) {
        enemyInfoOverlay.style.display = 'none';
    }
    
    // 宿屋利用
    gameState.player.gold -= innCost;
    gameState.player.hp = gameState.player.maxHp;
    gameState.player.mp = gameState.player.maxMp;
    
    // 状態異常クリア
    gameState.player.statusEffects = {};
    
    addBattleLog('🏨 宿屋に宿泊しました');
    addBattleLog(`💰 ${innCost}ゴールドを支払いました`);
    addBattleLog('✨ HP・MPが全回復しました！');
    addBattleLog('🌟 状態異常も治療されました');
    
    // 宿屋利用後は町の状態にする（敵は出ない）
    gameState.battle.battleCount = 1;
    gameState.battle.battleEnded = true;
    gameState.battle.inTown = true;
    
    // 敵を非表示にする
    const enemyImage = document.getElementById('enemyImage');
    if (enemyImage) {
        enemyImage.style.display = 'none';
    }
    
    addBattleLog('宿屋を出ました。探索場所を選んでください。');
    
    updateUI();
    // HPが全回復したのでプレイヤーメディアを更新
    updatePlayerMedia();
    soundEffects.playHeal(); // ヒール音を再生
}

// 装備ガチャ
function drawEquipmentGacha(count = 1) {
    const singleCost = 500;
    const totalCost = count === 10 ? 4500 : singleCost * count; // 10連は500G割引
    
    if (gameState.player.gold < totalCost) {
        addBattleLog(`❌ 装備ガチャの料金${totalCost}Gが不足しています`);
        return;
    }
    
    gameState.player.gold -= totalCost;
    
    // 所持金更新
    const gachaPlayerGold = document.getElementById('gachaPlayerGold');
    if (gachaPlayerGold) {
        gachaPlayerGold.textContent = gameState.player.gold;
    }
    
    addBattleLog(`🎰 装備ガチャを${count}回回しました！`);
    
    // ガチャ結果を保存する配列
    const gachaResults = [];
    
    for (let i = 0; i < count; i++) {
        // ガチャ結果を決定（70%で装備、30%でポーション）
        const isEquipment = Math.random() < 0.7;
        
        if (isEquipment) {
            // 装備をランダム取得（店売りよりも強力）
            const equipmentPool = [
                { id: 'gacha-sword', name: 'レアソード', type: 'weapon', power: 15 },
                { id: 'gacha-shield', name: 'レアシールド', type: 'shield', defense: 8 },
                { id: 'gacha-helmet', name: 'レアヘルム', type: 'head', defense: 6 },
                { id: 'gacha-armor', name: 'レアアーマー', type: 'body', defense: 10 },
                { id: 'legendary-sword', name: 'レジェンドソード', type: 'weapon', power: 25 },
                { id: 'legendary-shield', name: 'レジェンドシールド', type: 'shield', defense: 15 }
            ];
            
            const result = equipmentPool[Math.floor(Math.random() * equipmentPool.length)];
            addBattleLog(`✨ ${result.name}を獲得しました！`);
            gachaResults.push(result);
            
            // アイテムをインベントリに追加（簡易実装）
            if (gameState.inventory[result.id] === undefined) {
                gameState.inventory[result.id] = 0;
            }
            gameState.inventory[result.id]++;
            
        } else {
            // ハズレ：ポーション
            const potionCount = Math.floor(Math.random() * 3) + 1;
            gameState.inventory.potion += potionCount;
            addBattleLog(`💊 ポーション${potionCount}個を獲得しました`);
            gachaResults.push({ name: `ポーション`, count: potionCount });
        }
    }
    
    // ガチャ結果を画面に表示
    showGachaResults(gachaResults);
    
    updateUI();
    updateItemDisplay(); // アイテム表示を更新
}

function showGachaResults(results) {
    const gachaResultsDiv = document.getElementById('gachaResults');
    const gachaResultsList = document.getElementById('gachaResultsList');
    
    if (!gachaResultsDiv || !gachaResultsList) {
        return;
    }
    
    // 既存のクリックリスナーを削除（もしあれば）
    if (gachaResultsDiv.hideResultsListener) {
        document.removeEventListener('click', gachaResultsDiv.hideResultsListener);
        gachaResultsDiv.hideResultsListener = null;
    }
    
    // 結果リストをクリア
    gachaResultsList.innerHTML = '';
    
    // 各結果を表示
    results.forEach((result, index) => {
        const resultItem = document.createElement('div');
        resultItem.className = 'gacha-result-item';
        
        if (result.count) {
            // ポーションの場合
            resultItem.innerHTML = `
                <div class="result-icon">💊</div>
                <div class="result-text">${result.name} ${result.count}個</div>
            `;
        } else if (result.type === 'illustration') {
            // イラストの場合
            resultItem.innerHTML = `
                <div class="result-icon">🖼️</div>
                <div class="result-text">${result.name}を獲得しました</div>
            `;
        } else {
            // 装備の場合
            let icon = '⚔️';
            if (result.type === 'shield') icon = '🛡️';
            else if (result.type === 'head') icon = '⛑️';
            else if (result.type === 'body') icon = '👕';
            
            let rarity = 'rare';
            if (result.name.includes('レジェンド')) {
                rarity = 'legendary';
                icon = '🌟';
            }
            
            resultItem.innerHTML = `
                <div class="result-icon">${icon}</div>
                <div class="result-text ${rarity}">${result.name}を獲得しました</div>
            `;
        }
        
        gachaResultsList.appendChild(resultItem);
    });
    
    // 結果エリアを表示
    gachaResultsDiv.style.display = 'block';
    
    // 新しいクリックリスナーを作成
    function hideGachaResultsOnClick(event) {
        // ガチャ結果エリア内のクリックは無視
        if (gachaResultsDiv.contains(event.target)) {
            return;
        }
        
        // ガチャ結果を非表示にする
        gachaResultsDiv.style.display = 'none';
        // リスナーを削除
        document.removeEventListener('click', hideGachaResultsOnClick);
        gachaResultsDiv.hideResultsListener = null;
    }
    
    // 参照を保存してあとで削除できるようにする
    gachaResultsDiv.hideResultsListener = hideGachaResultsOnClick;
    
    // 少し遅延を付けて、ガチャボタンのクリックイベントが終わってからリスナーを追加
    setTimeout(() => {
        document.addEventListener('click', hideGachaResultsOnClick);
    }, 100);
}

function updatePlayerMedia() {
    console.log("🎬 updatePlayerMedia() called");
    
    const playerData = dataManager.getCharacter('player');
    console.log("Player data:", playerData);
    
    if (!playerData) {
        console.warn("❌ No player data found");
        return;
    }
    
    const container = document.getElementById('playerMediaContainer');
    console.log("Media container:", container);
    
    if (!container) {
        console.error("❌ playerMediaContainer not found in DOM");
        return;
    }
    
    // 既存のメディア要素をクリア
    console.log("🧹 Clearing existing media elements");
    container.innerHTML = '';
    
    // HPパーセンテージを計算
    const hpPercentage = (gameState.player.hp / gameState.player.maxHp) * 100;
    console.log(`❤️ HP: ${gameState.player.hp}/${gameState.player.maxHp} (${hpPercentage.toFixed(1)}%)`);
    
    // 衣服のダメージ状態に応じて立ち絵を選択
    let portraitFile = playerData.portrait; // デフォルト（100%）
    let newDamageLevel = 0;
    
    if (hpPercentage <= 0) {
        portraitFile = playerData.portrait_defeated || playerData.portrait;
        newDamageLevel = 4;
    } else if (hpPercentage <= 30) {
        portraitFile = playerData.portrait_damaged_30 || playerData.portrait;
        newDamageLevel = 3;
    } else if (hpPercentage <= 50) {
        portraitFile = playerData.portrait_damaged_50 || playerData.portrait;
        newDamageLevel = 2;
    } else if (hpPercentage <= 70) {
        portraitFile = playerData.portrait_damaged_70 || playerData.portrait;
        newDamageLevel = 1;
    }
    
    // ダメージレベルを更新（一度下がったら修理するまで元に戻らない）
    if (newDamageLevel > gameState.player.clothingState.damageLevel) {
        gameState.player.clothingState.damageLevel = newDamageLevel;
        gameState.player.clothingState.isDamaged = newDamageLevel > 0;
        gameState.player.clothingState.canRepair = newDamageLevel > 0;
        console.log(`👗 Clothing damage level increased to: ${newDamageLevel}`);
    }
    
    // 現在のダメージレベルに応じて立ち絵を選択（修理されるまで元に戻らない）
    const currentDamageLevel = gameState.player.clothingState.damageLevel;
    if (currentDamageLevel >= 4) {
        portraitFile = playerData.portrait_defeated || playerData.portrait;
    } else if (currentDamageLevel >= 3) {
        portraitFile = playerData.portrait_damaged_30 || playerData.portrait;
    } else if (currentDamageLevel >= 2) {
        portraitFile = playerData.portrait_damaged_50 || playerData.portrait;
    } else if (currentDamageLevel >= 1) {
        portraitFile = playerData.portrait_damaged_70 || playerData.portrait;
    }
    
    console.log(`👗 Current damage level: ${currentDamageLevel}, using portrait: ${portraitFile}`);
    
    // ファイル拡張子で自動判定
    const isVideoFile = portraitFile.toLowerCase().endsWith('.mp4');
    const mediaType = isVideoFile ? 'video' : 'image';
    const mediaPath = `./assets/images/characters/${portraitFile}`;
    
    console.log(`📁 Portrait file: ${portraitFile}`);
    console.log(`🎯 Media type detected: ${mediaType}`);
    console.log(`📂 Media path: ${mediaPath}`);
    
    if (mediaType === 'video') {
        console.log("🎥 Creating video element...");
        
        // MP4動画の場合
        const videoElement = document.createElement('video');
        videoElement.id = 'playerVideo';
        videoElement.className = 'player-video';
        videoElement.src = mediaPath;
        videoElement.alt = playerData.name;
        videoElement.autoplay = true;
        videoElement.loop = true;
        videoElement.muted = true; // ブラウザの自動再生ポリシー対応
        videoElement.playsInline = true;
        
        console.log("🎥 Video element created:", videoElement);
        
        // エラーハンドリング
        videoElement.onerror = function(e) {
            console.error(`❌ Failed to load video: ${mediaPath}`, e);
            this.style.backgroundColor = '#4299e1';
            this.innerHTML = `<div class='placeholder-text'>${playerData.name}<br>動画</div>`;
        };
        
        // 読み込み成功時のログ
        videoElement.onloadeddata = function() {
            console.log(`✅ Video loaded successfully: ${mediaPath}`);
        };
        
        // 再生開始時のログ
        videoElement.onplay = function() {
            console.log(`▶️ Video playback started: ${mediaPath}`);
        };
        
        container.appendChild(videoElement);
        console.log("🎥 Video element added to container");
        
    } else {
        console.log("🖼️ Creating image element...");
        
        // PNG画像の場合（デフォルト）
        const imgElement = document.createElement('img');
        imgElement.id = 'playerImage';
        imgElement.className = 'player-media';
        imgElement.src = mediaPath;
        imgElement.alt = playerData.name;
        
        console.log("🖼️ Image element created:", imgElement);
        
        // エラーハンドリング
        imgElement.onerror = function(e) {
            console.error(`❌ Failed to load image: ${mediaPath}`, e);
            this.style.backgroundColor = '#4299e1';
            this.innerHTML = `<div class='placeholder-text'>${playerData.name}<br>立ち絵</div>`;
        };
        
        // 読み込み成功時のログ
        imgElement.onload = function() {
            console.log(`✅ Image loaded successfully: ${mediaPath}`);
        };
        
        container.appendChild(imgElement);
        console.log("🖼️ Image element added to container");
    }
    
    console.log("🎬 updatePlayerMedia() completed");
}

// イラストガチャ
function drawIllustrationGacha(count = 1) {
    const singleCost = 100;
    const totalCost = count === 10 ? 900 : singleCost * count; // 10連は100G割引
    
    if (gameState.player.gold < totalCost) {
        addBattleLog(`❌ イラストガチャの料金${totalCost}Gが不足しています`);
        return;
    }
    
    gameState.player.gold -= totalCost;
    
    // 所持金更新
    const gachaPlayerGold = document.getElementById('gachaPlayerGold');
    if (gachaPlayerGold) {
        gachaPlayerGold.textContent = gameState.player.gold;
    }
    
    addBattleLog(`🎰 イラストガチャを${count}回回しました！`);
    
    // ガチャ結果を保存する配列
    const gachaResults = [];
    
    for (let i = 0; i < count; i++) {
        // イラストガチャ結果を決定
        const illustrations = [
            'スライム図鑑',
            'ゴブリン図鑑', 
            'オーク図鑑',
            '魔法使い図鑑',
            'ドラゴン図鑑',
            '謎の美少女イラスト',
            'レア戦士イラスト',
            '秘密のイラスト'
        ];
        
        const result = illustrations[Math.floor(Math.random() * illustrations.length)];
        addBattleLog(`🖼️ ${result}を獲得しました！`);
        gachaResults.push({ name: result, type: 'illustration' });
    }
    
    // ガチャ結果を画面に表示
    showGachaResults(gachaResults);
    
    addBattleLog('📁 ギャラリーに保存されました');
    
    // ギャラリーシステムは今後の実装予定として、現在はログのみ
    
    updateUI();
}

// オプション機能
function openOptionsFromGame() {
    // title.htmlと同じオプション機能を実装
    // 現在は簡易的にアラートで代用
    alert('オプション機能は今後実装予定です\n・音量設定\n・画面設定\n・操作設定\nなどを追加予定');
}

// ガチャショップ機能
function openGachaShop() {
    // 背景をガチャショップ用に変更
    changeBackground('gacha_shop');
    
    // 敵情報を隠す
    const enemyInfoOverlay = document.querySelector('.enemy-info-overlay');
    if (enemyInfoOverlay) {
        enemyInfoOverlay.style.display = 'none';
    }
    
    // プレイヤーの所持金を表示
    const gachaPlayerGold = document.getElementById('gachaPlayerGold');
    if (gachaPlayerGold) {
        gachaPlayerGold.textContent = gameState.player.gold;
    }
    
    // ガチャモーダルを表示
    const gachaModal = document.getElementById('gachaModal');
    if (gachaModal) {
        gachaModal.style.display = 'flex';
    }
}

function closeGachaShop() {
    const gachaModal = document.getElementById('gachaModal');
    if (gachaModal) {
        gachaModal.style.display = 'none';
    }
    
    // 背景を町に戻す
    changeBackground('town');
    
    // ガチャショップ利用後は町の状態にする（敵は出ない）
    gameState.battle.battleCount = 1;
    gameState.battle.battleEnded = true;
    gameState.battle.inTown = true;
    
    // 敵を非表示にする
    const enemyImage = document.getElementById('enemyImage');
    if (enemyImage) {
        enemyImage.style.display = 'none';
    }
    
    // 敵情報も非表示にする
    const enemyInfoOverlay = document.querySelector('.enemy-info-overlay');
    if (enemyInfoOverlay) {
        enemyInfoOverlay.style.display = 'none';
    }
    
    updateUI();
    addBattleLog('ガチャショップを出ました。探索場所を選んでください。');
}

// ゲーム初期化
async function initGame() {
    setupEventListeners();
    
    // 初期状態では町の背景を設定
    changeBackground('town');
    
    // 敵情報オーバーレイを初期状態で非表示に設定
    const enemyInfoOverlay = document.querySelector('.enemy-info-overlay');
    if (enemyInfoOverlay) {
        enemyInfoOverlay.style.display = 'none';
        console.log("🔧 Enemy info overlay hidden on initialization");
    }
    
    // CSV データ読み込み
    addBattleLog("ゲームデータを読み込み中...");
    console.log("🔄 Loading game data...");
    const loadSuccess = await dataManager.loadAllData();
    
    if (loadSuccess) {
        gameState.dataLoaded = true;
        addBattleLog("データ読み込み完了！");
        console.log("✅ Game data loaded successfully");
        
        // CSV駆動でプレイヤーデータを初期化
        const playerData = dataManager.getCharacter('player');
        if (playerData) {
            console.log("Player data loaded:", playerData);
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
        
        // プレイヤーメディア（画像/動画）を更新
        console.log("🎬 Updating player media...");
        updatePlayerMedia();
    } else {
        addBattleLog("データ読み込み失敗。フォールバックモードで開始。");
        console.error("❌ Failed to load game data");
    }
    
    // 章情報を設定
    const currentStage = dataManager.getStage(gameState.battle.chapter);
    if (currentStage) {
        gameState.battle.maxBattles = currentStage.max_battles;
    }
    
    // 町状態なので敵は生成せず、敵も非表示
    const enemyImage = document.getElementById('enemyImage');
    if (enemyImage) {
        enemyImage.style.display = 'none';
    }
    
    updateUI();
    
    addBattleLog("ゲームが開始されました");
    addBattleLog("探索場所を選んで冒険を始めましょう！");
    console.log("🎮 Game initialization complete");
}

// 全画像のキャッシュクリア関数
function reloadAllImages() {
    const timestamp = Date.now();
    console.log(`🔄 Reloading all images with timestamp: ${timestamp}`);
    
    // プレイヤーポートレート画像
    const playerImage = document.getElementById('playerImage');
    if (playerImage) {
        const currentSrc = playerImage.src.split('?')[0]; // クエリパラメータを除去
        playerImage.src = `${currentSrc}?v=${timestamp}`;
        console.log(`🎭 Player image reloaded: ${playerImage.src}`);
    }
    
    // プレイヤー動画
    const playerVideo = document.getElementById('playerVideo');
    if (playerVideo) {
        const currentSrc = playerVideo.src.split('?')[0];
        playerVideo.src = `${currentSrc}?v=${timestamp}`;
        console.log(`🎬 Player video reloaded: ${playerVideo.src}`);
    }
    
    // 敵画像
    if (gameState.enemy && gameState.enemy.image) {
        const imagePath = `./assets/images/enemies/${gameState.enemy.image}?v=${timestamp}`;
        elements.enemyImage.src = imagePath;
        console.log(`👹 Enemy image reloaded: ${imagePath}`);
    }
    
    // 背景画像
    const stageBackground = document.getElementById('stageBackground');
    if (stageBackground && stageBackground.src) {
        const currentSrc = stageBackground.src.split('?')[0];
        stageBackground.src = `${currentSrc}?v=${timestamp}`;
        console.log(`🖼️ Background image reloaded: ${stageBackground.src}`);
    }
    
    console.log('🖼️ All images reloaded with cache busting');
}

// ページ読み込み完了時にゲーム開始
// キーボードショートカット
document.addEventListener('keydown', async (e) => {
    // Ctrl+R: CSVデータとキャッシュクリア
    if (e.ctrlKey && e.key === 'r') {
        e.preventDefault();
        console.log('Cache clearing requested...');
        
        // データを再読み込み
        const success = await dataManager.reloadAllData();
        
        // ストーリートリガーも再読み込み
        if (storyTriggerManager) {
            await storyTriggerManager.reloadTriggers();
        }
        
        if (success) {
            // UIを更新
            updateUI();
            updateShopDisplay();
            updateLocationButtons();
            
            // プレイヤーメディア（画像/動画）を更新
            updatePlayerMedia();
            
            // 画像キャッシュもクリア
            reloadAllImages();
            
            // フィードバック
            addBattleLog('🔄 CSVデータと画像キャッシュをクリアしました');
            console.log('✅ CSV data and image cache cleared successfully');
        } else {
            addBattleLog('❌ データの再読み込みに失敗しました');
            console.error('❌ Failed to reload data');
        }
    }
});

// エフェクト関数
function showPlayerAttackEffect() {
    console.log('🗡️ プレイヤー攻撃エフェクト実行！');
    const attackEffect = document.getElementById('attackEffect');
    if (attackEffect) {
        console.log('✅ attackEffect要素が見つかりました');
        attackEffect.classList.add('show');
        console.log('✅ showクラスを追加しました');
        setTimeout(() => {
            attackEffect.classList.remove('show');
            console.log('✅ showクラスを削除しました');
        }, 600);
    } else {
        console.error('❌ attackEffect要素が見つかりません！');
    }
}

function showEnemyAttackEffect() {
    console.log('👹 敵攻撃エフェクト実行！');
    const enemyImage = document.getElementById('enemyImage');
    if (enemyImage) {
        console.log('✅ enemyImage要素が見つかりました');
        enemyImage.classList.add('enemy-attack');
        console.log('✅ enemy-attackクラスを追加しました');
        setTimeout(() => {
            enemyImage.classList.remove('enemy-attack');
            console.log('✅ enemy-attackクラスを削除しました');
        }, 400);
    } else {
        console.error('❌ enemyImage要素が見つかりません！');
    }
}

document.addEventListener('DOMContentLoaded', initGame);
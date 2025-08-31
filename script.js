// ゲーム状態管理（リファクタリング版）
let gameState = {
    // 現在のプレイヤー情報（アクティブなキャラクターへの参照）
    player: {
        name: "主人公",
        character_class: "warrior",
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
        statPoints: 0,
        equipment: {
            weapon: null,
            shield: null,
            head: null,
            body: null
        },
        clothingState: {
            isDamaged: false,
            damageLevel: 0,
            canRepair: false
        }
    },
    
    // キャラクター個別データ（各キャラクターのレベル、経験値、装備など）
    characterData: {
        'player': {
            name: "主人公",
            level: 1,
            exp: 0,
            statPoints: 0,
            baseStats: { hp: 100, mp: 30, attack: 20, defense: 10, magic: 15, speed: 12 },
            equipment: { weapon: null, shield: null, head: null, body: null },
            clothingState: { isDamaged: false, damageLevel: 0, canRepair: false }
        }
        // 他のキャラクターは酒場で購入時に追加される
    },
    
    // 共通データ（全キャラクターで共有）
    shared: {
        gold: 99999,
        inventory: {
            potion: 3,
            ether: 1,
            hi_potion: 0,
            bomb_stone: 0,
            power_crystal: 0,
            shield_stone: 0,
            magic_gem: 0,
            speed_boots: 0,
            life_crystal: 0,
            mana_crystal: 0,
            antidote: 0,
            paralysis_heal: 0,
            awakening: 0
        }
    },
    
    enemy: null,
    battle: {
        chapter: 1,
        battleCount: 1,
        maxBattles: 10,
        isPlayerTurn: true,
        isAutoMode: false,
        autoLevelUpMode: 'manual', // 'manual' or 'random'
        battleEnded: false,
        location: null,
        dungeonFloor: 1,
        fieldMode: false,
        inTown: true,
        storyInProgress: false, // ストーリーイベント進行中フラグ
        guildFirstVisits: {} // 章ごとのギルド初回訪問記録
    },
    characters: {
        currentCharacter: 'player',
        purchasedCharacters: ['player']
    },
    dataLoaded: false
};;

// キャラクター管理ヘルパー関数
const CharacterManager = {
    // 現在のキャラクターデータを保存
    saveCurrentCharacter() {
        const currentId = gameState.characters.currentCharacter;
        if (!gameState.characterData[currentId]) {
            gameState.characterData[currentId] = {};
        }
        
        gameState.characterData[currentId] = {
            name: gameState.player.name,
            character_class: gameState.player.character_class,
            level: gameState.player.level,
            exp: gameState.player.exp,
            statPoints: gameState.player.statPoints,
            baseStats: {
                hp: gameState.player.maxHp,
                mp: gameState.player.maxMp,
                attack: gameState.player.attack,
                defense: gameState.player.defense,
                magic: gameState.player.magic,
                speed: gameState.player.speed
            },
            equipment: { ...gameState.player.equipment },
            clothingState: { ...gameState.player.clothingState }
        };
        
        console.log(`💾 ${gameState.player.name}のデータを保存しました:`, gameState.characterData[currentId]);
    },
    
    // 指定キャラクターのデータを読み込み
    loadCharacter(characterId) {
        const characterData = gameState.characterData[characterId];
        if (!characterData) {
            console.error(`❌ キャラクターデータが見つかりません: ${characterId}`);
            return false;
        }
        
        // プレイヤーデータを更新
        gameState.player.name = characterData.name;
        gameState.player.character_class = characterData.character_class;
        gameState.player.level = characterData.level;
        gameState.player.exp = characterData.exp;
        gameState.player.statPoints = characterData.statPoints;
        
        // ベースステータスを設定
        gameState.player.maxHp = characterData.baseStats.hp;
        gameState.player.maxMp = characterData.baseStats.mp;
        gameState.player.attack = characterData.baseStats.attack;
        gameState.player.defense = characterData.baseStats.defense;
        gameState.player.magic = characterData.baseStats.magic;
        gameState.player.speed = characterData.baseStats.speed;
        
        // 現在のHP/MPを最大値に設定（キャラクター切り替え時は全回復）
        gameState.player.hp = gameState.player.maxHp;
        gameState.player.mp = gameState.player.maxMp;
        
        // 装備とクロージング状態を復元
        gameState.player.equipment = { ...characterData.equipment };
        gameState.player.clothingState = { ...characterData.clothingState };
        
        console.log(`📥 ${characterData.name}のデータを読み込みました:`, gameState.player);
        return true;
    },
    
    // 新しいキャラクターを初期化
    initializeNewCharacter(characterId, csvData) {
        gameState.characterData[characterId] = {
            name: csvData.name,
            character_class: csvData.character_class,
            level: parseInt(csvData.level) || 1,
            exp: 0,
            statPoints: 0,
            baseStats: {
                hp: parseInt(csvData.base_hp) || 100,
                mp: parseInt(csvData.base_mp) || 30,
                attack: parseInt(csvData.base_attack) || 20,
                defense: parseInt(csvData.base_defense) || 10,
                magic: parseInt(csvData.base_magic) || 15,
                speed: parseInt(csvData.base_speed) || 12
            },
            equipment: { weapon: null, shield: null, head: null, body: null },
            clothingState: { isDamaged: false, damageLevel: 0, canRepair: false }
        };
        
        console.log(`🆕 新しいキャラクター ${csvData.name} を初期化しました:`, gameState.characterData[characterId]);
    }
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
    tavernBtn: document.getElementById('tavernBtn'),
    tavernModal: document.getElementById('tavernModal'),
    closeTavernModal: document.getElementById('closeTavernModal'),
    tavernPlayerGold: document.getElementById('tavernPlayerGold'),
    availableCharactersList: document.getElementById('availableCharactersList'),
    itemList: document.getElementById('itemList'),
    levelUpModal: document.getElementById('levelUpModal'),
    levelUpDisplay: document.getElementById('levelUpDisplay'),
    availablePoints: document.getElementById('availablePoints'),
    confirmLevelUp: document.getElementById('confirmLevelUp'),
    autoModeSettingsModal: document.getElementById('autoModeSettingsModal')
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
    
    // プレイヤー名を更新
    const playerNameElement = document.getElementById('playerName');
    if (playerNameElement) {
        playerNameElement.textContent = gameState.player.name;
    }
    
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
    // 敵名の表示更新（安全チェック付き、ストーリー進行中は非表示）
    if (elements.enemyName) {
        if (gameState.battle.storyInProgress) {
            elements.enemyName.textContent = '';
        } else {
            elements.enemyName.textContent = gameState.enemy ? gameState.enemy.name : '';
        }
    }
    
    // 町状態でない場合のみ背景を自動更新
    if (!gameState.battle.inTown) {
        updateStageBackground();
    }
    
    // 敵画像を更新（キャッシュバスター付き、安全チェック強化）
    const enemyImage = document.getElementById('enemyImage');
    if (gameState.enemy && gameState.enemy.image && !gameState.battle.inTown && elements.enemyImage && enemyImage) {
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
    
    // 敵のHP表示更新（安全チェック付き、ストーリー進行中は非表示）
    if (gameState.enemy && elements.enemyHpBar && elements.enemyHpText && !gameState.battle.storyInProgress) {
        const enemyHpPercent = (gameState.enemy.hp / gameState.enemy.maxHp) * 100;
        elements.enemyHpBar.style.width = `${enemyHpPercent}%`;
        elements.enemyHpText.textContent = `${gameState.enemy.hp}/${gameState.enemy.maxHp}`;
    } else if (elements.enemyHpBar && elements.enemyHpText) {
        // 敵がいない場合またはストーリー進行中はHP表示をクリア
        elements.enemyHpBar.style.width = '0%';
        elements.enemyHpText.textContent = '';
    }
    
    // 【最重要】敵画像の表示・非表示を確実に制御（最後に実行）
    if (enemyImage) {
        if (gameState.battle.inTown || !gameState.enemy) {
            // 町にいる、または敵がいない場合は確実に非表示
            enemyImage.style.display = 'none';
            console.log("👹 Enemy image hidden (inTown or no enemy)");
        } else if (gameState.enemy && !gameState.battle.inTown) {
            // 戦闘中で敵がいる場合のみ表示
            enemyImage.style.display = 'block';
            console.log("👹 Enemy image shown (battle mode)");
        }
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
    elements.playerGold.textContent = gameState.shared.gold;
    elements.nextLevelExp.textContent = gameState.player.level * 20;
    
    // 装備表示更新
    updateEquipmentDisplay();
    
    // 宿屋ボタンの状態更新
    updateInnButtonState();
    
    // ガチャボタンの状態更新
    updateGachaButtonState();
    
    // ダンジョン内UI制限の更新
    updateDungeonUIRestrictions();
    
    // セーブボタンの状態更新
    updateSaveButtonState();
    
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
        
        // 背景に応じたBGMを再生
        playLocationBGM(locationType);
    } else {
        console.warn(`Background not found for location type: ${locationType}`);
        // フォールバック背景を設定
        const timestamp = Date.now();
        backgroundElement.src = `./assets/images/backgrounds/town.png?v=${timestamp}`;
        backgroundElement.alt = '背景画像';
        
        // フォールバック時は街BGMを再生
        playLocationBGM('town');
    }
}

// 場所に応じたBGMを再生
function playLocationBGM(locationType) {
    if (!audioManager || !dataManager.loaded) return;
    
    let bgmId = null;
    
    switch(locationType) {
        case 'town':
        case 'inn':
        case 'item_shop':
        case 'gacha_shop':
            bgmId = 'bgm_town';
            break;
        case 'field':
        case 'plains':
            bgmId = 'bgm_field';
            break;
        case 'dungeon':
        case 'cave':
        case 'dark_forest':
            bgmId = 'bgm_dungeon';
            break;
    }
    
    if (bgmId) {
        console.log(`🎵 Playing BGM: ${bgmId} for location: ${locationType}`);
        audioManager.playBGM(bgmId);
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
    
    elements.equippedWeapon.textContent = weaponItem ? (weaponItem.name || weaponItem.item_name) : 'なし';
    elements.equippedShield.textContent = shieldItem ? (shieldItem.name || shieldItem.name || shieldItem.item_name) : 'なし';
    elements.equippedHead.textContent = headItem ? (headItem.name || headItem.item_name) : 'なし';
    elements.equippedBody.textContent = bodyItem ? (bodyItem.name || bodyItem.item_name) : 'なし';
}

// ダンジョン内かどうかの判定ヘルパー関数
function isInDungeon() {
    return gameState.battle.location === 'dungeon' && !gameState.battle.inTown;
}

// ダンジョン内UI制限の更新
function updateDungeonUIRestrictions() {
    const isDungeon = isInDungeon();
    
    // 各ボタンの無効化
    const guildBtn = document.getElementById('guildBtn');
    const shopBtn = document.getElementById('shopBtn');
    const innBtn = document.getElementById('innBtn');
    const tavernBtn = document.getElementById('tavernBtn');
    
    if (guildBtn) {
        guildBtn.title = isDungeon ? '街に戻るには「帰還の玉」が必要です' : '仲間との会話やクエスト情報を確認できます';
    }
    
    if (shopBtn) {
        shopBtn.title = isDungeon ? '街に戻るには「帰還の玉」が必要です' : 'アイテムの購入・売却・衣服の修理ができます';
    }
    
    if (innBtn) {
        innBtn.title = isDungeon ? '街に戻るには「帰還の玉」が必要です' : '100ゴールドでHP/MPを全回復します（フィールドからのみ利用可能）';
    }
    
    if (tavernBtn) {
        tavernBtn.title = isDungeon ? '街に戻るには「帰還の玉」が必要です' : 'ゴールドで仲間を雇ったり、キャラクターを切り替えることができます';
    }
    
    // ガチャボタンのツールチップ更新
    const gachaButtons = document.querySelectorAll('[onclick*="gacha"], [id*="gacha"], [class*="gacha"]');
    gachaButtons.forEach(btn => {
        if (isDungeon) {
            btn.title = '街に戻るには「帰還の玉」が必要です';
        }
    });
}

// セーブボタンの状態更新
function updateSaveButtonState() {
    const saveBtn = document.getElementById('saveBtn');
    if (!saveBtn) return;
    
    const inTown = gameState.battle.inTown;
    
    if (inTown) {
        saveBtn.disabled = false;
        saveBtn.classList.remove('disabled');
        saveBtn.title = '現在の進行状況を保存します';
    } else {
        saveBtn.disabled = true;
        saveBtn.classList.add('disabled');
        saveBtn.title = 'セーブは街でのみ利用できます';
    }
}

// 宿屋ボタンの状態更新
function updateInnButtonState() {
    const innBtn = document.getElementById('innBtn');
    if (!innBtn) return;
    
    const isInField = gameState.battle.location === 'field';
    const hasEnoughGold = gameState.shared.gold >= 100;
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
        const canUseEquipmentGacha = gameState.shared.gold >= 500;
        equipmentGachaBtn.disabled = !canUseEquipmentGacha;
        
        const btnText = equipmentGachaBtn.querySelector('.btn-text');
        if (btnText && !canUseEquipmentGacha) {
            btnText.textContent = '⚔️ 装備ガチャ（ゴールド不足）';
        } else if (btnText) {
            btnText.textContent = '⚔️ 装備ガチャ';
        }
    }
    
    if (illustrationGachaBtn) {
        const canUseIllustrationGacha = gameState.shared.gold >= 100;
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
    // 安全チェック：要素が存在するかと初期化済みかをチェック
    if (!elements.battleLogContent) {
        console.warn('⚠️ battleLogContent not found, skipping log:', message);
        return;
    }
    
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


// プレイヤーのスキル使用
function useSkill(skillName) {
    if (!gameState.battle.isPlayerTurn || gameState.battle.battleEnded) return;
    
    // CSVからスキルデータを取得
    const skill = dataManager.getSkill(skillName);
    if (!skill) {
        addBattleLog("不明なスキルです！");
        return;
    }
    
    // MP消費チェック
    if (skill.mp_cost > gameState.player.mp) {
        addBattleLog("MPが足りません！");
        return;
    }
    
    // MP消費
    gameState.player.mp -= skill.mp_cost;
    
    // スキル専用音声を再生
    if (skill.sound_effect) {
        audioManager.playSE(skill.sound_effect);
    }
    
    if (skill.type === 'attack') {
        // スキル専用アニメーションを表示
        if (skill.animation) {
            const enemyContainer = document.getElementById('enemyImage').parentElement;
            showSkillAnimation(skill.animation, enemyContainer);
        }
        
        const damage = dataManager.calculateSkillDamage(skill, gameState.player, gameState.enemy);
        gameState.enemy.hp = Math.max(0, gameState.enemy.hp - damage);
        
        let message = `${skill.name}！ ${gameState.enemy.name}に${damage}のダメージ！`;
        addBattleLog(message);
        
    } else if (skill.type === 'healing') {
        // スキル専用アニメーションを表示
        if (skill.animation) {
            const playerContainer = document.getElementById('playerMediaContainer');
            showSkillAnimation(skill.animation, playerContainer);
        }
        
        const healAmount = skill.base_power || 40;
        gameState.player.hp = Math.min(gameState.player.maxHp, gameState.player.hp + healAmount);
        addBattleLog(`${skill.name}！ HPを${healAmount}回復した！`);
        
        // プレイヤーメディアを更新
        updatePlayerMedia();
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
    
    const isEquipmentItem = itemInfo.effect_type?.startsWith('equip_') || itemInfo.equipment_type;
    
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
    if (!gameState.shared.inventory[itemId] || gameState.shared.inventory[itemId] <= 0) {
        addBattleLog("アイテムがありません！");
        return;
    }
    
    // 効果を適用
    let effectMessage = '';
    let isDamageItem = false;
    
    switch (itemInfo.effect_type) {
        case 'heal_hp':
            // 消費アイテム：使用前にインベントリから削除
            gameState.shared.inventory[itemId]--;
            const healAmount = itemInfo.effect_value;
            const actualHeal = Math.min(healAmount, gameState.player.maxHp - gameState.player.hp);
            gameState.player.hp += actualHeal;
            effectMessage = `HPを${actualHeal}回復した！`;
            // HP変更時にプレイヤーメディアを更新
            updatePlayerMedia();
            break;
            
        case 'heal_mp':
            // 消費アイテム：使用前にインベントリから削除
            gameState.shared.inventory[itemId]--;
            const mpRecover = itemInfo.effect_value;
            const actualMpRecover = Math.min(mpRecover, gameState.player.maxMp - gameState.player.mp);
            gameState.player.mp += actualMpRecover;
            effectMessage = `MPを${actualMpRecover}回復した！`;
            break;
            
        case 'damage_hp':
            // 消費アイテム：使用前にインベントリから削除
            gameState.shared.inventory[itemId]--;
            const damage = itemInfo.effect_value;
            gameState.enemy.hp = Math.max(0, gameState.enemy.hp - damage);
            effectMessage = `${gameState.enemy.name}に${damage}のダメージを与えた！`;
            isDamageItem = true;
            break;
            
        case 'boost_attack':
            // 消費アイテム：使用前にインベントリから削除
            gameState.shared.inventory[itemId]--;
            gameState.player.attack += itemInfo.effect_value;
            effectMessage = `攻撃力が${itemInfo.effect_value}上がった！`;
            break;
            
        case 'boost_defense':
            // 消費アイテム：使用前にインベントリから削除
            gameState.shared.inventory[itemId]--;
            gameState.player.defense += itemInfo.effect_value;
            effectMessage = `防御力が${itemInfo.effect_value}上がった！`;
            break;
            
        case 'boost_magic':
            // 消費アイテム：使用前にインベントリから削除
            gameState.shared.inventory[itemId]--;
            gameState.player.magic += itemInfo.effect_value;
            effectMessage = `魔力が${itemInfo.effect_value}上がった！`;
            break;
            
        case 'boost_speed':
            // 消費アイテム：使用前にインベントリから削除
            gameState.shared.inventory[itemId]--;
            gameState.player.speed += itemInfo.effect_value;
            effectMessage = `素早さが${itemInfo.effect_value}上がった！`;
            break;
            
        case 'boost_max_hp':
            // 消費アイテム：使用前にインベントリから削除
            gameState.shared.inventory[itemId]--;
            gameState.player.maxHp += itemInfo.effect_value;
            gameState.player.hp = Math.min(gameState.player.hp + itemInfo.effect_value, gameState.player.maxHp);
            effectMessage = `最大HPが${itemInfo.effect_value}上がった！`;
            // HP変更時にプレイヤーメディアを更新
            updatePlayerMedia();
            break;
            
        case 'boost_max_mp':
            // 消費アイテム：使用前にインベントリから削除
            gameState.shared.inventory[itemId]--;
            gameState.player.maxMp += itemInfo.effect_value;
            gameState.player.mp = Math.min(gameState.player.mp + itemInfo.effect_value, gameState.player.maxMp);
            effectMessage = `最大MPが${itemInfo.effect_value}上がった！`;
            break;
            
        case 'cure_poison':
            // 消費アイテム：使用前にインベントリから削除
            gameState.shared.inventory[itemId]--;
            // 状態異常システムが実装されたら対応
            effectMessage = '毒を治療した！';
            break;
            
        case 'cure_paralysis':
            // 消費アイテム：使用前にインベントリから削除
            gameState.shared.inventory[itemId]--;
            // 状態異常システムが実装されたら対応
            effectMessage = '麻痺を治療した！';
            break;
            
        case 'revival':
            // 消費アイテム：使用前にインベントリから削除
            gameState.shared.inventory[itemId]--;
            // 復活システムが実装されたら対応
            effectMessage = 'パワーを感じる...！';
            break;
            
        case 'equip_weapon':
            // 装備アイテム：装備後にインベントリから削除
            gameState.shared.inventory[itemId]--;
            if (equipItem('weapon', itemInfo)) {
                effectMessage = `${itemInfo.name}を装備した！`;
            } else {
                effectMessage = `${itemInfo.name}を装備できませんでした`;
                // 装備失敗時はアイテムをインベントリに戻す
                gameState.shared.inventory[itemId]++;
            }
            break;
            
        case 'equip_shield':
            // 装備アイテム：装備後にインベントリから削除
            gameState.shared.inventory[itemId]--;
            if (equipItem('shield', itemInfo)) {
                effectMessage = `${itemInfo.name}を装備した！`;
            } else {
                effectMessage = `${itemInfo.name}を装備できませんでした`;
                // 装備失敗時はアイテムをインベントリに戻す
                gameState.shared.inventory[itemId]++;
            }
            break;
            
        case 'equip_head':
            // 装備アイテム：装備後にインベントリから削除
            gameState.shared.inventory[itemId]--;
            if (equipItem('head', itemInfo)) {
                effectMessage = `${itemInfo.name}を装備した！`;
            } else {
                effectMessage = `${itemInfo.name}を装備できませんでした`;
                // 装備失敗時はアイテムをインベントリに戻す
                gameState.shared.inventory[itemId]++;
            }
            break;
            
        case 'equip_body':
            // 装備アイテム：装備後にインベントリから削除
            gameState.shared.inventory[itemId]--;
            if (equipItem('body', itemInfo)) {
                effectMessage = `${itemInfo.name}を装備した！`;
            } else {
                effectMessage = `${itemInfo.name}を装備できませんでした`;
                // 装備失敗時はアイテムをインベントリに戻す
                gameState.shared.inventory[itemId]++;
            }
            break;
            
        case 'return_town':
            // ダンジョン内でのみ使用可能
            if (gameState.battle.location !== 'dungeon') {
                effectMessage = 'ダンジョン内でのみ使用できます';
                return; // アイテムを消費しない
            }
            
            // 帰還の玉を消費
            gameState.shared.inventory[itemId]--;
            
            // 街に帰還
            gameState.battle.location = 'field';
            gameState.battle.inTown = true;
            gameState.battle.dungeonFloor = 1; // ダンジョン階層をリセット
            
            // 戦闘終了
            if (!gameState.battle.battleEnded) {
                gameState.battle.battleEnded = true;
                gameState.battle.isPlayerTurn = false;
                gameState.battle.autoMode = false;
            }
            
            // 背景を街に変更
            changeBackground('town');
            
            effectMessage = '街に帰還しました！';
            addBattleLog(effectMessage);
            
            // UI更新
            updateUI();
            updateItemDisplay();
            
            soundEffects.playHeal();
            return; // 以降の処理をスキップ
            
        default:
            // 装備品の場合（equipment_typeフィールドを持つ）
            if (itemInfo.equipment_type) {
                gameState.shared.inventory[itemId]--;
                let equipSlot = itemInfo.equipment_type;
                if (equipItem(equipSlot, itemInfo)) {
                    effectMessage = `${itemInfo.name}を装備した！`;
                } else {
                    effectMessage = `${itemInfo.name}を装備できませんでした`;
                    // 装備失敗時はアイテムをインベントリに戻す
                    gameState.shared.inventory[itemId]++;
                }
            } else {
                effectMessage = '効果を発揮した！';
            }
    }
    
    // 音響効果
    if (isDamageItem) {
        soundEffects.playAttack();
        screenShake(gameState.enemy.hp <= 0 ? 15 : 10);
    } else {
        soundEffects.playHeal();
    }
    
    addBattleLog(`${itemInfo.name}を使用！ ${effectMessage}`);
    
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
    
    // 統合装備データから装備アイテムを取得
    const equipmentItems = dataManager.getEquipmentItems();
    
    // 所持しているアイテムをカウント
    let hasItems = false;
    
    // インベントリの各アイテムを処理（所持数が0より大きいもののみ）
    Object.keys(gameState.shared.inventory).forEach(itemId => {
        const count = gameState.shared.inventory[itemId];
        
        // 所持数が0以下の場合は表示しない（ネタバレ防止）
        if (count <= 0) return;
        
        // ショップアイテムから検索
        let itemInfo = shopItems.find(item => item.id === itemId);
        
        // ショップアイテムにない場合は装備アイテムから検索
        if (!itemInfo) {
            const equipmentItem = equipmentItems.find(item => item.id === itemId);
            if (equipmentItem) {
                // 装備アイテムをショップアイテム形式に変換
                itemInfo = {
                    name: equipmentItem.name,
                    description: equipmentItem.description,
                    effect_type: `equip_${equipmentItem.equipment_type}`,
                    effect_value: equipmentItem.attack_bonus || equipmentItem.defense_bonus || equipmentItem.magic_bonus || equipmentItem.speed_bonus || equipmentItem.hp_bonus || equipmentItem.mp_bonus
                };
            }
        }
        
        if (itemInfo) {
            hasItems = true;
            
            const itemElement = document.createElement('button');
            itemElement.className = 'item-option';
            itemElement.dataset.item = itemId;
            
            // ステータス変化表示を生成
            let statusChangeText = '';
            if (itemInfo.effect_type && itemInfo.effect_value) {
                const effectValue = parseInt(itemInfo.effect_value) || 0;
                
                switch (itemInfo.effect_type) {
                    case 'heal_hp':
                        const maxHealable = gameState.player.maxHp - gameState.player.hp;
                        const actualHeal = Math.min(effectValue, maxHealable);
                        statusChangeText = `<div class="status-change">HP: ${gameState.player.hp} → ${gameState.player.hp + actualHeal}</div>`;
                        break;
                    case 'heal_mp':
                        const maxMpHealable = gameState.player.maxMp - gameState.player.mp;
                        const actualMpHeal = Math.min(effectValue, maxMpHealable);
                        statusChangeText = `<div class="status-change">MP: ${gameState.player.mp} → ${gameState.player.mp + actualMpHeal}</div>`;
                        break;
                    case 'boost_attack':
                        statusChangeText = `<div class="status-change">攻撃: ${gameState.player.attack} → ${gameState.player.attack + effectValue}</div>`;
                        break;
                    case 'boost_defense':
                        statusChangeText = `<div class="status-change">防御: ${gameState.player.defense} → ${gameState.player.defense + effectValue}</div>`;
                        break;
                    case 'boost_magic':
                        statusChangeText = `<div class="status-change">魔力: ${gameState.player.magic} → ${gameState.player.magic + effectValue}</div>`;
                        break;
                    case 'boost_speed':
                        statusChangeText = `<div class="status-change">素早さ: ${gameState.player.speed} → ${gameState.player.speed + effectValue}</div>`;
                        break;
                    case 'boost_max_hp':
                        statusChangeText = `<div class="status-change">最大HP: ${gameState.player.maxHp} → ${gameState.player.maxHp + effectValue}</div>`;
                        break;
                    case 'boost_max_mp':
                        statusChangeText = `<div class="status-change">最大MP: ${gameState.player.maxMp} → ${gameState.player.maxMp + effectValue}</div>`;
                        break;
                    case 'equip_weapon':
                        // 現在装備中の武器の効果値を取得
                        let currentWeaponBonus = 0;
                        const currentWeaponId = gameState.player.equipment.weapon;
                        if (currentWeaponId) {
                            // ショップアイテムから検索
                            let currentWeaponInfo = shopItems.find(item => item.id === currentWeaponId);
                            if (!currentWeaponInfo) {
                                // 装備アイテムから検索
                                const currentWeaponItem = equipmentItems.find(item => item.id === currentWeaponId);
                                if (currentWeaponItem) {
                                    currentWeaponBonus = parseInt(currentWeaponItem.attack_bonus) || 0;
                                }
                            } else {
                                currentWeaponBonus = parseInt(currentWeaponInfo.effect_value) || 0;
                            }
                        }
                        
                        // 新しい攻撃力 = 現在の攻撃力 - 現在の武器効果 + 新しい武器効果
                        const newAttackTotal = gameState.player.attack - currentWeaponBonus + effectValue;
                        statusChangeText = `<div class="status-change">攻撃: ${gameState.player.attack} → ${newAttackTotal}</div>`;
                        break;
                    case 'equip_shield':
                    case 'equip_head':
                    case 'equip_body':
                        // 装備箇所を特定
                        let equipSlot;
                        if (itemInfo.effect_type === 'equip_shield') equipSlot = 'shield';
                        else if (itemInfo.effect_type === 'equip_head') equipSlot = 'head';
                        else if (itemInfo.effect_type === 'equip_body') equipSlot = 'body';
                        
                        // 現在装備中のアイテムの効果値を取得
                        let currentEquipBonus = 0;
                        const currentEquipId = gameState.player.equipment[equipSlot];
                        if (currentEquipId) {
                            // ショップアイテムから検索
                            let currentEquipInfo = shopItems.find(item => item.id === currentEquipId);
                            if (!currentEquipInfo) {
                                // 装備アイテムから検索
                                const currentEquipItem = equipmentItems.find(item => item.id === currentEquipId);
                                if (currentEquipItem) {
                                    currentEquipBonus = parseInt(currentEquipItem.defense_bonus) || 0;
                                }
                            } else {
                                currentEquipBonus = parseInt(currentEquipInfo.effect_value) || 0;
                            }
                        }
                        
                        // ベース防御力を取得
                        const currentCharData = gameState.characterData[gameState.characters.currentCharacter];
                        const baseDefense = currentCharData ? currentCharData.baseStats.defense : 10;
                        
                        // 新しい防御力 = ベース防御力 + 他の防具の効果 + 新しい防具の効果
                        const newDefenseTotal = gameState.player.defense - currentEquipBonus + effectValue;
                        statusChangeText = `<div class="status-change">防御: ${gameState.player.defense} → ${newDefenseTotal}</div>`;
                        break;
                    case 'damage_hp':
                        if (gameState.enemy) {
                            const targetHp = Math.max(0, gameState.enemy.hp - effectValue);
                            statusChangeText = `<div class="status-change">敵HP: ${gameState.enemy.hp} → ${targetHp}</div>`;
                        }
                        break;
                }
            }
            
            itemElement.innerHTML = `
                <div class="item-name">${itemInfo.name}</div>
                <div class="item-count">所持数: ${count}</div>
                <div class="item-desc">${itemInfo.description}</div>
                ${statusChangeText}
            `;
            
            itemElement.addEventListener('click', () => {
                useItem(itemId);
                // 戦闘中の場合のみ自動でウィンドウを閉じる
                if (!gameState.battle.inTown) {
                    elements.itemModal.style.display = 'none';
                }
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
    if (gameState.battle.isAutoMode && !gameState.battle.storyInProgress) {
        setTimeout(() => {
            if (gameState.battle.isPlayerTurn && !gameState.battle.battleEnded && !gameState.battle.storyInProgress) {
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
        case 'attack':
            console.log('⚔️ 通常攻撃を実行');
            executeEnemyAttack();
            break;
            
        case 'skill':
            console.log('🪄 スキル行動を実行');
            if (action.skill_id) {
                const skill = dataManager.getSkill(action.skill_id);
                if (skill) {
                    executeEnemySkill(skill);
                } else {
                    console.log('⚠️ スキルが見つからないため通常攻撃に切り替え');
                    executeEnemyAttack();
                }
            } else {
                console.log('⚠️ スキルIDが無いため通常攻撃に切り替え');
                executeEnemyAttack();
            }
            break;
            
        case 'wait':
            console.log('😴 敵は様子見');
            addBattleLog(`${gameState.enemy.name}は様子を見ている...`);
            break;
            
        default:
            console.log('❓ 不明な行動タイプ、通常攻撃に切り替え');
            executeEnemyAttack();
    }
    
    if (gameState.player.hp <= 0) {
        handlePlayerDefeat();
    }
}

// 敵の通常攻撃処理（ダメージSE+シェイク付き）
function executeEnemyAttack() {
    console.log('👹 executeEnemyAttack関数が呼ばれました！');
    console.log('🎯 敵攻撃エフェクトを呼び出し中...');
    
    // 敵攻撃エフェクトを表示
    showEnemyAttackEffect();
    console.log('✅ showEnemyAttackEffect()の呼び出し完了');
    
    // 敵の種類に応じた攻撃SEを再生
    const enemyAttackSound = getEnemyAttackSound(gameState.enemy.id);
    audioManager.playSE(enemyAttackSound);
    
    const result = calculateDamage(gameState.enemy, gameState.player);
    gameState.player.hp = Math.max(0, gameState.player.hp - result.damage);
    
    // ダメージSE再生（少し遅延させて攻撃音と重ならないように）
    setTimeout(() => {
        audioManager.playSE('se_damage');
    }, 200);
    
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
        
        // 敵の拡大アニメーションを常に表示
        console.log('👹 敵のスキル攻撃アニメーションを実行！');
        showEnemyAttackEffect();
        
        // スキル専用アニメーションを表示（プレイヤーに向けて）
        if (skill.animation) {
            const playerContainer = document.getElementById('playerMediaContainer');
            showSkillAnimation(skill.animation, playerContainer);
        }
        
        // スキル専用音声を再生
        if (skill.sound_effect) {
            audioManager.playSE(skill.sound_effect);
        }
        
        const damage = dataManager.calculateSkillDamage(skill, gameState.enemy, gameState.player);
        gameState.player.hp = Math.max(0, gameState.player.hp - damage);
        
        // ダメージSE再生（遅延させて効果音と重ならないように）
        setTimeout(() => {
            audioManager.playSE('se_damage');
        }, 300);
        
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
        
        // 敵の拡大アニメーションを表示
        console.log('👹 敵の回復スキルアニメーションを実行！');
        showEnemyAttackEffect();
        
        // スキル専用アニメーションを表示（敵自身に向けて）
        if (skill.animation) {
            const enemyContainer = document.getElementById('enemyImage').parentElement;
            showSkillAnimation(skill.animation, enemyContainer);
        }
        
        // スキル専用音声を再生
        if (skill.sound_effect) {
            audioManager.playSE(skill.sound_effect);
        }
        
        const healAmount = skill.base_power || 50;
        gameState.enemy.hp = Math.min(gameState.enemy.maxHp, gameState.enemy.hp + healAmount);
        addBattleLog(`${gameState.enemy.name}の${skill.name}！ HPを${healAmount}回復した！`);
    } else {
        console.log('❓ 不明なスキルタイプ:', skill.type);
        
        // 不明なスキルタイプでも敵の拡大アニメーションを表示
        console.log('👹 敵の不明スキルアニメーションを実行！');
        showEnemyAttackEffect();
        
        // スキル専用音声を再生（ある場合）
        if (skill.sound_effect) {
            audioManager.playSE(skill.sound_effect);
        }
    }
}

// プレイヤー敗北処理
function handlePlayerDefeat() {
    addBattleLog("プレイヤーは倒れてしまった...");
    gameState.battle.battleEnded = true;
    
    // オートモードを強制解除してボタンも元に戻す
    if (gameState.battle.isAutoMode) {
        gameState.battle.isAutoMode = false;
        const autoBtn = document.getElementById('autoBtn');
        autoBtn.textContent = 'オート';
        autoBtn.style.backgroundColor = '#3498db';
    }
    
    // フィールド/ダンジョン対応の敗北ペナルティ
    applyDefeatPenalty();
    
    setTimeout(() => {
        showDefeatModal();
    }, 1500);
}

// 敗北モーダル表示
function showDefeatModal() {
    const lostGold = Math.floor(gameState.shared.gold * 0.5);
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
        gameState.shared.gold += gameState.enemy.gold_reward;
        addBattleLog(`${gameState.enemy.gold_reward}ゴールドを獲得！`);
    }
    
    // レベルアップチェック
    checkLevelUp();
    
    // 中ボス戦後の処理
    if (gameState.enemy.isMidBoss) {
        // 中ボス撃破メッセージ
        const midBossEvent = dataManager.getDungeonEvent(gameState.battle.chapter, gameState.battle.location, 'mid_boss', 'on_enter');
        if (midBossEvent && midBossEvent.victory_text) {
            addBattleLog(`🏆 ${midBossEvent.victory_text}`);
        }
        
        // 中ボス報酬処理
        if (midBossEvent && midBossEvent.rewards) {
            handleEventRewards(midBossEvent.rewards);
        }
        
        // 中ボス撃破後は会話イベントを発生
        if (midBossEvent && midBossEvent.story_id && storyTriggerManager) {
            addBattleLog('📖 ストーリーイベントが発生しました');
            gameState.battle.storyInProgress = true; // ストーリー開始
            gameState.battle.midBossDefeated = true; // 中ボス撃破フラグ
            setTimeout(() => {
                storyTriggerManager.triggerStory(midBossEvent.story_id);
            }, 1000);
        } else {
            // story_idがない場合は従来通り通常戦闘へ
            addBattleLog('中ボス撃破！ダンジョン探索を続行します...');
            setTimeout(() => {
                gameState.battle.battleCount++; 
                generateNewEnemy();
                gameState.battle.isPlayerTurn = true;
                updateUI();
            }, 2000);
        }
        return;
    }

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
                gameState.battle.storyInProgress = true; // ストーリー開始
                setTimeout(() => {
                    storyTriggerManager.triggerStory(trigger.story_id);
                }, 1000);
            }
        }
        
        const currentStage = dataManager.getStageInfo(gameState.battle.chapter);
        if (currentStage) {
            gameState.player.exp += parseInt(currentStage.reward_exp) || 0;
            gameState.shared.gold += parseInt(currentStage.reward_gold) || 0;
            addBattleLog(`ボーナス報酬：経験値${currentStage.reward_exp}、${currentStage.reward_gold}ゴールドを獲得！`);
            
            // ボーナス経験値後のレベルアップチェック
            checkLevelUp();
        }
        
        // ダンジョンボス撃破後は自動で街に帰還
        if (isInDungeon()) {
            addBattleLog('🏠 ダンジョンボス撃破！自動的に街へ帰還します...');
            setTimeout(() => {
                // 街に帰還
                gameState.battle.location = 'field';
                gameState.battle.inTown = true;
                gameState.battle.battleEnded = true;
                gameState.battle.dungeonFloor = 1; // ダンジョン階層をリセット
                gameState.enemy = null; // 敵をクリア
                
                // 背景を町に変更
                changeBackground('town');
                
                // 敵画像を非表示
                const enemyImage = document.getElementById('enemyImage');
                if (enemyImage) {
                    enemyImage.style.display = 'none';
                }
                
                // 敵情報オーバーレイを非表示
                const enemyInfoOverlay = document.querySelector('.enemy-info-overlay');
                if (enemyInfoOverlay) {
                    enemyInfoOverlay.style.display = 'none';
                }
                
                updateUI();
                addBattleLog('✅ 街に帰還しました。お疲れ様でした！');
                
                // 章クリアダイアログを表示
                setTimeout(() => {
                    showChapterClearDialog();
                }, 1000);
            }, 3000);
        } else {
            setTimeout(() => {
                showChapterClearDialog();
            }, 2000);
        }
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
    gameState.battle.battleEnded = false; // 戦闘状態をリセット
    addBattleLog(`${gameState.enemy.name}が現れた！`);
    updateUI();
    
    // オートモード継続処理（ストーリー進行中は除く）
    if (gameState.battle.isAutoMode && gameState.battle.isPlayerTurn && !gameState.battle.battleEnded && !gameState.battle.storyInProgress) {
        setTimeout(() => {
            autoPlayerAction();
        }, 2000); // エフェクトを考慮して少し長めに
    }
}

// 章クリア会話画面表示
function showChapterClearDialog() {
    gameState.battle.storyInProgress = true; // ダイアログ表示中
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
                    <p>所持ゴールド: ${gameState.shared.gold}G</p>
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
        console.log('⚠️ データ未読み込み、敵生成をスキップ');
        // データ未読み込み時は敵を作らない
        gameState.enemy = null;
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
    const location = gameState.battle.location || 'field'; // 現在の場所を取得
    console.log('📍 現在の場所:', location);
    const enemyData = dataManager.generateRandomEnemy(gameState.battle.chapter, location);
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
        
        // オートモードが有効で戦闘中なら自動攻撃を開始（ストーリー進行中は除く）
        if (gameState.battle.isAutoMode && gameState.battle.isPlayerTurn && !gameState.battle.battleEnded && !gameState.battle.storyInProgress) {
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
    
    // ストーリー進行中は敵を生成せず町状態にする
    if (gameState.battle.storyInProgress) {
        gameState.battle.inTown = true;
        gameState.enemy = null;
        console.log('📖 ストーリー進行中のため敵生成をスキップ');
    } else {
        // 新しい敵を生成
        generateNewEnemy();
        addBattleLog(`${gameState.enemy.name}が現れた！`);
    }
    
    gameState.battle.isPlayerTurn = true;
    elements.battleLogContent.innerHTML = '<div class="log-entry">戦闘が開始されました</div>';
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
    gameState.battle.storyInProgress = false; // ストーリー終了
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
    
    // 章開始時は町状態にして敵は生成しない
    gameState.battle.battleCount = 1;
    gameState.battle.battleEnded = true;
    gameState.battle.inTown = true;
    gameState.enemy = null;
    
    // 状態異常クリア
    gameState.player.statusEffects = {};
    
    // 町の背景に設定
    changeBackground('town');
    
    gameState.battle.isPlayerTurn = true;
    elements.battleLogContent.innerHTML = '<div class="log-entry">新章開始</div>';
    addBattleLog(`${gameState.battle.chapter}章が始まりました！`);
    addBattleLog('探索場所を選んで冒険を始めましょう！');
    updateUI();
    
    // 章開始時のストーリートリガーをチェック（無効化：ギルド訪問時に移動）
    /*
    setTimeout(() => {
        if (storyTriggerManager) {
            const trigger = storyTriggerManager.checkChapterStart(gameState.battle.chapter);
            if (trigger) {
                gameState.battle.storyInProgress = true; // ストーリー開始
                addBattleLog('📖 ストーリーイベントが発生しました');
                storyTriggerManager.triggerStory(trigger.story_id);
            }
        }
    }, 1000);
    */
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
        toggleAutoMode();
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
        if (isInDungeon()) {
            addBattleLog('⚠️ 街に戻るには「帰還の玉」が必要です');
            return;
        }
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

    // オプションモーダル関連イベント
    const closeOptionsModalBtn = document.getElementById('closeOptionsModal');
    if (closeOptionsModalBtn) {
        closeOptionsModalBtn.addEventListener('click', () => {
            soundEffects.playClick();
            closeOptionsModal();
        });
    }

    // BGM音量スライダー
    const bgmVolumeSlider = document.getElementById('bgmVolumeSlider');
    const bgmVolumeValue = document.getElementById('bgmVolumeValue');
    if (bgmVolumeSlider && bgmVolumeValue) {
        bgmVolumeSlider.addEventListener('input', (e) => {
            const volume = parseInt(e.target.value);
            bgmVolumeValue.textContent = volume + '%';
            if (audioManager && audioManager.setBGMVolume) {
                audioManager.setBGMVolume(volume / 100);
            }
        });
    }

    // SE音量スライダー
    const seVolumeSlider = document.getElementById('seVolumeSlider');
    const seVolumeValue = document.getElementById('seVolumeValue');
    if (seVolumeSlider && seVolumeValue) {
        seVolumeSlider.addEventListener('input', (e) => {
            const volume = parseInt(e.target.value);
            seVolumeValue.textContent = volume + '%';
            if (audioManager && audioManager.setSEVolume) {
                audioManager.setSEVolume(volume / 100);
            }
        });
    }

    // タイトルへ戻るボタン
    const returnToTitleBtn = document.getElementById('returnToTitleBtn');
    if (returnToTitleBtn) {
        returnToTitleBtn.addEventListener('click', () => {
            soundEffects.playClick();
            returnToTitle();
        });
    }
    
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
            if (isInDungeon()) {
                addBattleLog('⚠️ 街に戻るには「帰還の玉」が必要です');
                return;
            }
            stayAtInn();
        });
    }
    
    // 酒場ボタン
    const tavernBtn = document.getElementById('tavernBtn');
    if (tavernBtn) {
        tavernBtn.addEventListener('click', () => {
            soundEffects.playClick();
            if (isInDungeon()) {
                addBattleLog('⚠️ 街に戻るには「帰還の玉」が必要です');
                return;
            }
            openTavern();
        });
    }
    
    // 酒場モーダル閉じるボタン
    const closeTavernModal = document.getElementById('closeTavernModal');
    if (closeTavernModal) {
        closeTavernModal.addEventListener('click', () => {
            soundEffects.playClick();
            closeTavern();
        });
    }
    
    // 酒場タブ切り替え
    document.getElementById('purchaseTab')?.addEventListener('click', () => {
        soundEffects.playClick();
        switchTavernTab('purchase');
    });
    
    document.getElementById('switchTab')?.addEventListener('click', () => {
        soundEffects.playClick();
        switchTavernTab('switch');
    });
    
    // ガチャショップボタン
    const gachaShopBtn = document.getElementById('gachaShopBtn');
    if (gachaShopBtn) {
        gachaShopBtn.addEventListener('click', () => {
            soundEffects.playClick();
            if (isInDungeon()) {
                addBattleLog('⚠️ 街に戻るには「帰還の玉」が必要です');
                return;
            }
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
    
    // セーブボタンイベントリスナー
    const saveBtn = document.getElementById('saveBtn');
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            soundEffects.playClick();
            if (saveGameState()) {
                // セーブ成功時の処理（バトルログで通知済み）
            }
        });
    }
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
    elements.shopPlayerGold.textContent = gameState.shared.gold;
    
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
    for (const itemId in gameState.shared.inventory) {
        const count = gameState.shared.inventory[itemId];
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
                <div class="sell-item-name">${sellableItem.item.name}</div>
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
    if (!gameState.shared.inventory[itemId] || gameState.shared.inventory[itemId] <= 0) {
        addBattleLog('そのアイテムを持っていません');
        return;
    }
    
    // アイテムを1個減らす
    gameState.shared.inventory[itemId]--;
    
    // ゴールドを追加
    const sellPrice = parseInt(item.sell_price);
    gameState.shared.gold += sellPrice;
    
    // UI更新
    const shopPlayerGold = document.getElementById('shopPlayerGold');
    if (shopPlayerGold) {
        shopPlayerGold.textContent = gameState.shared.gold;
    }
    
    // 売却リストを再生成
    populateSellItems();
    updateUI();
    updateItemDisplay();
    
    addBattleLog(`${item.name}を${sellPrice}Gで売却しました！`);
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
    if (gameState.shared.gold < repairCost) {
        addBattleLog(`🔧 衣服の修理には${repairCost}Gが必要です`);
        soundEffects.playClick();
        return;
    }
    
    // 修理実行
    gameState.shared.gold -= repairCost;
    gameState.player.clothingState.damageLevel = 0;
    gameState.player.clothingState.isDamaged = false;
    gameState.player.clothingState.canRepair = false;
    
    // UI更新
    elements.shopPlayerGold.textContent = gameState.shared.gold;
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
    // 現在の章で購入可能なアイテムを取得
    const availableItems = dataManager.getAvailableShopItems(gameState.battle.chapter);
    elements.shopItemsList.innerHTML = '';
    
    if (availableItems.length === 0) {
        elements.shopItemsList.innerHTML = '<div class="shop-empty">この章では販売アイテムがありません</div>';
        return;
    }
    
    availableItems.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'shop-item';
        itemElement.innerHTML = `
            <div class="shop-item-info">
                <div class="shop-item-name">${item.name}</div>
                <div class="shop-item-desc">${item.description}</div>
            </div>
            <div class="shop-item-price">${item.buy_price}G</div>
        `;
        
        itemElement.addEventListener('click', () => {
            buyItem(item);
        });
        
        elements.shopItemsList.appendChild(itemElement);
    });
}

function buyItem(item) {
    // 所持金チェック
    const buyPrice = parseInt(item.buy_price);
    if (gameState.shared.gold < buyPrice) {
        addBattleLog(`${item.name}を購入するには${buyPrice}G必要です。`);
        soundEffects.playClick();
        return;
    }
    
    // アイテムを購入
    gameState.shared.gold -= buyPrice;
    
    // インベントリに追加
    console.log('🛒 購入前インベントリ:', gameState.shared.inventory[item.id]);
    if (gameState.shared.inventory[item.id]) {
        gameState.shared.inventory[item.id]++;
    } else {
        gameState.shared.inventory[item.id] = 1;
    }
    console.log('🛒 購入後インベントリ:', gameState.shared.inventory[item.id]);
    console.log('🛒 全インベントリ:', gameState.shared.inventory);
    console.log('🛒 インベントリタイプ:', typeof gameState.shared.inventory);
    console.log('🛒 インベントリキー:', Object.keys(gameState.shared.inventory));
    
    // UI更新
    elements.shopPlayerGold.textContent = gameState.shared.gold;
    updateUI();
    updateItemDisplay();
    
    addBattleLog(`${item.name}を購入しました！`);
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
        
        // オートモード時の処理分岐
        if (gameState.battle.isAutoMode && gameState.battle.autoLevelUpMode === 'random') {
            // ランダム割り振り
            autoAllocateStatPoints(3);
            addBattleLog('🎲 ステータスポイントを自動で割り振りました');
        } else {
            // レベルアップモーダルを表示（オートモードでも手動設定の場合は表示）
            // 戦闘を一時停止
            gameState.battle.isAutoMode = false; // オートモード一時停止
            gameState.battle.pausedForLevelUp = true; // レベルアップ中フラグ
            
            setTimeout(() => {
                showLevelUpModal();
            }, 1500);
        }
    }
}

// ステータスポイントをランダムに割り振り
function autoAllocateStatPoints(points) {
    const stats = ['hp', 'mp', 'attack', 'defense', 'magic', 'speed'];
    let remainingPoints = points;
    
    while (remainingPoints > 0) {
        const randomStat = stats[Math.floor(Math.random() * stats.length)];
        const pointsToAdd = Math.min(remainingPoints, Math.floor(Math.random() * 2) + 1); // 1-2ポイント
        
        switch (randomStat) {
            case 'hp':
                // 通常と同じ上昇値：+10
                gameState.player.maxHp += pointsToAdd * 10;
                gameState.player.hp = Math.min(gameState.player.hp + pointsToAdd * 10, gameState.player.maxHp);
                break;
            case 'mp':
                // 通常と同じ上昇値：+10
                gameState.player.maxMp += pointsToAdd * 10;
                gameState.player.mp = Math.min(gameState.player.mp + pointsToAdd * 10, gameState.player.maxMp);
                break;
            case 'attack':
                // 通常と同じ上昇値：+1
                gameState.player.attack += pointsToAdd * 1;
                break;
            case 'defense':
                // 通常と同じ上昇値：+1
                gameState.player.defense += pointsToAdd * 1;
                break;
            case 'magic':
                // 通常と同じ上昇値：+1
                gameState.player.magic += pointsToAdd * 1;
                break;
            case 'speed':
                // 通常と同じ上昇値：+1
                gameState.player.speed += pointsToAdd * 1;
                break;
        }
        
        remainingPoints -= pointsToAdd;
        gameState.player.statPoints -= pointsToAdd;
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
    
    // レベルアップ一時停止フラグを解除
    gameState.battle.pausedForLevelUp = false;
    
    // 元々オートモードで手動設定を選んでいた場合、オートモードを再開
    const autoBtn = document.getElementById('autoBtn');
    if (autoBtn && autoBtn.textContent === '手動') {
        gameState.battle.isAutoMode = true;
        
        // 戦闘が続いていればオートモードを再開
        if (gameState.battle.isPlayerTurn && !gameState.battle.battleEnded) {
            setTimeout(() => {
                autoPlayerAction();
            }, 1000);
        }
    }
    
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
// 武器タイプ制限チェック関数
function canEquipWeapon(characterClass, weaponType) {
    // 防具は全キャラクター共通で装備可能
    if (weaponType === 'none') {
        return true;
    }
    
    // キャラクタークラスと武器タイプの対応
    const classWeaponMap = {
        'warrior': 'sword',
        'martial_artist': 'fist', 
        'archer': 'bow',
        'mage': 'staff'
    };
    
    return classWeaponMap[characterClass] === weaponType;
}

// 装備エラーメッセージ表示関数
function showEquipmentError(message) {
    const errorElement = document.getElementById('equipmentError');
    const errorTextElement = document.getElementById('equipmentErrorText');
    
    if (errorElement && errorTextElement) {
        errorTextElement.textContent = message;
        errorElement.style.display = 'block';
        
        // 3秒後にエラーメッセージを隠す
        setTimeout(() => {
            errorElement.style.display = 'none';
        }, 3000);
    }
}

function equipItem(slot, item) {
    // ガチャ専用アイテムの定義
    const gachaItems = {
        'gacha-sword': { item_name: 'レアソード', item_id: 'gacha-sword', effect_value: 15, weapon_type: 'sword' },
        'gacha-shield': { item_name: 'レアシールド', item_id: 'gacha-shield', effect_value: 8, weapon_type: 'none' },
        'gacha-helmet': { item_name: 'レアヘルム', item_id: 'gacha-helmet', effect_value: 6, weapon_type: 'none' },
        'gacha-armor': { item_name: 'レアアーマー', item_id: 'gacha-armor', effect_value: 10, weapon_type: 'none' },
        'legendary-sword': { item_name: 'レジェンドソード', item_id: 'legendary-sword', effect_value: 25, weapon_type: 'sword' },
        'legendary-shield': { item_name: 'レジェンドシールド', item_id: 'legendary-shield', effect_value: 15, weapon_type: 'none' },
        'gacha-fists': { item_name: 'レアナックル', item_id: 'gacha-fists', effect_value: 12, weapon_type: 'fist' },
        'legendary-claws': { item_name: 'レジェンドクロー', item_id: 'legendary-claws', effect_value: 20, weapon_type: 'fist' },
        'gacha-bow': { item_name: 'レアボウ', item_id: 'gacha-bow', effect_value: 13, weapon_type: 'bow' },
        'legendary-bow': { item_name: 'レジェンドボウ', item_id: 'legendary-bow', effect_value: 22, weapon_type: 'bow' },
        'gacha-staff': { item_name: 'レアロッド', item_id: 'gacha-staff', effect_value: 5, weapon_type: 'staff' },
        'legendary-staff': { item_name: 'レジェンドスタッフ', item_id: 'legendary-staff', effect_value: 10, weapon_type: 'staff' }
    };

    // アイテムIDを確定（itemオブジェクトから取得、またはガチャアイテムの場合は直接指定）
    const itemId = item.id;
    
    // 武器タイプ制限チェック（武器スロットの場合のみ）
    if (slot === 'weapon') {
        let weaponType = item.weapon_type;
        
        // ガチャアイテムの場合はgachaItemsからweapon_typeを取得
        if (!weaponType && gachaItems[itemId]) {
            weaponType = gachaItems[itemId].weapon_type;
        }
        
        if (weaponType) {
            console.log(`🔍 装備チェック: プレイヤークラス=${gameState.player.character_class}, 武器タイプ=${weaponType}`);
            
            if (!canEquipWeapon(gameState.player.character_class, weaponType)) {
                // 武器タイプから専用クラスを取得
                const weaponToClassMap = {
                    'sword': 'warrior',
                    'fist': 'martial_artist',
                    'bow': 'archer',
                    'staff': 'mage'
                };
                const classNames = {
                    'warrior': '戦士',
                    'martial_artist': '武闘家',
                    'archer': '弓使い',
                    'mage': '魔法使い'
                };
                
                const requiredClass = weaponToClassMap[weaponType];
                const requiredClassName = classNames[requiredClass];
                
                console.log(`❌ 装備不可: ${gameState.player.character_class} は ${weaponType} を装備できません`);
                
                // アイテムウィンドウ上部にエラー表示
                showEquipmentError(`${requiredClassName}専用装備です`);
                return false;
            } else {
                console.log(`✅ 装備可能: ${gameState.player.character_class} は ${weaponType} を装備できます`);
            }
        }
    }
    
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
            if (gameState.shared.inventory[oldEquipment]) {
                gameState.shared.inventory[oldEquipment]++;
            } else {
                gameState.shared.inventory[oldEquipment] = 1;
            }
            addBattleLog(`${oldItem.name || oldItem.item_name}をインベントリに戻しました`);
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
                if (gameState.shared.inventory[oldShield]) {
                    gameState.shared.inventory[oldShield]++;
                } else {
                    gameState.shared.inventory[oldShield] = 1;
                }
                addBattleLog(`${shieldItem.name || shieldItem.item_name}をインベントリに戻しました（両手武器のため）`);
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
    // 装備品の各ボーナスを適用
    if (item.attack_bonus) {
        gameState.player.attack += parseInt(item.attack_bonus);
    }
    if (item.defense_bonus) {
        gameState.player.defense += parseInt(item.defense_bonus);
    }
    if (item.magic_bonus) {
        gameState.player.magic += parseInt(item.magic_bonus);
    }
    if (item.speed_bonus) {
        gameState.player.speed += parseInt(item.speed_bonus);
    }
    if (item.hp_bonus) {
        gameState.player.maxHp += parseInt(item.hp_bonus);
        gameState.player.hp += parseInt(item.hp_bonus); // 現在HPも回復
    }
    if (item.mp_bonus) {
        gameState.player.maxMp += parseInt(item.mp_bonus);
        gameState.player.mp += parseInt(item.mp_bonus); // 現在MPも回復
    }
}

function removeEquipmentEffect(item) {
    // 装備品の各ボーナスを削除
    if (item.attack_bonus) {
        gameState.player.attack -= parseInt(item.attack_bonus);
    }
    if (item.defense_bonus) {
        gameState.player.defense -= parseInt(item.defense_bonus);
    }
    if (item.magic_bonus) {
        gameState.player.magic -= parseInt(item.magic_bonus);
    }
    if (item.speed_bonus) {
        gameState.player.speed -= parseInt(item.speed_bonus);
    }
    if (item.hp_bonus) {
        gameState.player.maxHp -= parseInt(item.hp_bonus);
        // 現在HPが最大HPを超えないように調整
        gameState.player.hp = Math.min(gameState.player.hp, gameState.player.maxHp);
    }
    if (item.mp_bonus) {
        gameState.player.maxMp -= parseInt(item.mp_bonus);
        // 現在MPが最大MPを超えないように調整
        gameState.player.mp = Math.min(gameState.player.mp, gameState.player.maxMp);
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
    
    // ストーリーイベント進行中は移動禁止
    if (gameState.battle.storyInProgress) {
        addBattleLog('⚠️ ストーリーイベント進行中は移動できません');
        return;
    }
    
    // ダンジョンからフィールドへの移動を禁止
    if (isInDungeon() && location === 'field') {
        addBattleLog('⚠️ ダンジョンからフィールドには移動できません。街に戻るには「帰還の玉」が必要です');
        return;
    }
    
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
    
    // ダンジョン入場時の中ボスイベントをチェック
    if (location === 'dungeon' && dataManager.loaded) {
        const midBossEvent = dataManager.getDungeonEvent(gameState.battle.chapter, location, 'mid_boss', 'on_enter');
        if (midBossEvent) {
            setTimeout(() => {
                handleDungeonMidBossEvent(midBossEvent);
            }, 1000);
        }
    }
    
    // 戦闘をリセットして新しい敵を生成
    gameState.battle.battleCount = 1;
    gameState.battle.battleEnded = false;
    gameState.battle.inTown = false; // 探索場所を選んだので町を出る
    generateNewEnemy();
    updateUI();
}

// ダンジョン中ボスイベントを処理
function handleDungeonMidBossEvent(event) {
    console.log('🏰 中ボスイベント発生:', event);
    
    // イベントテキストを表示
    if (event.event_text) {
        addBattleLog(`📖 ${event.event_text}`);
    }
    
    // 中ボス戦闘前テキスト
    if (event.pre_battle_text) {
        addBattleLog(`💬 ${event.pre_battle_text}`);
    }
    
    // 中ボス敵を生成
    const midBossData = dataManager.getEnemy(event.mid_boss_enemy);
    if (midBossData) {
        gameState.enemy = {
            id: midBossData.id,
            name: midBossData.name + ' (中ボス)',
            hp: midBossData.hp,
            maxHp: midBossData.hp,
            attack: midBossData.attack,
            defense: midBossData.defense,
            magic: midBossData.magic || 0,
            speed: midBossData.speed,
            exp_reward: midBossData.exp_reward || 50,
            gold_reward: midBossData.gold_reward || 30,
            drop_rate: midBossData.drop_rate || 0,
            drop_item: midBossData.drop_item,
            image: midBossData.image || 'mid_boss.png',
            isMidBoss: true
        };
        
        addBattleLog(`⚔️ 中ボス「${gameState.enemy.name}」が現れた！`);
        
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
        
        updateUI();
    } else {
        console.error('中ボスデータが見つかりません:', event.mid_boss_enemy);
    }
}

// イベント報酬を処理
function handleEventRewards(rewardsString) {
    if (!rewardsString) return;
    
    const rewards = rewardsString.split(';');
    rewards.forEach(reward => {
        const [type, value] = reward.split(':');
        
        switch (type.trim()) {
            case 'experience':
                const exp = parseInt(value);
                gameState.player.exp += exp;
                addBattleLog(`🎯 ボーナス経験値${exp}を獲得！`);
                break;
                
            case 'gold':
                const gold = parseInt(value);
                gameState.shared.gold += gold;
                addBattleLog(`💰 ボーナスゴールド${gold}を獲得！`);
                break;
                
            case 'item':
                // アイテム追加処理（将来実装）
                addBattleLog(`📦 特別アイテム「${value}」を獲得！`);
                break;
                
            default:
                console.log('Unknown reward type:', type);
        }
    });
}

// 敗北時のペナルティ処理
function applyDefeatPenalty() {
    const goldLoss = Math.floor(gameState.shared.gold / 2);
    gameState.shared.gold -= goldLoss;
    
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
    if (gameState.shared.gold < innCost) {
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
    gameState.shared.gold -= innCost;
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

// 酒場システム
function openTavern() {
    if (!dataManager.loaded) {
        addBattleLog('キャラクターデータの読み込み中です...');
        return;
    }
    
    // 背景を酒場用に変更（town背景を使用）
    changeBackground('town');
    
    // 敵情報を隠す
    const enemyInfoOverlay = document.querySelector('.enemy-info-overlay');
    if (enemyInfoOverlay) {
        enemyInfoOverlay.style.display = 'none';
    }
    
    // プレイヤーの所持金を表示
    elements.tavernPlayerGold.textContent = gameState.shared.gold;
    
    // 利用可能なキャラクターを表示
    populateAvailableCharacters();
    
    // 酒場モーダルを表示
    elements.tavernModal.style.display = 'flex';
}

function closeTavern() {
    elements.tavernModal.style.display = 'none';
    
    // 背景を町に戻す
    changeBackground('town');
    
    // 酒場利用後は町の状態にする（敵は出ない）
    gameState.battle.battleCount = 1;
    gameState.battle.battleEnded = true;
    gameState.battle.inTown = true;
    
    // 敵を非表示にする
    const enemyImage = document.getElementById('enemyImage');
    if (enemyImage) {
        enemyImage.style.display = 'none';
    }
    
    updateUI();
    addBattleLog('酒場を出ました。探索場所を選んでください。');
}

function populateAvailableCharacters() {
    const availableCharactersList = document.getElementById('availableCharactersList');
    availableCharactersList.innerHTML = '';
    
    // 購入可能なキャラクターを取得
    console.log('🍺 DEBUG: dataManager loaded?', dataManager.loaded);
    console.log('🍺 DEBUG: dataManager.data?', dataManager.data);
    console.log('🍺 All characters:', dataManager.data.characters);
    console.log('🍺 Purchased characters:', gameState.characters.purchasedCharacters);
    
    if (!dataManager.data.characters) {
        console.error('❌ Characters data not loaded!');
        availableCharactersList.innerHTML = '<div class="tavern-empty">データ読み込み中...</div>';
        return;
    }
    
    const characters = dataManager.data.characters.filter(char => {
        const typeCheck = char.type === 'player';
        const purchasableCheck = (char.is_purchasable === 'true' || char.is_purchasable === 'TRUE');
        const alreadyOwnedCheck = !gameState.characters.purchasedCharacters.includes(char.id);
        
        console.log(`🍺 ${char.name}: type=${char.type}(${typeCheck}), purchasable=${char.is_purchasable}(${purchasableCheck}), notOwned=${alreadyOwnedCheck}`);
        
        return typeCheck && purchasableCheck && alreadyOwnedCheck;
    });
    
    console.log('🍺 Available characters:', characters);
    
    if (characters.length === 0) {
        availableCharactersList.innerHTML = '<div class="tavern-empty">購入可能なキャラクターがいません</div>';
        return;
    }
    
    characters.forEach(character => {
        const characterElement = document.createElement('div');
        characterElement.className = 'character-item';
        characterElement.innerHTML = `
            <div class="character-portrait">
                <img src="./assets/images/characters/${character.portrait}" alt="${character.name}" 
                     onerror="this.style.backgroundColor='#4299e1'; this.innerHTML='<div class=\\'placeholder-text\\'>${character.name}</div>'">
            </div>
            <div class="character-info">
                <div class="character-name">${character.name}</div>
                <div class="character-desc">${character.description}</div>
                <div class="character-stats">
                    <div class="stat">HP: ${character.base_hp}</div>
                    <div class="stat">MP: ${character.base_mp}</div>
                    <div class="stat">攻撃: ${character.base_attack}</div>
                    <div class="stat">防御: ${character.base_defense}</div>
                    <div class="stat">魔力: ${character.base_magic}</div>
                    <div class="stat">素早: ${character.base_speed}</div>
                </div>
            </div>
            <div class="character-price">${character.purchase_price}G</div>
        `;
        
        characterElement.addEventListener('click', () => {
            purchaseCharacter(character);
        });
        
        availableCharactersList.appendChild(characterElement);
    });
}

function purchaseCharacter(character) {
    const price = parseInt(character.purchase_price);
    
    // 所持金チェック
    if (gameState.shared.gold < price) {
        addBattleLog(`${character.name}を雇うには${price}Gが必要です`);
        soundEffects.playClick();
        return;
    }
    
    // 既に購入済みかチェック
    if (gameState.characters.purchasedCharacters.includes(character.id)) {
        addBattleLog(`${character.name}は既に仲間になっています`);
        return;
    }
    
    // キャラクターを購入
    gameState.shared.gold -= price;
    gameState.characters.purchasedCharacters.push(character.id);
    
    // 新しいキャラクターのデータを初期化
    CharacterManager.initializeNewCharacter(character.id, character);
    
    // UI更新
    elements.tavernPlayerGold.textContent = gameState.shared.gold;
    updateUI();
    
    // 購入可能リストを再生成
    populateAvailableCharacters();
    
    addBattleLog(`🎉 ${character.name}が仲間になりました！`);
    addBattleLog(`💰 ${price}ゴールドを支払いました`);
    soundEffects.playClick();
}

// 酒場タブ切り替え
function switchTavernTab(tab) {
    const purchaseTab = document.getElementById('purchaseTab');
    const switchTab = document.getElementById('switchTab');
    const availableCharactersList = document.getElementById('availableCharactersList');
    const ownedCharactersList = document.getElementById('ownedCharactersList');
    
    if (tab === 'purchase') {
        purchaseTab.classList.add('active');
        switchTab.classList.remove('active');
        availableCharactersList.style.display = 'block';
        ownedCharactersList.style.display = 'none';
        populateAvailableCharacters();
    } else if (tab === 'switch') {
        purchaseTab.classList.remove('active');
        switchTab.classList.add('active');
        availableCharactersList.style.display = 'none';
        ownedCharactersList.style.display = 'block';
        populateOwnedCharacters();
    }
}

// 所有キャラクター一覧を表示
function populateOwnedCharacters() {
    const ownedCharactersList = document.getElementById('ownedCharactersList');
    ownedCharactersList.innerHTML = '';
    
    // 所有しているキャラクターを取得
    const ownedCharacters = gameState.characters.purchasedCharacters.map(characterId => 
        dataManager.data.characters.find(char => char.id === characterId && char.type === 'player')
    ).filter(char => char); // undefinedを除外
    
    if (ownedCharacters.length === 0) {
        ownedCharactersList.innerHTML = '<div class="tavern-empty">キャラクターを所有していません</div>';
        return;
    }
    
    ownedCharacters.forEach(character => {
        const isCurrentCharacter = character.id === gameState.characters.currentCharacter;
        const characterElement = document.createElement('div');
        characterElement.className = `owned-character-item ${isCurrentCharacter ? 'current' : ''}`;
        characterElement.innerHTML = `
            <div class="character-portrait">
                <img src="./assets/images/characters/${character.portrait}" alt="${character.name}" 
                     onerror="this.style.backgroundColor='#4299e1'; this.innerHTML='<div class=\\'placeholder-text\\'>${character.name}</div>'">
            </div>
            <div class="character-info">
                <div class="character-name">${character.name} ${isCurrentCharacter ? '(使用中)' : ''}</div>
                <div class="character-desc">${character.description}</div>
                <div class="character-stats">
                    <div class="stat">HP: ${character.base_hp}</div>
                    <div class="stat">MP: ${character.base_mp}</div>
                    <div class="stat">攻撃: ${character.base_attack}</div>
                    <div class="stat">防御: ${character.base_defense}</div>
                    <div class="stat">魔力: ${character.base_magic}</div>
                    <div class="stat">素早: ${character.base_speed}</div>
                </div>
            </div>
            ${!isCurrentCharacter ? '<div class="switch-btn">切り替え</div>' : '<div class="current-indicator">現在使用中</div>'}
        `;
        
        if (!isCurrentCharacter) {
            characterElement.addEventListener('click', () => {
                switchToCharacter(character.id);
            });
        }
        
        ownedCharactersList.appendChild(characterElement);
    });
}

// キャラクターを切り替え
function switchToCharacter(characterId) {
    const character = dataManager.data.characters.find(char => char.id === characterId);
    if (!character) return;
    
    // 現在のキャラクターデータを保存
    CharacterManager.saveCurrentCharacter();
    
    // 現在のキャラクターを変更
    gameState.characters.currentCharacter = characterId;
    
    // 新しいキャラクターのデータを読み込み
    CharacterManager.loadCharacter(characterId);
    
    // プレイヤーメディアを更新
    updatePlayerMedia();
    
    // UI更新
    updateUI();
    
    // 所有キャラクターリストを再生成
    populateOwnedCharacters();
    
    addBattleLog(`💫 ${character.name}に切り替えました！`);
    soundEffects.playClick();
}

// 装備ガチャ
function drawEquipmentGacha(count = 1) {
    const singleCost = 500;
    const totalCost = count === 10 ? 4500 : singleCost * count; // 10連は500G割引
    
    if (gameState.shared.gold < totalCost) {
        addBattleLog(`❌ 装備ガチャの料金${totalCost}Gが不足しています`);
        return;
    }
    
    gameState.shared.gold -= totalCost;
    
    // 所持金更新
    const gachaPlayerGold = document.getElementById('gachaPlayerGold');
    if (gachaPlayerGold) {
        gachaPlayerGold.textContent = gameState.shared.gold;
    }
    
    addBattleLog(`🎰 装備ガチャを${count}回回しました！`);
    
    // ガチャ結果を保存する配列
    const gachaResults = [];
    
    for (let i = 0; i < count; i++) {
        const random = Math.random();
        
        if (random < 0.5) {
            // 50%：装備をランダム取得
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
            
            // アイテムをインベントリに追加
            if (gameState.shared.inventory[result.id] === undefined) {
                gameState.shared.inventory[result.id] = 0;
            }
            gameState.shared.inventory[result.id]++;
            
        } else if (random < 0.7) {
            // 20%：帰還の玉
            addBattleLog(`🔮 帰還の玉を獲得しました！`);
            gachaResults.push({ name: '帰還の玉', type: 'special' });
            
            // 帰還の玉をインベントリに追加
            if (gameState.shared.inventory.return_orb === undefined) {
                gameState.shared.inventory.return_orb = 0;
            }
            gameState.shared.inventory.return_orb++;
            
        } else {
            // 30%：ハズレ（ポーション）
            const potionCount = Math.floor(Math.random() * 3) + 1;
            gameState.shared.inventory.potion += potionCount;
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
    
    // 現在使用中のキャラクターのデータを取得
    const currentCharacterId = gameState.characters?.currentCharacter || 'player';
    const playerData = dataManager.getCharacter(currentCharacterId);
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
    
    // HP パーセンテージを計算
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
    
    if (gameState.shared.gold < totalCost) {
        addBattleLog(`❌ イラストガチャの料金${totalCost}Gが不足しています`);
        return;
    }
    
    gameState.shared.gold -= totalCost;
    
    // 所持金更新
    const gachaPlayerGold = document.getElementById('gachaPlayerGold');
    if (gachaPlayerGold) {
        gachaPlayerGold.textContent = gameState.shared.gold;
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
    const optionsModal = document.getElementById('optionsModal');
    if (optionsModal) {
        optionsModal.style.display = 'flex';
        
        // 現在の音量設定を反映
        updateVolumeSliders();
    }
}

function closeOptionsModal() {
    const optionsModal = document.getElementById('optionsModal');
    if (optionsModal) {
        optionsModal.style.display = 'none';
    }
}

function updateVolumeSliders() {
    // BGM音量スライダーを更新
    const bgmSlider = document.getElementById('bgmVolumeSlider');
    const bgmValue = document.getElementById('bgmVolumeValue');
    if (bgmSlider && bgmValue && audioManager.bgmVolume !== undefined) {
        const volume = Math.round(audioManager.bgmVolume * 100);
        bgmSlider.value = volume;
        bgmValue.textContent = volume + '%';
    }
    
    // SE音量スライダーを更新
    const seSlider = document.getElementById('seVolumeSlider');
    const seValue = document.getElementById('seVolumeValue');
    if (seSlider && seValue && audioManager.seVolume !== undefined) {
        const volume = Math.round(audioManager.seVolume * 100);
        seSlider.value = volume;
        seValue.textContent = volume + '%';
    }
}

// ゲーム風確認モーダル表示関数
function showGameConfirm(title, message, onYes, onNo = null) {
    const modal = document.getElementById('gameConfirmModal');
    const titleElement = document.getElementById('gameConfirmTitle');
    const messageElement = document.getElementById('gameConfirmMessage');
    const yesButton = document.getElementById('gameConfirmYes');
    const noButton = document.getElementById('gameConfirmNo');
    
    // 内容を設定
    titleElement.textContent = title;
    messageElement.textContent = message;
    
    // 既存のイベントリスナーを削除
    yesButton.replaceWith(yesButton.cloneNode(true));
    noButton.replaceWith(noButton.cloneNode(true));
    
    // 新しい要素を取得
    const newYesButton = document.getElementById('gameConfirmYes');
    const newNoButton = document.getElementById('gameConfirmNo');
    
    // イベントリスナーを追加
    newYesButton.addEventListener('click', () => {
        soundEffects.playClick();
        modal.style.display = 'none';
        if (onYes) onYes();
    });
    
    newNoButton.addEventListener('click', () => {
        soundEffects.playClick();
        modal.style.display = 'none';
        if (onNo) onNo();
    });
    
    // モーダル外クリックで閉じる
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
            if (onNo) onNo();
        }
    });
    
    // モーダルを表示
    modal.style.display = 'flex';
}

function returnToTitle() {
    showGameConfirm(
        '🏠 タイトルへ戻る',
        'タイトル画面に戻りますか？',
        () => {
            // title.htmlにリダイレクト
            window.location.href = 'title.html';
        }
    );
}

// セーブ機能
function saveGameState() {
    // 街にいる時のみセーブ可能
    if (!gameState.battle.inTown) {
        addBattleLog('❌ セーブは街でのみ利用できます');
        return false;
    }
    
    // 現在のキャラクターデータを保存
    CharacterManager.saveCurrentCharacter();
    
    const saveData = {
        version: "0.9.1",
        timestamp: new Date().toISOString(),
        player: {
            name: gameState.player.name,
            character_class: gameState.player.character_class,
            level: gameState.player.level,
            hp: gameState.player.hp,
            maxHp: gameState.player.maxHp,
            mp: gameState.player.mp,
            maxMp: gameState.player.maxMp,
            attack: gameState.player.attack,
            defense: gameState.player.defense,
            magic: gameState.player.magic,
            speed: gameState.player.speed,
            exp: gameState.player.exp,
            statPoints: gameState.player.statPoints,
            equipment: {...gameState.player.equipment},
            clothingState: {...gameState.player.clothingState}
        },
        shared: {
            gold: gameState.shared.gold,
            inventory: {...gameState.shared.inventory}
        },
        battle: {
            chapter: gameState.battle.chapter,
            battleCount: gameState.battle.battleCount,
            maxBattles: gameState.battle.maxBattles,
            location: gameState.battle.location,
            guildFirstVisits: {...gameState.battle.guildFirstVisits}
        },
        characters: {
            currentCharacter: gameState.characters.currentCharacter,
            purchasedCharacters: [...gameState.characters.purchasedCharacters],
            characterData: JSON.parse(JSON.stringify(gameState.characterData))
        }
    };
    
    try {
        localStorage.setItem('fallenHeroSave', JSON.stringify(saveData));
        addBattleLog('✅ ゲームデータを保存しました');
        console.log('💾 Game saved:', saveData);
        return true;
    } catch (error) {
        addBattleLog('❌ セーブに失敗しました');
        console.error('Save failed:', error);
        return false;
    }
}

// ロード機能
function loadGameState() {
    try {
        const saveDataString = localStorage.getItem('fallenHeroSave');
        if (!saveDataString) {
            console.warn('No save data found');
            return false;
        }
        
        const saveData = JSON.parse(saveDataString);
        console.log('📁 Loading game data:', saveData);
        
        // プレイヤーデータを復元
        gameState.player.name = saveData.player.name;
        gameState.player.character_class = saveData.player.character_class;
        gameState.player.level = saveData.player.level;
        gameState.player.hp = saveData.player.hp;
        gameState.player.maxHp = saveData.player.maxHp;
        gameState.player.mp = saveData.player.mp;
        gameState.player.maxMp = saveData.player.maxMp;
        gameState.player.attack = saveData.player.attack;
        gameState.player.defense = saveData.player.defense;
        gameState.player.magic = saveData.player.magic;
        gameState.player.speed = saveData.player.speed;
        gameState.player.exp = saveData.player.exp;
        gameState.player.statPoints = saveData.player.statPoints;
        gameState.player.equipment = {...saveData.player.equipment};
        gameState.player.clothingState = {...saveData.player.clothingState};
        
        // 共有データを復元
        gameState.shared.gold = saveData.shared.gold;
        gameState.shared.inventory = {...saveData.shared.inventory};
        
        // 戦闘データを復元
        gameState.battle.chapter = saveData.battle.chapter;
        gameState.battle.battleCount = saveData.battle.battleCount;
        gameState.battle.maxBattles = saveData.battle.maxBattles;
        gameState.battle.location = saveData.battle.location;
        gameState.battle.guildFirstVisits = saveData.battle.guildFirstVisits || {}; // ギルド訪問履歴を復元
        gameState.battle.inTown = true; // ロード後は町状態
        gameState.battle.battleEnded = true;
        
        // キャラクターデータを復元
        gameState.characters.currentCharacter = saveData.characters.currentCharacter;
        gameState.characters.purchasedCharacters = [...saveData.characters.purchasedCharacters];
        gameState.characterData = JSON.parse(JSON.stringify(saveData.characters.characterData));
        
        // UI更新
        updateUI();
        updatePlayerMedia();
        
        console.log('✅ Game loaded successfully');
        return true;
    } catch (error) {
        console.error('Load failed:', error);
        return false;
    }
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
        gachaPlayerGold.textContent = gameState.shared.gold;
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
    
    // URLパラメータでロードが指定されているかチェック
    const urlParams = new URLSearchParams(window.location.search);
    const shouldLoad = urlParams.get('load') === 'true';
    
    if (shouldLoad) {
        console.log("📁 ロードモードでゲーム開始");
        addBattleLog("セーブデータを読み込み中...");
    }
    
    // CSV データ読み込み
    addBattleLog("ゲームデータを読み込み中...");
    console.log("🔄 Loading game data...");
    const loadSuccess = await dataManager.loadAllData();
    
    if (loadSuccess) {
        gameState.dataLoaded = true;
        addBattleLog("データ読み込み完了！");
        console.log("✅ Game data loaded successfully");
        console.log("📦 Items loaded:", dataManager.data.items?.length || 0);
        console.log("⚔️ Equipment loaded:", dataManager.data.equipment?.length || 0);
        console.log("📋 初期インベントリ:", gameState.shared.inventory);
        console.log("📋 インベントリキー:", Object.keys(gameState.shared.inventory));
        
        // セーブデータロード処理
        if (shouldLoad) {
            const loadResult = loadGameState();
            if (loadResult) {
                addBattleLog("✅ セーブデータを読み込みました");
                console.log("📁 セーブデータ読み込み成功");
            } else {
                addBattleLog("❌ セーブデータの読み込みに失敗しました");
                console.error("📁 セーブデータ読み込み失敗 - 初期データで開始");
                // 失敗時は通常の初期化を実行
                const playerData = dataManager.getCharacter('player');
                if (playerData) {
                    gameState.player.name = playerData.name;
                    gameState.player.character_class = playerData.character_class;
                    gameState.player.hp = playerData.base_hp;
                    gameState.player.maxHp = playerData.base_hp;
                    gameState.player.mp = playerData.base_mp;
                    gameState.player.maxMp = playerData.base_mp;
                    gameState.player.attack = playerData.base_attack;
                    gameState.player.defense = playerData.base_defense;
                    gameState.player.magic = playerData.base_magic;
                    gameState.player.speed = playerData.base_speed;
                }
            }
        } else {
            // 新規ゲーム - CSV駆動でプレイヤーデータを初期化
            const playerData = dataManager.getCharacter('player');
            if (playerData) {
                console.log("Player data loaded:", playerData);
                console.log(`🎭 キャラクタークラス設定: ${playerData.character_class}`);
                gameState.player.name = playerData.name;
                gameState.player.character_class = playerData.character_class;
                gameState.player.hp = playerData.base_hp;
                gameState.player.maxHp = playerData.base_hp;
                gameState.player.mp = playerData.base_mp;
                gameState.player.maxMp = playerData.base_mp;
                gameState.player.attack = playerData.base_attack;
                gameState.player.defense = playerData.base_defense;
                gameState.player.magic = playerData.base_magic;
                gameState.player.speed = playerData.base_speed;
                console.log(`🎭 gameState.player.character_class = ${gameState.player.character_class}`);
            }
        }
        
        // プレイヤーメディア（画像/動画）を更新
        console.log("🎬 Updating player media...");
        updatePlayerMedia();
        
        // 音声システムを初期化
        console.log("🎵 Initializing audio system...");
        audioManager.initialize();
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
    gameState.enemy = null; // 初期化時は確実に敵を削除
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
    
    // 敵画像（戦闘中のみリロード）
    if (gameState.enemy && gameState.enemy.image && !gameState.battle.inTown) {
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
    console.log('👹👹👹 敵攻撃エフェクト実行！ 👹👹👹');
    console.log('🔧 現在のDOM状態をチェック中...');
    console.log('🌐 document.readyState:', document.readyState);
    console.log('🖼️ 全ての画像要素:', document.querySelectorAll('img'));
    console.log('🎥 全ての動画要素:', document.querySelectorAll('video'));
    console.log('🏷️ enemy-imageクラスの要素:', document.querySelectorAll('.enemy-image'));
    
    // 複数の方法で敵要素を取得（より包括的に）
    let enemyElement = document.getElementById('enemyImage');
    console.log('🔍 getElementById(enemyImage):', enemyElement);
    
    // 敵要素が見つからない場合、他の方法で検索
    if (!enemyElement) {
        enemyElement = document.querySelector('.enemy-image');
        console.log('🔍 enemy-imageクラスで検索:', enemyElement);
    }
    
    if (!enemyElement) {
        enemyElement = document.querySelector('img[id="enemyImage"]');
        console.log('🔍 img[id="enemyImage"]で検索:', enemyElement);
    }
    
    if (!enemyElement) {
        enemyElement = document.querySelector('video[id*="enemy"]');
        console.log('🔍 敵ビデオ要素で検索:', enemyElement);
    }
    
    if (!enemyElement) {
        // elementsオブジェクトから取得を試す
        if (typeof elements !== 'undefined' && elements.enemyImage) {
            enemyElement = elements.enemyImage;
            console.log('🔍 elementsオブジェクトから取得:', enemyElement);
        }
    }
    
    if (enemyElement) {
        console.log('✅✅✅ 敵要素が見つかりました！ ✅✅✅');
        console.log('🔍 敵要素タイプ:', enemyElement.tagName, '| クラス:', enemyElement.className, '| ID:', enemyElement.id);
        console.log('🔍 敵要素の現在のスタイル:', enemyElement.style.cssText);
        console.log('🔍 敵要素の位置とサイズ:', enemyElement.getBoundingClientRect());
        
        // 元のスタイルを保存
        const originalTransform = enemyElement.style.transform || 'scale(1)';
        const originalFilter = enemyElement.style.filter || 'brightness(1)';
        const originalTransition = enemyElement.style.transition || '';
        
        console.log('💾 元のスタイルを保存:', { originalTransform, originalFilter, originalTransition });
        
        // JavaScriptで直接アニメーション適用
        console.log('🎨 アニメーションスタイルを適用中...');
        enemyElement.style.transition = 'all 0.4s ease-in-out';
        enemyElement.style.transform = 'scale(1.25)';
        enemyElement.style.filter = 'brightness(1.5) drop-shadow(0 0 15px #ff0000)';
        enemyElement.style.zIndex = '10';
        
        console.log('✅ 直接アニメーションを適用しました');
        console.log('🔍 適用後のスタイル:', enemyElement.style.cssText);
        
        // 画面全体の赤いフラッシュエフェクト
        const flashOverlay = document.createElement('div');
        flashOverlay.style.position = 'fixed';
        flashOverlay.style.top = '0';
        flashOverlay.style.left = '0';
        flashOverlay.style.width = '100%';
        flashOverlay.style.height = '100%';
        flashOverlay.style.backgroundColor = 'rgba(255, 0, 0, 0.3)';
        flashOverlay.style.pointerEvents = 'none';
        flashOverlay.style.zIndex = '9999';
        flashOverlay.style.animation = 'flash-damage 0.3s ease-out forwards';
        document.body.appendChild(flashOverlay);
        
        // 中間段階のアニメーション（より目立たせる）
        setTimeout(() => {
            console.log('🔥 中間段階のアニメーション適用中...');
            enemyElement.style.transform = 'scale(1.3)';
            enemyElement.style.filter = 'brightness(1.8) drop-shadow(0 0 20px #ff0000)';
            console.log('🔥 中間段階適用後のスタイル:', enemyElement.style.cssText);
        }, 100);
        
        // エフェクト削除と元の状態に戻す
        setTimeout(() => {
            console.log('🔄 アニメーションを元に戻し中...');
            enemyElement.style.transform = originalTransform;
            enemyElement.style.filter = originalFilter;
            enemyElement.style.transition = originalTransition;
            enemyElement.style.zIndex = '';
            
            if (flashOverlay.parentNode) {
                flashOverlay.parentNode.removeChild(flashOverlay);
                console.log('✅ フラッシュオーバーレイを削除しました');
            }
            console.log('✅✅✅ アニメーションを元に戻しました ✅✅✅');
            console.log('🔍 元に戻した後のスタイル:', enemyElement.style.cssText);
        }, 400);
    } else {
        console.error('❌❌❌ 敵要素が見つかりません！ ❌❌❌');
        console.error('🔍 すべての検索方法で敵要素が見つかりませんでした：');
        console.error('  - document.getElementById("enemyImage")');
        console.error('  - document.querySelector(".enemy-image")');
        console.error('  - document.querySelector("img[id=\\"enemyImage\\"]")');
        console.error('  - document.querySelector("video[id*=\\"enemy\\"]")');
        console.error('  - elements.enemyImage (if available)');
        console.error('🌐 現在のDOM全体:', document.body);
    }
}

// 音声管理システム
class AudioManager {
    constructor() {
        this.currentBGM = null;
        this.audioCache = new Map();
        this.bgmVolume = 0.5;
        this.seVolume = 0.8;
        this.isMuted = false;
    }

    // 音声ファイルをプリロード
    preloadAudio(audioData) {
        if (this.audioCache.has(audioData.id)) {
            return this.audioCache.get(audioData.id);
        }

        const audio = new Audio();
        audio.src = audioData.file_path;
        audio.volume = parseFloat(audioData.volume) || 0.5;
        audio.loop = audioData.loop === 'TRUE';
        
        // キャッシュに保存
        this.audioCache.set(audioData.id, audio);
        
        return audio;
    }

    // SEを再生
    playSE(audioId) {
        if (this.isMuted) return;
        
        const audioData = dataManager.getAudio(audioId);
        if (!audioData || audioData.type !== 'se') return;

        const audio = this.preloadAudio(audioData);
        audio.volume = (parseFloat(audioData.volume) || 0.5) * this.seVolume;
        
        // SEは複数回再生できるようにクローン
        const seClone = audio.cloneNode();
        seClone.volume = audio.volume;
        seClone.play().catch(e => console.log('SE playback failed:', e));
    }

    // BGMを再生
    playBGM(audioId) {
        if (this.isMuted) return;
        
        const audioData = dataManager.getAudio(audioId);
        if (!audioData || audioData.type !== 'bgm') return;

        // 現在のBGMを停止
        if (this.currentBGM) {
            this.currentBGM.pause();
            this.currentBGM.currentTime = 0;
        }

        const audio = this.preloadAudio(audioData);
        audio.volume = (parseFloat(audioData.volume) || 0.5) * this.bgmVolume;
        this.currentBGM = audio;
        
        audio.play().catch(e => console.log('BGM playback failed:', e));
    }

    // BGMを停止
    stopBGM() {
        if (this.currentBGM) {
            this.currentBGM.pause();
            this.currentBGM.currentTime = 0;
            this.currentBGM = null;
        }
    }

    // 音声の初期化（ユーザーインタラクション後に実行）
    initialize() {
        // データ読み込み完了後に主要音声をプリロード
        if (dataManager.loaded) {
            const audioList = dataManager.data.audio;
            audioList.forEach(audioData => {
                // 頻繁に使用される音声をプリロード
                if (['se_attack', 'se_damage', 'se_button_click'].includes(audioData.id)) {
                    this.preloadAudio(audioData);
                }
            });
        }
    }

    // BGM音量設定
    setBGMVolume(volume) {
        this.bgmVolume = Math.max(0, Math.min(1, volume)); // 0-1の範囲に制限
        
        // 現在再生中のBGMの音量も更新
        if (this.currentBGM) {
            const audioId = Array.from(this.audioCache.entries())
                .find(([id, audio]) => audio === this.currentBGM)?.[0];
            if (audioId) {
                const audioData = dataManager.getAudio(audioId);
                if (audioData) {
                    this.currentBGM.volume = (parseFloat(audioData.volume) || 0.5) * this.bgmVolume;
                }
            }
        }
    }
    
    // SE音量設定
    setSEVolume(volume) {
        this.seVolume = Math.max(0, Math.min(1, volume)); // 0-1の範囲に制限
    }

    // ミュート切り替え
    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.isMuted && this.currentBGM) {
            this.currentBGM.pause();
        } else if (!this.isMuted && this.currentBGM) {
            this.currentBGM.play().catch(e => console.log('BGM resume failed:', e));
        }
    }
}

// グローバルインスタンス
const audioManager = new AudioManager();

// 敵のタイプ別攻撃音取得
function getEnemyAttackSound(enemyId) {
    // 敵のタイプに応じて攻撃音を返す
    switch(enemyId) {
        case 'goblin':
        case 'orc':
            return 'se_claw_slash';
        case 'wolf':
        case 'dire_wolf':
            return 'se_bite_attack';
        case 'dragon':
        case 'wyvern':
            return 'se_wing_flap';
        case 'spider':
        case 'poison_spider':
            return 'se_poison_spit';
        case 'skeleton':
        case 'undead':
            return 'se_enemy_attack';
        default:
            return 'se_enemy_attack'; // デフォルト攻撃音
    }
}

// スキルアニメーション表示システム
function showSkillAnimation(animationType, targetElement) {
    if (!animationType || !targetElement) return;
    
    // アニメーションエレメントを作成
    const animationDiv = document.createElement('div');
    animationDiv.className = `skill-animation ${animationType}`;
    animationDiv.style.position = 'absolute';
    animationDiv.style.top = '0';
    animationDiv.style.left = '0';
    animationDiv.style.width = '100%';
    animationDiv.style.height = '100%';
    animationDiv.style.pointerEvents = 'none';
    animationDiv.style.zIndex = '1000';
    
    // ターゲット要素に追加
    targetElement.style.position = 'relative';
    targetElement.appendChild(animationDiv);
    
    // アニメーションのタイプ別処理
    switch(animationType) {
        case 'fire_burst':
            createFireBurstEffect(animationDiv);
            break;
        case 'heal_light':
            createHealLightEffect(animationDiv);
            break;
        case 'ice_projectile':
            createIceProjectileEffect(animationDiv);
            break;
        case 'lightning_strike':
            createLightningStrikeEffect(animationDiv);
            break;
        case 'attack_slash':
            createAttackSlashEffect(animationDiv);
            break;
        default:
            createGenericMagicEffect(animationDiv);
    }
    
    // アニメーション終了後に削除
    setTimeout(() => {
        if (animationDiv.parentNode) {
            animationDiv.parentNode.removeChild(animationDiv);
        }
    }, 1500);
}

// ファイアボールアニメーション
function createFireBurstEffect(container) {
    // 炎のパーティクルを複数作成
    for (let i = 0; i < 8; i++) {
        const flame = document.createElement('div');
        flame.style.position = 'absolute';
        flame.style.width = '20px';
        flame.style.height = '20px';
        flame.style.background = 'radial-gradient(circle, #ff4500, #ff8c00, #ffa500)';
        flame.style.borderRadius = '50%';
        flame.style.left = '50%';
        flame.style.top = '50%';
        flame.style.transform = 'translate(-50%, -50%)';
        flame.style.animation = `fire-burst-${i} 1s ease-out forwards`;
        container.appendChild(flame);
    }
    
    // 中央の大きな爆発エフェクト
    const burst = document.createElement('div');
    burst.style.position = 'absolute';
    burst.style.width = '60px';
    burst.style.height = '60px';
    burst.style.background = 'radial-gradient(circle, #ff0000, #ff4500, transparent)';
    burst.style.borderRadius = '50%';
    burst.style.left = '50%';
    burst.style.top = '50%';
    burst.style.transform = 'translate(-50%, -50%)';
    burst.style.animation = 'fire-burst-main 0.8s ease-out forwards';
    container.appendChild(burst);
}

// 回復光アニメーション
function createHealLightEffect(container) {
    const light = document.createElement('div');
    light.style.position = 'absolute';
    light.style.width = '100%';
    light.style.height = '100%';
    light.style.background = 'radial-gradient(circle, rgba(0, 255, 0, 0.6), rgba(255, 255, 255, 0.3), transparent)';
    light.style.borderRadius = '50%';
    light.style.animation = 'heal-pulse 1.2s ease-in-out forwards';
    container.appendChild(light);
    
    // キラキラエフェクト
    for (let i = 0; i < 6; i++) {
        const sparkle = document.createElement('div');
        sparkle.style.position = 'absolute';
        sparkle.style.width = '8px';
        sparkle.style.height = '8px';
        sparkle.style.background = '#ffffff';
        sparkle.style.borderRadius = '50%';
        sparkle.style.left = Math.random() * 100 + '%';
        sparkle.style.top = Math.random() * 100 + '%';
        sparkle.style.animation = 'sparkle 1s ease-in-out forwards';
        sparkle.style.animationDelay = (i * 0.1) + 's';
        container.appendChild(sparkle);
    }
}

// 攻撃スラッシュエフェクト
function createAttackSlashEffect(container) {
    const slash = document.createElement('div');
    slash.style.position = 'absolute';
    slash.style.width = '100px';
    slash.style.height = '4px';
    slash.style.background = 'linear-gradient(90deg, transparent, #ffffff, #ffff00, transparent)';
    slash.style.left = '10%';
    slash.style.top = '50%';
    slash.style.transformOrigin = '0 50%';
    slash.style.animation = 'attack-slash 0.6s ease-out forwards';
    container.appendChild(slash);
    
    // 追加の斬撃エフェクト
    const slash2 = document.createElement('div');
    slash2.style.position = 'absolute';
    slash2.style.width = '80px';
    slash2.style.height = '3px';
    slash2.style.background = 'linear-gradient(90deg, transparent, #ffffff, transparent)';
    slash2.style.left = '20%';
    slash2.style.top = '40%';
    slash2.style.transformOrigin = '0 50%';
    slash2.style.animation = 'attack-slash 0.6s ease-out forwards';
    slash2.style.animationDelay = '0.1s';
    container.appendChild(slash2);
}

// アイスプロジェクタイルエフェクト
function createIceProjectileEffect(container) {
    const ice = document.createElement('div');
    ice.style.position = 'absolute';
    ice.style.width = '40px';
    ice.style.height = '40px';
    ice.style.background = 'radial-gradient(circle, #87ceeb, #4682b4, #1e90ff)';
    ice.style.borderRadius = '30% 70% 70% 30%';
    ice.style.left = '50%';
    ice.style.top = '50%';
    ice.style.transform = 'translate(-50%, -50%)';
    ice.style.animation = 'ice-projectile 1s ease-out forwards';
    container.appendChild(ice);
    
    // 氷の破片エフェクト
    for (let i = 0; i < 5; i++) {
        const shard = document.createElement('div');
        shard.style.position = 'absolute';
        shard.style.width = '8px';
        shard.style.height = '8px';
        shard.style.background = '#87ceeb';
        shard.style.left = '50%';
        shard.style.top = '50%';
        shard.style.transform = 'translate(-50%, -50%)';
        shard.style.animation = `ice-shard-${i} 0.8s ease-out forwards`;
        shard.style.animationDelay = '0.5s';
        container.appendChild(shard);
    }
}

// 雷撃エフェクト
function createLightningStrikeEffect(container) {
    const lightning = document.createElement('div');
    lightning.style.position = 'absolute';
    lightning.style.width = '6px';
    lightning.style.height = '100%';
    lightning.style.background = 'linear-gradient(180deg, #ffffff, #ffff00, #ffffff)';
    lightning.style.left = '50%';
    lightning.style.top = '0';
    lightning.style.transform = 'translateX(-50%)';
    lightning.style.boxShadow = '0 0 20px #ffff00';
    lightning.style.animation = 'lightning-strike 0.4s ease-in-out forwards';
    container.appendChild(lightning);
    
    // 電撃の枝分かれ
    for (let i = 0; i < 3; i++) {
        const branch = document.createElement('div');
        branch.style.position = 'absolute';
        branch.style.width = '3px';
        branch.style.height = '40px';
        branch.style.background = '#ffff00';
        branch.style.left = (45 + i * 5) + '%';
        branch.style.top = (20 + i * 20) + '%';
        branch.style.transform = 'rotate(' + (Math.random() * 60 - 30) + 'deg)';
        branch.style.animation = 'lightning-branch 0.3s ease-out forwards';
        branch.style.animationDelay = '0.1s';
        container.appendChild(branch);
    }
}

// 汎用魔法エフェクト
function createGenericMagicEffect(container) {
    const magic = document.createElement('div');
    magic.style.position = 'absolute';
    magic.style.width = '80px';
    magic.style.height = '80px';
    magic.style.background = 'radial-gradient(circle, rgba(138, 43, 226, 0.8), rgba(75, 0, 130, 0.6), transparent)';
    magic.style.borderRadius = '50%';
    magic.style.left = '50%';
    magic.style.top = '50%';
    magic.style.transform = 'translate(-50%, -50%)';
    magic.style.animation = 'magic-pulse 1s ease-in-out forwards';
    container.appendChild(magic);
}

// ギルド会話システム
function showConversationChoice(choice) {
    const conversationLog = document.getElementById('conversationLog');
    const choices = document.getElementById('conversationChoices');
    
    let message = '';
    let newChoices = '';
    
    switch(choice) {
        case 'quest':
            message = '「現在利用可能な依頼は特にない。冒険を続けて経験を積むのだ。」';
            newChoices = `
                <button class="choice-btn" onclick="showConversationChoice('back')">他のことを聞く</button>
                <button class="choice-btn" onclick="closeModal('guildModal')">立ち去る</button>
            `;
            break;
        case 'party':
            message = '「パーティを組むのは良いことだ。仲間がいれば困難な冒険も乗り越えられる。酒場で冒険者を探してみるといい。」';
            newChoices = `
                <button class="choice-btn" onclick="showConversationChoice('back')">他のことを聞く</button>
                <button class="choice-btn" onclick="closeModal('guildModal')">立ち去る</button>
            `;
            break;
        case 'info':
            message = '「この世界には多くの危険が潜んでいる。装備を整え、レベルを上げて強くなることだ。宿屋で休息を取ることも忘れるな。」';
            newChoices = `
                <button class="choice-btn" onclick="showConversationChoice('back')">他のことを聞く</button>
                <button class="choice-btn" onclick="closeModal('guildModal')">立ち去る</button>
            `;
            break;
        case 'back':
            message = '「他に何か聞きたいことはあるか？」';
            newChoices = `
                <button class="choice-btn" onclick="showConversationChoice('quest')">依頼について聞く</button>
                <button class="choice-btn" onclick="showConversationChoice('party')">パーティについて聞く</button>
                <button class="choice-btn" onclick="showConversationChoice('info')">情報を聞く</button>
                <button class="choice-btn" onclick="closeModal('guildModal')">立ち去る</button>
            `;
            break;
    }
    
    // 新しいメッセージを追加
    if (message) {
        const messageElement = document.createElement('p');
        messageElement.className = 'guild-message';
        messageElement.textContent = message;
        conversationLog.appendChild(messageElement);
        
        // スクロールを最下部に移動
        conversationLog.scrollTop = conversationLog.scrollHeight;
    }
    
    // 選択肢を更新
    choices.innerHTML = newChoices;
}

// ギルドボタンのイベントリスナーを追加
function initGuild() {
    const guildBtn = document.getElementById('guildBtn');
    const closeGuildModal = document.getElementById('closeGuildModal');
    
    if (guildBtn) {
        guildBtn.addEventListener('click', () => {
            if (isInDungeon()) {
                addBattleLog('⚠️ 街に戻るには「帰還の玉」が必要です');
                return;
            }
            
            // ギルド初回訪問チェック
            const currentChapter = gameState.battle.chapter;
            const visitKey = `chapter_${currentChapter}`;
            
            if (!gameState.battle.guildFirstVisits[visitKey]) {
                // 初回訪問の場合、フラグをセットしてストーリーイベントを発生
                gameState.battle.guildFirstVisits[visitKey] = true;
                console.log(`First guild visit in chapter ${currentChapter}`);
                
                // ストーリーイベントをチェック
                if (storyTriggerManager) {
                    console.log(`🔍 ギルド初回訪問: chapter ${currentChapter} のストーリーチェック開始`);
                    const trigger = storyTriggerManager.checkChapterStart(currentChapter);
                    console.log('📋 取得したトリガー:', trigger);
                    
                    if (trigger) {
                        addBattleLog('📖 ギルドでのストーリーイベントが発生しました');
                        console.log(`🎭 ストーリー開始: ${trigger.story_id}`);
                        // ストーリーイベントを発生（フラグ設定なし、ギルド開封後に実行）
                        setTimeout(() => {
                            storyTriggerManager.triggerStory(trigger.story_id);
                        }, 500);
                    } else {
                        console.warn(`⚠️ chapter ${currentChapter} に対応するストーリートリガーが見つかりません`);
                        addBattleLog(`⚠️ 章${currentChapter}のストーリーが見つかりません（デバッグ情報）`);
                    }
                } else {
                    console.error('❌ storyTriggerManager が見つかりません');
                }
            }
            
            openModal('guildModal');
        });
    }
    
    if (closeGuildModal) {
        closeGuildModal.addEventListener('click', () => {
            closeModal('guildModal');
        });
    }
}

// オートモード設定関数群
function toggleAutoMode() {
    const autoBtn = document.getElementById('autoBtn');
    
    if (gameState.battle.isAutoMode) {
        // オートモードを停止
        gameState.battle.isAutoMode = false;
        autoBtn.textContent = 'オート';
        autoBtn.style.backgroundColor = '#3498db';
        addBattleLog('👤 手動モードに切り替えました');
        soundEffects.playClick();
        
        // UIを即座に更新してプレイヤーが操作できるようにする
        updateUI();
    } else {
        // オートモード設定を開く
        elements.autoModeSettingsModal.style.display = 'block';
        soundEffects.playClick();
    }
}

function closeAutoSettingsModal() {
    elements.autoModeSettingsModal.style.display = 'none';
    soundEffects.playClick();
}

function startAutoModeWithSettings() {
    // 設定を取得
    const levelUpMode = document.querySelector('input[name="autoLevelUp"]:checked').value;
    gameState.battle.autoLevelUpMode = levelUpMode;
    
    // オートモードを開始
    gameState.battle.isAutoMode = true;
    
    const autoBtn = document.getElementById('autoBtn');
    autoBtn.textContent = '手動';
    autoBtn.style.backgroundColor = '#e74c3c';
    
    // 設定に応じたメッセージを表示
    if (levelUpMode === 'manual') {
        addBattleLog('🤖 オートモード開始（レベルアップ時は手動設定）');
    } else {
        addBattleLog('🤖 オートモード開始（レベルアップ時は自動割り振り）');
    }
    
    // モーダルを閉じる
    closeAutoSettingsModal();
    
    // オートモードの場合、すぐに次のアクションを実行
    if (gameState.battle.isPlayerTurn && !gameState.battle.battleEnded) {
        setTimeout(() => {
            if (gameState.battle.isAutoMode) {
                autoPlayerAction();
            }
        }, 1000);
    }
}

// プレイヤー攻撃関数
function playerAttack() {
    console.log('⚔️ playerAttack called, dataManager.loaded:', dataManager?.loaded);
    if (!gameState.battle.isPlayerTurn || gameState.battle.battleEnded) return;
    
    // 攻撃エフェクトと音響効果
    audioManager.playSE('se_attack'); // CSVの攻撃SEを再生
    showPlayerAttackEffect();
    screenShake(10);
    
    // 基本攻撃の処理（クリティカル判定込み）
    const result = calculateDamage(gameState.player, gameState.enemy);
    gameState.enemy.hp = Math.max(0, gameState.enemy.hp - result.damage);
    
    let message = `${gameState.player.name}の攻撃！ ${gameState.enemy.name}に${result.damage}のダメージ！`;
    if (result.critical) {
        message += " クリティカルヒット！";
    }
    addBattleLog(message);
    
    // 敵撃破チェック
    if (gameState.enemy.hp <= 0) {
        addBattleLog(`${gameState.enemy.name}を倒した！`);
        gameState.battle.battleEnded = true;
        
        // 次の戦闘への移行（オートモードは nextBattle 内で管理）
        setTimeout(nextBattle, 1500);
        return;
    }
    
    // ターン終了
    gameState.battle.isPlayerTurn = false;
    updateUI();
    
    // 敵のターンへ移行
    setTimeout(() => {
        processEnemyTurn();
    }, 1000);
}

// 敵のターン処理
function processEnemyTurn() {
    // レベルアップ中や戦闘終了時は敵もアクションしない
    if (gameState.battle.battleEnded || gameState.battle.pausedForLevelUp) return;
    
    // 敵の攻撃をエフェクト込みで実行
    executeEnemyAttack();
    
    // プレイヤー敗北チェック
    if (gameState.player.hp <= 0) {
        gameState.battle.isAutoMode = false; // オートモード強制解除
        handlePlayerDefeat(); // 敗北処理を実行
        return;
    }
    
    // プレイヤーのターンに戻す
    gameState.battle.isPlayerTurn = true;
    updateUI();
    
    // レベルアップ中・ストーリー進行中でなければオートモード継続チェック
    if (gameState.battle.isAutoMode && !gameState.battle.pausedForLevelUp && !gameState.battle.storyInProgress) {
        setTimeout(() => {
            autoPlayerAction();
        }, 1000);
    }
}

// オートモード時のプレイヤーアクション
function autoPlayerAction() {
    // レベルアップ中や戦闘終了時、ストーリー進行中はアクションしない
    if (!gameState.battle.isAutoMode || 
        !gameState.battle.isPlayerTurn || 
        gameState.battle.battleEnded || 
        gameState.battle.pausedForLevelUp ||
        gameState.battle.storyInProgress) {
        return;
    }
    
    // 基本的に攻撃を選択
    playerAttack();
}

// デバッグ用：ストーリーイベントフラグを手動でリセットする関数
window.resetStoryFlag = function() {
    if (gameState && gameState.battle) {
        gameState.battle.storyInProgress = false;
        console.log('✅ ストーリーイベントフラグをリセットしました');
        addBattleLog('🔧 デバッグ：ストーリーフラグをリセットしました');
        return true;
    }
    console.log('❌ gameStateが見つかりません');
    return false;
};

document.addEventListener('DOMContentLoaded', () => {
    initGame();
    initGuild();
});
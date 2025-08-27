// CSV データ管理システム
class DataManager {
    constructor() {
        this.data = {
            characters: [],
            enemies: [],
            enemyActions: [],
            skills: [],
            items: [],
            equipment: [],
            stages: [],
            shop: [],
            locations: [],
            backgrounds: [],
            audio: []
        };
        this.loaded = false;
    }

    // CSVファイルを読み込み、パースする（キャッシュ回避版）
    async loadCSV(filePath) {
        try {
            // キャッシュ回避のためにタイムスタンプを追加
            const cacheBreaker = `?v=${Date.now()}`;
            const response = await fetch(filePath + cacheBreaker);
            if (!response.ok) {
                throw new Error(`Failed to load ${filePath}: ${response.status}`);
            }
            const csvText = await response.text();
            return this.parseCSV(csvText);
        } catch (error) {
            console.error(`Error loading CSV file ${filePath}:`, error);
            return [];
        }
    }

    // CSV文字列をパースしてオブジェクト配列に変換
    parseCSV(csvText) {
        const lines = csvText.trim().split('\n');
        if (lines.length === 0) return [];

        // ヘッダー行を取得（ダブルクォートを除去）
        const headers = lines[0].split(',').map(header => 
            header.replace(/^"(.*)"$/, '$1').trim()
        );

        const result = [];
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line === '') continue;

            const values = this.parseCSVLine(line);
            const obj = {};
            
            headers.forEach((header, index) => {
                let value = values[index] || '';
                // 数値変換を試行
                if (!isNaN(value) && value !== '') {
                    obj[header] = Number(value);
                } else {
                    obj[header] = value;
                }
            });
            
            result.push(obj);
        }
        
        return result;
    }

    // CSV行をパースしてフィールド配列に分割
    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            const nextChar = line[i + 1];
            
            if (char === '"') {
                if (inQuotes && nextChar === '"') {
                    // エスケープされたダブルクォート
                    current += '"';
                    i++; // 次の文字をスキップ
                } else {
                    // クォートの開始/終了
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                // フィールド区切り
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        
        // 最後のフィールドを追加
        result.push(current);
        return result;
    }

    // 全CSVデータを読み込み
    async loadAllData() {
        try {
            const loadPromises = [
                this.loadCSV('./data/characters.csv'),
                this.loadCSV('./data/enemies.csv'),
                this.loadCSV('./data/enemy_actions.csv'),
                this.loadCSV('./data/skills.csv'),
                this.loadCSV('./data/items_unified.csv'),
                this.loadCSV('./data/equipment_unified.csv'),
                this.loadCSV('./data/stages.csv'),
                this.loadCSV('./data/locations.csv'),
                this.loadCSV('./data/backgrounds.csv'),
                this.loadCSV('./data/audio.csv'),
                this.loadCSV('./data/title_settings.csv')
            ];

            const results = await Promise.all(loadPromises);
            
            this.data.characters = results[0];
            this.data.enemies = results[1];
            this.data.enemyActions = results[2];
            this.data.skills = results[3];
            this.data.items = results[4];
            this.data.equipment = results[5];
            this.data.stages = results[6];
            this.data.locations = results[7];
            this.data.backgrounds = results[8];
            this.data.audio = results[9];
            this.data.titleSettings = results[10];

            this.loaded = true;
            console.log('All CSV data loaded successfully');
            console.log('Backgrounds loaded:', this.data.backgrounds);
            
            // 保留中の背景変更があれば実行
            if (this.pendingBackgroundChange) {
                console.log(`Executing pending background change: ${this.pendingBackgroundChange}`);
                // changeBackground関数を呼び出す（グローバルスコープから）
                if (typeof changeBackground === 'function') {
                    changeBackground(this.pendingBackgroundChange);
                }
                this.pendingBackgroundChange = null;
            }
            
            return true;
        } catch (error) {
            console.error('Failed to load CSV data:', error);
            console.error('Error details:', error.message);
            return false;
        }
    }

    // データを強制再読み込み（キャッシュクリア）
    async reloadAllData() {
        console.log('Reloading all CSV data (cache cleared)...');
        this.loaded = false;
        return await this.loadAllData();
    }

    // キャラクターデータを取得
    getCharacter(id) {
        return this.data.characters.find(char => char.id === id);
    }

    // 敵データを取得
    getEnemy(id) {
        return this.data.enemies.find(enemy => enemy.id === id);
    }

    // 章の敵プールを取得
    getChapterEnemies(chapter) {
        const stage = this.data.stages.find(s => parseInt(s.chapter) === parseInt(chapter));
        if (!stage || !stage.enemy_pool) {
            // フォールバック：該当章の敵を直接検索
            return this.data.enemies.filter(enemy => parseInt(enemy.chapter) === parseInt(chapter));
        }
        
        const enemyIds = stage.enemy_pool.split(',').map(id => id.trim());
        return enemyIds.map(id => this.getEnemy(id)).filter(enemy => enemy);
    }

    getBossEnemy(chapter) {
        const stage = this.data.stages.find(s => parseInt(s.chapter) === parseInt(chapter));
        if (stage && stage.boss_enemy) {
            return this.getEnemy(stage.boss_enemy);
        }
        return null;
    }
    
    getChapterMaxBattles(chapter) {
        const stage = this.data.stages.find(s => parseInt(s.chapter) === parseInt(chapter));
        return stage ? parseInt(stage.max_battles) : 10;
    }
    
    getStageInfo(chapter) {
        return this.data.stages.find(s => parseInt(s.chapter) === parseInt(chapter));
    }

    // 敵の行動パターンを取得
    getEnemyActions(enemyId) {
        return this.data.enemyActions.filter(action => action.enemy_id === enemyId);
    }

    // スキルデータを取得
    getSkill(id) {
        return this.data.skills.find(skill => skill.id === id);
    }

    // アイテムデータを取得
    getItem(id) {
        return this.data.items.find(item => item.id === id);
    }

    // 装備データを取得
    getEquipment(id) {
        return this.data.equipment.find(eq => eq.id === id);
    }
    
    // 装備アイテムを取得（ガチャ・ショップ・ドロップ全て含む）
    getEquipmentItems() {
        return this.data.equipment || [];
    }
    
    // ガチャで手に入る装備アイテムを取得
    getEquipmentGachaItems() {
        return this.data.equipment.filter(item => item.acquisition_method === 'ガチャ') || [];
    }

    // 章データを取得
    getStage(chapter) {
        return this.data.stages.find(stage => stage.chapter === chapter);
    }

    // ショップアイテムを取得
    getShopItems() {
        // 統合されたアイテムファイルからショップで販売されるアイテムのみを返す
        return this.data.items.filter(item => item.shop_chapter && parseInt(item.shop_chapter) > 0);
    }

    // ショップアイテムを取得
    getShopItem(itemId) {
        // 統合されたアイテムファイルから指定されたアイテムを取得
        let item = this.data.items.find(item => item.id === itemId);
        
        // アイテムで見つからない場合は装備品から検索
        if (!item) {
            item = this.data.equipment.find(item => item.id === itemId);
        }
        
        return item;
    }

    // 現在の章で購入可能なアイテムを取得（消耗品・永続アイテム・装備品）
    getAvailableShopItems(currentChapter) {
        const items = [];
        
        // 消耗品・永続アイテム
        const consumableItems = this.data.items.filter(item => 
            item.shop_chapter && 
            parseInt(item.shop_chapter) <= currentChapter
        );
        items.push(...consumableItems);
        
        // 装備品
        const equipmentItems = this.data.equipment.filter(item => 
            item.shop_chapter && 
            parseInt(item.shop_chapter) <= currentChapter
        );
        items.push(...equipmentItems);
        
        return items;
    }

    // アイテムの購入価格を取得
    getItemBuyPrice(itemId) {
        const item = this.getItem(itemId);
        return item ? parseInt(item.buy_price) || 0 : 0;
    }

    // アイテムの売却価格を取得
    getItemSellPrice(itemId) {
        const item = this.getItem(itemId);
        return item ? parseInt(item.sell_price) || 0 : 0;
    }

    // アイテムのショップ在庫上限を取得
    getItemMaxStock(itemId) {
        const item = this.getItem(itemId);
        return item ? parseInt(item.max_shop_stock) || 99 : 99;
    }
    
    // ロケーション情報を取得
    getLocation(locationType, chapter) {
        return this.data.locations.find(location => 
            location.location_type === locationType && 
            parseInt(location.chapter) === chapter
        );
    }
    
    // フィールド情報を取得
    getFieldLocation(chapter) {
        return this.getLocation('field', chapter);
    }
    
    // ダンジョン情報を取得
    getDungeonLocation(chapter) {
        return this.getLocation('dungeon', chapter);
    }
    
    // 現在の章のロケーション情報を取得
    getCurrentLocations(chapter) {
        return {
            field: this.getFieldLocation(chapter),
            dungeon: this.getDungeonLocation(chapter)
        };
    }

    // 敵の行動を選択（確率に基づく）
    selectEnemyAction(enemyId) {
        const actions = this.getEnemyActions(enemyId);
        if (actions.length === 0) {
            // デフォルトアクション
            return {
                action_type: 'skill',
                skill_id: 'normal_attack',
                target: 'player'
            };
        }

        // 確率に基づいて行動を選択
        const random = Math.random();
        let cumulativeProbability = 0;
        
        for (const action of actions) {
            cumulativeProbability += action.probability;
            if (random <= cumulativeProbability) {
                return action;
            }
        }
        
        // フォールバック（通常は起こらない）
        return actions[0];
    }

    // レアリティに基づいたドロップ判定
    rollDrop(enemy) {
        if (!enemy.drop_rate || !enemy.drop_item) return null;
        
        const random = Math.random();
        if (random <= enemy.drop_rate) {
            return this.getItem(enemy.drop_item);
        }
        
        return null;
    }

    // 章の敵をランダムに生成
    generateRandomEnemy(chapter) {
        const enemies = this.getChapterEnemies(chapter);
        if (enemies.length === 0) {
            // フォールバック：デフォルト敵
            return this.getEnemy('slime') || this.createDefaultEnemy();
        }
        
        const randomIndex = Math.floor(Math.random() * enemies.length);
        return enemies[randomIndex];
    }

    // デフォルト敵を作成（CSVが読み込まれない場合のフォールバック）
    createDefaultEnemy() {
        return {
            id: 'default_slime',
            name: 'スライム',
            hp: 50,
            maxHp: 50,
            attack: 15,
            defense: 5,
            magic: 0,
            speed: 8,
            exp_reward: 10,
            gold_reward: 5,
            drop_rate: 0.3,
            drop_item: 'potion'
        };
    }

    // アイテムの効果を計算
    calculateItemEffect(itemId, target) {
        const item = this.getItem(itemId);
        if (!item) return { success: false, message: 'アイテムが見つかりません' };

        switch (item.effect_type) {
            case 'heal_hp':
                const healAmount = Math.min(item.effect_value, target.maxHp - target.hp);
                target.hp += healAmount;
                return { success: true, message: `HPを${healAmount}回復した！` };

            case 'heal_mp':
                const mpAmount = Math.min(item.effect_value, target.maxMp - target.mp);
                target.mp += mpAmount;
                return { success: true, message: `MPを${mpAmount}回復した！` };

            case 'full_heal':
                const fullHpHeal = target.maxHp - target.hp;
                const fullMpHeal = target.maxMp - target.mp;
                target.hp = target.maxHp;
                target.mp = target.maxMp;
                return { success: true, message: `HP・MPを全回復した！` };

            case 'cure_poison':
                if (target.statusEffects && target.statusEffects.poison) {
                    delete target.statusEffects.poison;
                    return { success: true, message: '毒状態を回復した！' };
                }
                return { success: false, message: '毒状態ではありません' };

            default:
                return { success: false, message: '効果が適用できませんでした' };
        }
    }

    // スキルダメージを計算
    calculateSkillDamage(skill, attacker, defender) {
        if (!skill) return 0;

        let basePower = skill.base_power || 1.0;
        let statValue = 0;

        // 使用ステータスを決定
        switch (skill.stat_used) {
            case 'attack':
                statValue = attacker.attack || 0;
                break;
            case 'magic':
                statValue = attacker.magic || 0;
                break;
            case 'speed':
                statValue = attacker.speed || 0;
                break;
            default:
                statValue = attacker.attack || 0;
        }

        // ダメージ計算
        let damage = Math.floor(statValue * basePower * (skill.multiplier || 1.0));
        
        // 防御力適用
        if (skill.damage_type === 'physical') {
            damage = Math.max(1, damage - (defender.defense || 0));
        }
        
        return damage;
    }

    // 音声データを取得
    getAudio(id) {
        return this.data.audio.find(audio => audio.id === id);
    }

    // カテゴリ別音声データを取得
    getAudioByCategory(category) {
        return this.data.audio.filter(audio => audio.category === category);
    }

    // タイプ別音声データを取得（bgm or se）
    getAudioByType(type) {
        return this.data.audio.filter(audio => audio.type === type);
    }

    // タイトル設定を取得
    getTitleSetting(settingKey) {
        if (!this.data.titleSettings) return null;
        const setting = this.data.titleSettings.find(s => s.setting_key === settingKey);
        return setting ? setting.value : null;
    }

    // 全タイトル設定を取得
    getAllTitleSettings() {
        return this.data.titleSettings || [];
    }
}

// グローバルインスタンス
const dataManager = new DataManager();
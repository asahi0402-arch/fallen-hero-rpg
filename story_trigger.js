// ===================================
// ストーリートリガーシステム - story_trigger.js
// ===================================

class StoryTriggerManager {
    constructor() {
        this.triggers = [];
        this.visitedLocations = new Set();
        this.defeatedBosses = new Set();
        this.triggeredEvents = new Set();
        this.loaded = false;
        
        this.init();
    }

    async init() {
        await this.loadTriggers();
    }

    // トリガーデータを読み込み
    async loadTriggers() {
        try {
            const cacheBreaker = `?v=${Date.now()}`;
            const response = await fetch('./data/story_triggers.csv' + cacheBreaker);
            if (!response.ok) {
                throw new Error('Failed to load story triggers');
            }

            const csvText = await response.text();
            this.triggers = this.parseCSV(csvText);
            this.loaded = true;
            console.log('Story triggers loaded:', this.triggers.length);
        } catch (error) {
            console.error('Error loading story triggers:', error);
        }
    }

    // CSV解析
    parseCSV(text) {
        const lines = text.split('\n').filter(line => line.trim());
        if (lines.length < 2) return [];

        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const data = [];

        for (let i = 1; i < lines.length; i++) {
            const values = this.parseCSVLine(lines[i]);
            if (values.length === headers.length) {
                const row = {};
                headers.forEach((header, index) => {
                    row[header] = values[index].trim().replace(/"/g, '');
                });
                data.push(row);
            }
        }

        return data;
    }

    // CSV行解析
    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        
        result.push(current);
        return result;
    }

    // 章開始トリガーをチェック
    checkChapterStart(chapter) {
        return this.checkTrigger('chapter_start', { chapter: chapter });
    }

    // ダンジョン初回入場トリガーをチェック
    checkDungeonFirstEnter(location) {
        const isFirstTime = !this.visitedLocations.has(location);
        this.visitedLocations.add(location);
        
        if (isFirstTime) {
            return this.checkTrigger('dungeon_enter', { 
                location: location, 
                first_time: true 
            });
        }
        return null;
    }

    // ボス遭遇トリガーをチェック
    checkBossEncounter(enemyId) {
        return this.checkTrigger('boss_encounter', { enemy: enemyId });
    }

    // ボス撃破トリガーをチェック
    checkBossDefeat(enemyId) {
        this.defeatedBosses.add(enemyId);
        return this.checkTrigger('boss_defeat', { enemy: enemyId });
    }

    // カスタムイベントトリガーをチェック
    checkCustomEvent(eventData) {
        return this.checkTrigger('custom', eventData);
    }

    // トリガー条件をチェック
    checkTrigger(triggerType, context) {
        if (!this.loaded) return null;

        const matchingTriggers = this.triggers.filter(trigger => {
            return trigger.trigger_type === triggerType && 
                   this.evaluateCondition(trigger.condition, context);
        });

        // 優先度でソート（数値が小さいほど優先）
        matchingTriggers.sort((a, b) => parseInt(a.priority) - parseInt(b.priority));

        if (matchingTriggers.length > 0) {
            const trigger = matchingTriggers[0];
            
            // 既にトリガーされた場合はスキップ
            if (this.triggeredEvents.has(trigger.trigger_id)) {
                return null;
            }
            
            this.triggeredEvents.add(trigger.trigger_id);
            return trigger;
        }

        return null;
    }

    // 条件を評価
    evaluateCondition(condition, context) {
        // 条件の例: "chapter:1", "location:dungeon_1&first_time:true", "enemy:goblin_king"
        const conditions = condition.split('&');
        
        return conditions.every(cond => {
            const [key, value] = cond.split(':');
            
            switch (key) {
                case 'chapter':
                    return context.chapter == parseInt(value);
                case 'location':
                    return context.location === value;
                case 'first_time':
                    return context.first_time === (value === 'true');
                case 'enemy':
                    return context.enemy === value;
                case 'player_level':
                    return gameState && gameState.player.level >= parseInt(value);
                case 'gold':
                    return gameState && gameState.player.gold >= parseInt(value);
                default:
                    return false;
            }
        });
    }

    // ストーリーを開始
    triggerStory(storyId) {
        console.log('Triggering story:', storyId);
        
        // ストーリー画面を開く
        const storyUrl = `story.html?story=${storyId}&auto_return=true`;
        console.log('Opening story URL:', storyUrl);
        const storyWindow = window.open(storyUrl, '_blank', 'width=1200,height=800');
        
        // ストーリーウィンドウが閉じられたときの処理
        if (storyWindow) {
            console.log('Story window opened successfully');
        } else {
            console.log('❌ Story window failed to open (popup blocked?)');
            // ウィンドウが開けない場合は簡単なメッセージ表示後にフラグをリセット
            console.log(`📖 ストーリー「${storyId}」が発生しました（ポップアップがブロックされています）`);
            setTimeout(() => {
                if (window.gameState && window.gameState.battle) {
                    console.log('Resetting storyInProgress due to popup failure');
                    window.gameState.battle.storyInProgress = false;
                    
                    // 中ボス撃破後のポップアップブロック時の処理
                    if (window.gameState.battle.midBossDefeated) {
                        console.log('中ボス撃破後のポップアップブロック - ダンジョン探索を開始');
                        window.gameState.battle.midBossDefeated = false;
                        
                        setTimeout(() => {
                            if (window.generateNewEnemy && window.gameState && window.updateUI) {
                                window.gameState.battle.battleCount++; 
                                window.generateNewEnemy();
                                window.gameState.battle.isPlayerTurn = true;
                                window.updateUI();
                                
                                if (window.addBattleLog) {
                                    window.addBattleLog('🗡️ ダンジョン探索を開始します！');
                                }
                            }
                        }, 500);
                    }
                }
            }, 500);
            return false;
        }
        
        if (storyWindow) {
            const checkClosed = setInterval(() => {
                if (storyWindow.closed) {
                    console.log('Story window closed, resetting storyInProgress flag');
                    // メインウィンドウのstoryInProgressフラグをリセット
                    if (window.gameState && window.gameState.battle) {
                        window.gameState.battle.storyInProgress = false;
                        
                        // 中ボス撃破後の会話終了時の特別処理
                        if (window.gameState.battle.midBossDefeated) {
                            console.log('中ボス撃破後の会話終了 - ダンジョン探索を開始');
                            window.gameState.battle.midBossDefeated = false; // フラグをリセット
                            
                            // ダンジョン探索開始
                            setTimeout(() => {
                                if (window.generateNewEnemy && window.gameState && window.updateUI) {
                                    window.gameState.battle.battleCount++; 
                                    window.generateNewEnemy();
                                    window.gameState.battle.isPlayerTurn = true;
                                    window.updateUI();
                                    
                                    if (window.addBattleLog) {
                                        window.addBattleLog('🗡️ ダンジョン探索を開始します！');
                                    }
                                }
                            }, 500);
                        }
                    }
                    clearInterval(checkClosed);
                }
            }, 500); // 500ms間隔でチェック
            
            // フォールバック：30秒後に強制的にフラグをリセット
            setTimeout(() => {
                if (window.gameState && window.gameState.battle && window.gameState.battle.storyInProgress) {
                    console.log('Story timeout: Force resetting storyInProgress flag');
                    window.gameState.battle.storyInProgress = false;
                    
                    // 中ボス撃破後のタイムアウト時も同様の処理
                    if (window.gameState.battle.midBossDefeated) {
                        console.log('中ボス撃破後のタイムアウト - ダンジョン探索を開始');
                        window.gameState.battle.midBossDefeated = false;
                        
                        setTimeout(() => {
                            if (window.generateNewEnemy && window.gameState && window.updateUI) {
                                window.gameState.battle.battleCount++; 
                                window.generateNewEnemy();
                                window.gameState.battle.isPlayerTurn = true;
                                window.updateUI();
                                
                                if (window.addBattleLog) {
                                    window.addBattleLog('🗡️ ダンジョン探索を開始します！');
                                }
                            }
                        }, 500);
                    }
                }
                clearInterval(checkClosed);
            }, 30000); // 30秒のタイムアウト
        }
        
        return true;
    }

    // トリガーを強制リセット（デバッグ用）
    resetTriggers() {
        this.triggeredEvents.clear();
        this.visitedLocations.clear();
        this.defeatedBosses.clear();
        console.log('All triggers reset');
    }

    // データを再読み込み
    async reloadTriggers() {
        console.log('Reloading story triggers...');
        await this.loadTriggers();
    }
}

// グローバルインスタンス
let storyTriggerManager = null;

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    storyTriggerManager = new StoryTriggerManager();
});

// エクスポート
window.StoryTriggerManager = StoryTriggerManager;
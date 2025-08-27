// タイトル画面JavaScript
class TitleScreen {
    constructor() {
        this.settings = {
            bgmVolume: 70,
            seVolume: 80,
            messageSpeed: 'normal'
        };
        
        this.dataManager = new DataManager();
        this.init();
    }
    
    async init() {
        this.setupEventListeners();
        this.loadSettings();
        
        // データ読み込み完了を待つ
        await this.dataManager.loadAllData();
        this.loadTitleCharacter();
    }
    
    loadTitleCharacter() {
        const portraitElement = document.getElementById('titleCharacterPortrait');
        if (!portraitElement) {
            console.warn('❌ タイトル立ち絵要素が見つかりません');
            return;
        }

        // CSVから設定された画像ファイル名を取得
        const titleImageFile = this.dataManager.getTitleSetting('title_character_image');
        
        if (titleImageFile) {
            const imagePath = `./assets/images/characters/${titleImageFile}`;
            portraitElement.src = imagePath;
            portraitElement.alt = 'タイトルキャラクター';
            console.log(`📸 タイトル画像設定 (CSV): ${imagePath}`);
        } else {
            // フォールバック：デフォルトで主人公の立ち絵を使用
            console.warn('⚠️ タイトル画像設定が見つかりません。デフォルトを使用します。');
            const playerData = this.dataManager.getCharacter('player');
            if (playerData) {
                const portraitPath = `./assets/images/characters/${playerData.portrait}`;
                portraitElement.src = portraitPath;
                portraitElement.alt = `${playerData.name}立ち絵`;
                console.log(`📸 フォールバック立ち絵設定: ${playerData.name} - ${portraitPath}`);
            }
        }
    }
    
    setupEventListeners() {
        // メニューボタン
        document.getElementById('startGameBtn').addEventListener('click', () => {
            this.startNewGame();
        });
        
        document.getElementById('loadGameBtn').addEventListener('click', () => {
            this.loadGame();
        });
        
        document.getElementById('galleryBtn').addEventListener('click', () => {
            this.openGallery();
        });
        
        document.getElementById('settingsBtn').addEventListener('click', () => {
            this.openSettings();
        });
        
        // ギャラリーモーダル
        document.getElementById('closeGalleryModal').addEventListener('click', () => {
            this.closeGallery();
        });
        
        // 設定モーダル
        document.getElementById('closeSettingsModal').addEventListener('click', () => {
            this.closeSettings();
        });
        
        // 設定値変更
        document.getElementById('bgmVolume').addEventListener('input', (e) => {
            this.settings.bgmVolume = parseInt(e.target.value);
            document.getElementById('bgmVolumeValue').textContent = e.target.value + '%';
            this.saveSettings();
        });
        
        document.getElementById('seVolume').addEventListener('input', (e) => {
            this.settings.seVolume = parseInt(e.target.value);
            document.getElementById('seVolumeValue').textContent = e.target.value + '%';
            this.saveSettings();
        });
        
        document.getElementById('messageSpeed').addEventListener('change', (e) => {
            this.settings.messageSpeed = e.target.value;
            this.saveSettings();
        });
        
        // モーダル外クリックで閉じる
        document.getElementById('settingsModal').addEventListener('click', (e) => {
            if (e.target.id === 'settingsModal') {
                this.closeSettings();
            }
        });
        
        document.getElementById('galleryModal').addEventListener('click', (e) => {
            if (e.target.id === 'galleryModal') {
                this.closeGallery();
            }
        });
    }
    
    startNewGame() {
        // ゲーム画面に遷移
        window.location.href = 'index.html';
    }
    
    loadGame() {
        // セーブデータの存在チェック
        const saveData = localStorage.getItem('fallenHeroSave');
        
        if (!saveData) {
            this.showGameConfirm(
                '📁 セーブデータなし',
                'セーブデータが見つかりません。\n\n先にゲームを進めてセーブを作成してください。',
                null,
                null,
                true // OKボタンのみ表示
            );
            return;
        }
        
        try {
            const parsedData = JSON.parse(saveData);
            console.log('📁 セーブデータが見つかりました:', parsedData);
            
            // セーブデータの情報を表示
            const playerName = parsedData.player?.name || '不明';
            const level = parsedData.player?.level || 1;
            const chapter = parsedData.battle?.chapter || 1;
            const timestamp = parsedData.timestamp ? new Date(parsedData.timestamp).toLocaleString('ja-JP') : '不明';
            
            const confirmMessage = `セーブデータをロードしますか？\n\nキャラクター: ${playerName}\nレベル: ${level}\nチャプター: ${chapter}章\n保存日時: ${timestamp}`;
            
            this.showGameConfirm(
                '📁 セーブデータロード',
                confirmMessage,
                () => {
                    // ロード用のパラメータを付けてゲーム画面に遷移
                    window.location.href = 'index.html?load=true';
                }
            );
        } catch (error) {
            console.error('セーブデータの読み込みエラー:', error);
            this.showGameConfirm(
                '❌ エラー',
                'セーブデータが破損しています。\n\n新しいゲームを開始してください。',
                null,
                null,
                true // OKボタンのみ表示
            );
        }
    }
    
    // ゲーム風確認モーダル表示関数
    showGameConfirm(title, message, onYes, onNo = null, singleButton = false) {
        const modal = document.getElementById('gameConfirmModal');
        const titleElement = document.getElementById('gameConfirmTitle');
        const messageElement = document.getElementById('gameConfirmMessage');
        const yesButton = document.getElementById('gameConfirmYes');
        const noButton = document.getElementById('gameConfirmNo');
        
        // 内容を設定
        titleElement.textContent = title;
        messageElement.textContent = message;
        
        // 単一ボタンモードの処理
        if (singleButton) {
            yesButton.textContent = 'OK';
            noButton.style.display = 'none';
        } else {
            yesButton.textContent = 'はい';
            noButton.textContent = 'いいえ';
            noButton.style.display = 'block';
        }
        
        // 既存のイベントリスナーを削除
        yesButton.replaceWith(yesButton.cloneNode(true));
        noButton.replaceWith(noButton.cloneNode(true));
        
        // 新しい要素を取得
        const newYesButton = document.getElementById('gameConfirmYes');
        const newNoButton = document.getElementById('gameConfirmNo');
        
        // イベントリスナーを追加
        newYesButton.addEventListener('click', () => {
            modal.style.display = 'none';
            if (onYes) onYes();
        });
        
        if (!singleButton) {
            newNoButton.addEventListener('click', () => {
                modal.style.display = 'none';
                if (onNo) onNo();
            });
        }
        
        // モーダル外クリックで閉じる
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
                if (!singleButton && onNo) onNo();
            }
        });
        
        // モーダルを表示
        modal.style.display = 'flex';
    }
    
    openGallery() {
        document.getElementById('galleryModal').style.display = 'flex';
    }
    
    closeGallery() {
        document.getElementById('galleryModal').style.display = 'none';
    }
    
    openSettings() {
        document.getElementById('settingsModal').style.display = 'flex';
    }
    
    closeSettings() {
        document.getElementById('settingsModal').style.display = 'none';
    }
    
    loadSettings() {
        const savedSettings = localStorage.getItem('fallenHeroSettings');
        
        if (savedSettings) {
            this.settings = JSON.parse(savedSettings);
            
            // UI更新
            document.getElementById('bgmVolume').value = this.settings.bgmVolume;
            document.getElementById('bgmVolumeValue').textContent = this.settings.bgmVolume + '%';
            
            document.getElementById('seVolume').value = this.settings.seVolume;
            document.getElementById('seVolumeValue').textContent = this.settings.seVolume + '%';
            
            document.getElementById('messageSpeed').value = this.settings.messageSpeed;
        }
    }
    
    saveSettings() {
        localStorage.setItem('fallenHeroSettings', JSON.stringify(this.settings));
    }
}

// ページ読み込み完了時に初期化
document.addEventListener('DOMContentLoaded', () => {
    new TitleScreen();
});
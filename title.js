// タイトル画面JavaScript
class TitleScreen {
    constructor() {
        this.settings = {
            bgmVolume: 70,
            seVolume: 80,
            messageSpeed: 'normal'
        };
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadSettings();
    }
    
    setupEventListeners() {
        // メニューボタン
        document.getElementById('startGameBtn').addEventListener('click', () => {
            this.startNewGame();
        });
        
        document.getElementById('continueBtn').addEventListener('click', () => {
            this.continueGame();
        });
        
        document.getElementById('storyBtn').addEventListener('click', () => {
            this.showStory();
        });
        
        document.getElementById('galleryBtn').addEventListener('click', () => {
            this.openGallery();
        });
        
        document.getElementById('settingsBtn').addEventListener('click', () => {
            this.openSettings();
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
    }
    
    startNewGame() {
        // セーブデータをクリア
        localStorage.removeItem('fallenHeroSave');
        
        // ゲーム画面に遷移
        window.location.href = 'index.html';
    }
    
    continueGame() {
        // セーブデータの存在確認
        const saveData = localStorage.getItem('fallenHeroSave');
        
        if (saveData) {
            // ゲーム画面に遷移
            window.location.href = 'index.html';
        } else {
            alert('セーブデータが見つかりません。\\n新しいゲームを開始してください。');
        }
    }
    
    showStory() {
        // ストーリー画面（会話イベント画面）に遷移
        window.location.href = 'story.html';
    }
    
    openGallery() {
        // ギャラリー画面に遷移（未実装）
        alert('ギャラリー機能は今後実装予定です。');
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
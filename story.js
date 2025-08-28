// ===================================
// 会話イベントシステム - story.js (完全新規版)
// ===================================

alert('🚨 新しいstory.jsが読み込まれました！');
console.log('🚀 story.js 完全新規版 - デモデータ完全削除済み');
console.log('📍 document.readyState:', document.readyState);
console.log('📍 window.location:', window.location.href);

// DOM読み込み確認
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('📍 DOMContentLoaded イベント発火');
    });
} else {
    console.log('📍 DOM既に読み込み完了');
}

class StoryManager {
    constructor() {
        console.log('📍 StoryManager コンストラクタ開始');
        this.currentStory = null;
        this.currentSegment = 0;
        this.isAutoPlay = false;
        this.autoPlayInterval = null;
        this.typewriterSpeed = 50; // ms per character
        this.skipMode = false;
        
        console.log('📍 StoryManager init() 呼び出し前');
        this.init();
        console.log('📍 StoryManager コンストラクタ完了');
    }

    init() {
        this.bindEvents();
        this.loadStoryFromURL();
    }

    bindEvents() {
        // 進行ボタン
        document.getElementById('nextBtn').addEventListener('click', () => {
            if (!this.isTyping) {
                this.nextSegment();
            } else {
                this.skipTypewriter();
            }
        });

        // オートプレイボタン
        document.getElementById('autoBtn').addEventListener('click', () => {
            this.toggleAutoPlay();
        });

        // スキップボタン
        document.getElementById('skipBtn').addEventListener('click', () => {
            this.toggleSkipMode();
        });

        // メニューボタン
        document.getElementById('menuBtn').addEventListener('click', () => {
            this.openMenu();
        });

        // メニューモーダル関連
        document.getElementById('closeMenuModal').addEventListener('click', () => {
            this.closeMenu();
        });

        document.getElementById('saveStoryBtn').addEventListener('click', () => {
            this.saveProgress();
        });

        document.getElementById('loadStoryBtn').addEventListener('click', () => {
            this.loadProgress();
        });

        document.getElementById('restartStoryBtn').addEventListener('click', () => {
            this.restartStory();
        });

        document.getElementById('backToTitleBtn').addEventListener('click', () => {
            window.location.href = 'title.html';
        });

        document.getElementById('backToGameBtn').addEventListener('click', () => {
            window.location.href = 'index.html';
        });

        // キーボードショートカット
        document.addEventListener('keydown', (e) => {
            switch(e.key) {
                case ' ':
                case 'Enter':
                    e.preventDefault();
                    if (!this.isTyping) {
                        this.nextSegment();
                    } else {
                        this.skipTypewriter();
                    }
                    break;
                case 'Escape':
                    this.openMenu();
                    break;
                case 's':
                case 'S':
                    if (e.ctrlKey) {
                        e.preventDefault();
                        this.saveProgress();
                    }
                    break;
                case 'r':
                case 'R':
                    if (e.ctrlKey) {
                        e.preventDefault();
                        this.reloadStoryData();
                    }
                    break;
            }
        });

        // モーダル外クリックで閉じる
        document.getElementById('menuModal').addEventListener('click', (e) => {
            if (e.target.id === 'menuModal') {
                this.closeMenu();
            }
        });
    }

    // URLパラメータからストーリーを読み込み
    loadStoryFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const storyId = urlParams.get('story') || 'chapter_1';
        this.autoReturn = urlParams.get('auto_return') === 'true';
        this.loadStory(storyId);
    }

    // ストーリーデータを読み込み
    async loadStory(storyId) {
        try {
            // CSVからストーリーデータを読み込み
            const storyData = await this.loadStoryFromCSV(storyId);
            if (storyData) {
                this.currentStory = storyData;
                this.currentSegment = 0;
                this.displaySegment(0);
                this.updateProgress();
            } else {
                // CSVに失敗した場合はエラー表示
                console.error(`ストーリーID "${storyId}" のデータが見つかりません`);
                this.showError(`ストーリー "${storyId}" が見つかりません。CSVファイルを確認してください。`);
            }
        } catch (error) {
            console.error('ストーリーの読み込みに失敗しました:', error);
            this.showError('ストーリーデータの読み込みに失敗しました。');
        }
    }

    // CSVからストーリーデータを読み込み
    async loadStoryFromCSV(storyId) {
        try {
            console.log('CSV読み込み開始:', storyId);
            console.log('現在のURL:', window.location.href);
            console.log('ベースURL:', window.location.origin);
            
            // キャッシュ回避のためにタイムスタンプを追加
            const cacheBreaker = `?v=${Date.now()}`;
            // 相対パスと絶対パスの両方を試す
            const csvUrl = './data/story_dialogues.csv' + cacheBreaker;
            console.log('取得しようとするCSV URL:', csvUrl);
            
            let response = await fetch(csvUrl);
            
            // 相対パスで失敗した場合、絶対パスを試す
            if (!response.ok) {
                const absoluteUrl = '/data/story_dialogues.csv' + cacheBreaker;
                console.log('相対パス失敗、絶対パスを試行:', absoluteUrl);
                response = await fetch(absoluteUrl);
            }

            if (!response.ok) {
                throw new Error('story_dialogues.csv not found');
            }

            const csvText = await response.text();
            console.log('CSV読み込み成功:', csvText.substring(0, 200) + '...');
            
            const dialogues = this.parseCSV(csvText);
            console.log('CSV解析結果:', dialogues);

            // 指定されたstoryIdのデータを構築
            const chapterDialogues = dialogues
                .filter(d => d.chapter_id === storyId)
                .sort((a, b) => parseInt(a.segment_id) - parseInt(b.segment_id));

            console.log('フィルタ後の会話データ:', chapterDialogues);

            if (chapterDialogues.length === 0) {
                console.warn(`Story ID "${storyId}" のデータが見つかりません`);
                return null;
            }

            const storyData = {
                title: `${storyId}のストーリー`,
                segments: chapterDialogues.map(d => ({
                    speaker: d.speaker,
                    text: d.text,
                    background: d.background_image,
                    leftCharacter: d.left_character,
                    rightCharacter: d.right_character,
                    emotion: d.character_emotion
                }))
            };
            
            console.log('最終ストーリーデータ:', storyData);
            return storyData;

        } catch (error) {
            console.error('CSV読み込みエラー:', error);
            return null;
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

    // CSV行解析（カンマ区切りを正しく処理）
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


    // デモデータは削除 - CSVが読み込めない場合はエラーを表示

    // セグメントを表示
    displaySegment(index) {
        if (!this.currentStory || index >= this.currentStory.segments.length) {
            this.endStory();
            return;
        }

        const segment = this.currentStory.segments[index];
        
        // 背景画像を変更
        this.changeBackground(segment.background);
        
        // キャラクター画像を変更
        this.changeCharacters(segment.leftCharacter, segment.rightCharacter);
        
        // 話者名を表示
        document.getElementById('speakerName').textContent = segment.speaker;
        
        // セリフをタイプライター効果で表示
        this.typewriterText(segment.text);
        
        // プログレスを更新
        this.updateProgress();
    }

    // 背景画像を変更
    changeBackground(bgPath) {
        const bgImage = document.getElementById('backgroundImage');
        if (bgPath && bgPath !== "") {
            bgImage.src = bgPath;
            bgImage.style.display = 'block';
        }
    }

    // キャラクター画像を変更
    changeCharacters(leftPath, rightPath) {
        const leftImg = document.getElementById('leftCharacterImage');
        const rightImg = document.getElementById('rightCharacterImage');
        
        // 左キャラクター
        if (leftPath && leftPath !== "") {
            leftImg.src = leftPath;
            leftImg.style.display = 'block';
            leftImg.parentElement.classList.add('active');
        } else {
            leftImg.style.display = 'none';
            leftImg.parentElement.classList.remove('active');
        }
        
        // 右キャラクター  
        if (rightPath && rightPath !== "") {
            rightImg.src = rightPath;
            rightImg.style.display = 'block';
            rightImg.parentElement.classList.add('active');
        } else {
            rightImg.style.display = 'none';
            rightImg.parentElement.classList.remove('active');
        }
    }

    // タイプライター効果でテキストを表示
    typewriterText(text) {
        const dialogueElement = document.getElementById('dialogueText');
        dialogueElement.innerHTML = '';
        
        this.isTyping = true;
        let index = 0;
        
        const typeNext = () => {
            if (index < text.length && !this.skipMode) {
                dialogueElement.innerHTML += text.charAt(index);
                index++;
                setTimeout(typeNext, this.typewriterSpeed);
            } else {
                // タイピング完了
                dialogueElement.innerHTML = text;
                this.isTyping = false;
            }
        };
        
        if (this.skipMode) {
            dialogueElement.innerHTML = text;
            this.isTyping = false;
        } else {
            typeNext();
        }
    }

    // タイプライター効果をスキップ
    skipTypewriter() {
        if (this.isTyping) {
            this.isTyping = false;
            const segment = this.currentStory.segments[this.currentSegment];
            document.getElementById('dialogueText').innerHTML = segment.text;
        }
    }

    // 次のセグメントへ
    nextSegment() {
        if (this.currentSegment < this.currentStory.segments.length - 1) {
            this.currentSegment++;
            this.displaySegment(this.currentSegment);
        } else {
            this.endStory();
        }
    }

    // オートプレイの切り替え
    toggleAutoPlay() {
        const autoBtn = document.getElementById('autoBtn');
        
        if (this.isAutoPlay) {
            this.isAutoPlay = false;
            clearInterval(this.autoPlayInterval);
            autoBtn.textContent = 'オート';
            autoBtn.classList.remove('active');
        } else {
            this.isAutoPlay = true;
            autoBtn.textContent = 'オート停止';
            autoBtn.classList.add('active');
            this.startAutoPlay();
        }
    }

    // オートプレイ開始
    startAutoPlay() {
        this.autoPlayInterval = setInterval(() => {
            if (!this.isTyping) {
                this.nextSegment();
            }
        }, 3000); // 3秒ごと
    }

    // スキップモードの切り替え
    toggleSkipMode() {
        const skipBtn = document.getElementById('skipBtn');
        
        this.skipMode = !this.skipMode;
        
        if (this.skipMode) {
            skipBtn.textContent = 'スキップ停止';
            skipBtn.classList.add('active');
        } else {
            skipBtn.textContent = 'スキップ';
            skipBtn.classList.remove('active');
        }
    }

    // プログレスバーの更新
    updateProgress() {
        if (!this.currentStory) return;
        
        const progress = ((this.currentSegment + 1) / this.currentStory.segments.length) * 100;
        const progressText = `${this.currentSegment + 1}/${this.currentStory.segments.length}`;
        
        document.getElementById('progressFill').style.width = `${progress}%`;
        document.getElementById('progressText').textContent = progressText;
    }

    // ストーリー終了
    endStory() {
        this.stopAutoPlay();
        
        // 完了メッセージ表示
        setTimeout(() => {
            if (this.autoReturn) {
                // 自動復帰の場合は確認なしで閉じる
                window.close();
            } else {
                // 手動起動の場合は確認してからメインゲームに戻る
                if (confirm('ストーリーが完了しました。メインゲームに戻りますか？')) {
                    window.location.href = 'index.html';
                }
            }
        }, 1000);
    }

    // オートプレイ停止
    stopAutoPlay() {
        if (this.isAutoPlay) {
            this.isAutoPlay = false;
            clearInterval(this.autoPlayInterval);
            document.getElementById('autoBtn').textContent = 'オート';
            document.getElementById('autoBtn').classList.remove('active');
        }
    }

    // メニューを開く
    openMenu() {
        this.stopAutoPlay();
        document.getElementById('menuModal').style.display = 'flex';
    }

    // メニューを閉じる
    closeMenu() {
        document.getElementById('menuModal').style.display = 'none';
    }

    // 進行状況を保存
    saveProgress() {
        const saveData = {
            storyId: this.currentStory?.title || 'unknown',
            currentSegment: this.currentSegment,
            timestamp: new Date().toISOString()
        };
        
        try {
            localStorage.setItem('storyProgress', JSON.stringify(saveData));
            alert('進行状況を保存しました！');
            this.closeMenu();
        } catch (error) {
            console.error('保存に失敗しました:', error);
            alert('保存に失敗しました。');
        }
    }

    // 進行状況を読み込み
    loadProgress() {
        try {
            const saveData = localStorage.getItem('storyProgress');
            if (saveData) {
                const data = JSON.parse(saveData);
                this.currentSegment = data.currentSegment;
                this.displaySegment(this.currentSegment);
                alert('進行状況を読み込みました！');
                this.closeMenu();
            } else {
                alert('保存データが見つかりません。');
            }
        } catch (error) {
            console.error('読み込みに失敗しました:', error);
            alert('読み込みに失敗しました。');
        }
    }

    // ストーリーを最初から開始
    restartStory() {
        if (confirm('本当に最初から読み直しますか？')) {
            this.currentSegment = 0;
            this.displaySegment(0);
            this.closeMenu();
        }
    }

    // ストーリーデータを再読み込み
    async reloadStoryData() {
        console.log('Reloading story data...');
        const urlParams = new URLSearchParams(window.location.search);
        const storyId = urlParams.get('story') || 'chapter_1';
        
        try {
            await this.loadStory(storyId);
            document.getElementById('dialogueText').innerHTML += '<br><span style="color: #4ade80;">📖 ストーリーデータを再読み込みしました</span>';
        } catch (error) {
            console.error('Failed to reload story data:', error);
            document.getElementById('dialogueText').innerHTML += '<br><span style="color: #ff6b6b;">❌ データの再読み込みに失敗しました</span>';
        }
    }

    // エラー表示
    showError(message) {
        document.getElementById('dialogueText').innerHTML = `<span style="color: #ff6b6b;">エラー: ${message}</span>`;
    }
}

// ページ読み込み時に初期化
console.log('📍 StoryManager初期化処理開始');
console.log('📍 document.readyState:', document.readyState);

if (document.readyState === 'loading') {
    console.log('📍 DOM読み込み中 - DOMContentLoadedイベント待機');
    document.addEventListener('DOMContentLoaded', () => {
        console.log('📍 DOMContentLoadedイベント発火 - StoryManager作成');
        window.storyManager = new StoryManager();
    });
} else {
    console.log('📍 DOM既に読み込み完了 - 直接StoryManager作成');
    window.storyManager = new StoryManager();
}
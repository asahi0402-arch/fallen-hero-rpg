# 堕ちた英雄 - ゲーム素材・データ管理マニュアル

このマニュアルでは、RPGゲーム「堕ちた英雄」の各種素材ファイルとゲームデータの管理方法について説明します。

## 📁 ディレクトリ構造

```
堕ちた英雄/
├── assets/                 # 素材ファイル
│   ├── audio/              # 音響素材
│   │   ├── bgm/           # BGM（背景音楽）
│   │   └── se/            # SE（効果音）
│   └── images/            # 画像素材
│       ├── backgrounds/   # 背景画像
│       ├── characters/    # キャラクター画像
│       ├── enemies/       # 敵キャラ画像
│       ├── equipment/     # 装備画像
│       ├── items/         # アイテム画像
│       └── ui/            # UI画像
├── data/                   # ゲームデータ（CSV）
└── 設定・シナリオ/         # ストーリー・設定資料
```

---

## 🖼️ 画像素材の管理

### 敵キャラクター画像
**格納場所**: `assets/images/enemies/`

**ファイル形式**: PNG推奨（JPGも可）
**サイズ**: 500x500px推奨
**命名規則**: `[敵ID].png` （例: `slime.png`, `goblin.png`）

**既存ファイル例**:
- `slime.png` - スライム
- `goblin.png` - ゴブリン  
- `orc.png` - オーク
- `skeleton.png` - スケルトン
- `dark_elf.png` - ダークエルフ

### 背景画像
**格納場所**: `assets/images/backgrounds/`

**ファイル形式**: JPG推奨
**サイズ**: 1920x1080px推奨
**命名規則**: `[場所名]_bg.jpg`

**既存ファイル例**:
- `plains_bg.jpg` - 平原
- `dark_forest_bg.jpg` - 暗黒の森
- `cave_bg.jpg` - 洞窟

### キャラクター画像
**格納場所**: `assets/images/characters/`

**主人公立ち絵**: `player_portrait.png`

---

## 🎵 音響素材の管理

### BGM（背景音楽）
**格納場所**: `assets/audio/bgm/`
**ファイル形式**: MP3推奨
**命名規則**: `[場所名]_theme.mp3`

### SE（効果音）
**格納場所**: `assets/audio/se/`
**ファイル形式**: MP3推奨
**命名規則**: `[効果名].mp3`

---

## 📊 ゲームデータ（CSV）の管理

### 🗡️ 敵キャラクターデータ

#### 1. enemies.csv - 敵の基本データ
**格納場所**: `data/enemies.csv`

**必須列**:
- `id` - 敵の一意ID（英数字、アンダースコア可）
- `name` - 敵の表示名
- `chapter` - 出現する章番号
- `hp` - 体力
- `attack` - 攻撃力
- `defense` - 防御力
- `image` - 画像ファイル名（拡張子含む）

**例**:
```csv
id,name,chapter,hp,mp,attack,defense,magic,speed,exp_reward,gold_reward,drop_rate,drop_item,image,description,ai_pattern
touzoku_A,盗賊A,1,80,5,20,10,0,6,20,12,0.25,equipment_fragment,orc.png,平均的盗賊,normal_attack
```

#### 2. stages.csv - 章の設定と敵出現リスト
**格納場所**: `data/stages.csv`

**重要**: 新しい敵を追加したら、**必ず該当章のenemy_poolに敵IDを追加**

**例**:
```csv
chapter,stage_name,max_battles,enemy_pool,boss_enemy,background_image,...
1,盗賊団の隠れ家,10,"slime,goblin,touzoku_A,touzoku_B,touzoku_C,orc,skeleton",orc,...
```

### 🏪 アイテム・装備データ

#### shop.csv - ショップアイテム
**格納場所**: `data/shop.csv`
- `item_id` - アイテムID
- `item_name` - 表示名
- `price` - 価格
- `chapter` - 解禁章
- `effect_type` - 効果タイプ

#### equipment.csv - 装備品
**格納場所**: `data/equipment.csv`

### 📖 ストーリー・会話データ

#### story_dialogues.csv - 会話データ
**格納場所**: `data/story_dialogues.csv`
- `dialogue_id` - 会話ID
- `speaker` - 話者
- `text` - セリフ内容
- `chapter` - 関連章

#### story_triggers.csv - イベント発生条件
**格納場所**: `data/story_triggers.csv`

---

## 🔄 データ更新の手順

### 新しい敵キャラクターを追加する場合

1. **画像を準備**
   - `assets/images/enemies/` に画像ファイルを配置
   - ファイル名: `[敵ID].png`

2. **enemies.csv を更新**
   - 新しい行を追加
   - 全ての必須項目を記入

3. **stages.csv を更新** ⚠️重要⚠️
   - 該当章の`enemy_pool`に敵IDを追加
   - カンマ区切りで既存の敵IDリストに追加

4. **ブラウザでF5更新**
   - 変更が即座に反映される

### 新しいアイテムを追加する場合

1. **画像を準備**（必要に応じて）
   - `assets/images/items/` に配置

2. **shop.csv を更新**
   - 新しいアイテムデータを追加
   - `chapter`で解禁章を設定

### ストーリー・セリフを追加する場合

1. **story_dialogues.csv を更新**
   - 新しい会話データを追加

2. **story_triggers.csv を更新**（必要に応じて）
   - イベント発生条件を設定

---

## ⚠️ 注意事項

### CSVファイル編集時の注意
- **文字エンコード**: UTF-8 BOM付きで保存
- **カンマ区切り**: 値にカンマが含まれる場合はダブルクォートで囲む
- **改行**: CRLF（Windows形式）推奨

### ファイル命名規則
- **英数字とアンダースコア**のみ使用
- **スペース不可**
- **日本語ファイル名不可**

### 画像ファイル要件
- **PNG/JPG形式**
- **適切なサイズ**（敵: 500x500px、背景: 1920x1080px）
- **透明背景**（PNG使用時）

---

## 🛠️ トラブルシューティング

### 敵が出現しない場合
1. `enemies.csv`にデータが正しく追加されているか確認
2. **`stages.csv`のenemy_poolに敵IDが追加されているか確認** ←最重要
3. ブラウザのキャッシュをクリア（Ctrl+F5）

### 画像が表示されない場合
1. ファイルパスが正しいか確認
2. ファイル名の大文字小文字が一致しているか確認
3. 画像ファイルが破損していないか確認

### データが反映されない場合
1. CSVファイルの文字エンコードを確認（UTF-8 BOM付き）
2. CSV形式が正しいか確認（カンマ区切り）
3. ブラウザで開発者ツール（F12）を開いてエラーをチェック

---

このマニュアルに従って素材とデータを管理することで、ゲーム内容を効率的に拡張できます。
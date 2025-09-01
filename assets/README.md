# アセット（素材）管理フォルダ


このフォルダには、「堕ちた英雄」で使用される全ての素材ファイルが格納されています。

## フォルダ構成

```
assets/
├── images/                 # 画像ファイル
│   ├── characters/         # キャラクター画像
│   ├── enemies/           # 敵キャラクター画像  
│   ├── items/             # アイテムアイコン
│   ├── equipment/         # 装備アイコン
│   ├── backgrounds/       # 背景画像
│   └── ui/               # UI画像
└── audio/                 # 音声ファイル
    ├── bgm/              # 背景音楽
    └── se/               # 効果音
```

## CSV連携について

各素材ファイルは、dataフォルダ内のCSVファイルで参照されています：

- **characters.csv** → `assets/images/characters/`のファイル
- **enemies.csv** → `assets/images/enemies/`のファイル  
- **items.csv** → `assets/images/items/`のファイル
- **equipment.csv** → `assets/images/equipment/`のファイル
- **stages.csv** → `assets/images/backgrounds/`と`assets/audio/bgm/`のファイル
- **skills.csv** → `assets/audio/se/`のファイル

## 素材の差し替え方法

1. CSVファイルで指定されているファイル名を確認
2. 対応するフォルダに同名のファイルを配置  
3. ゲームを再読み込みして動作確認

## 推奨仕様

### 画像ファイル：
- **キャラクター/敵**: 200x200px、PNG/SVG形式
- **アイテム/装備**: 64x64px、PNG/SVG形式  
- **背景**: 800x600px、JPG/SVG形式
- **UI**: 用途に応じた適切なサイズ

### 音声ファイル：
- **BGM**: MP3形式、1-5MB、ループ対応
- **SE**: MP3/WAV形式、10KB-100KB、0.5-3秒

## 現在のサンプルファイル

以下のサンプルファイルが作成済みです：

- `enemies/slime.svg` - スライムのサンプル画像
- `enemies/goblin.svg` - ゴブリンのサンプル画像  
- `enemies/orc.svg` - オークのサンプル画像
- `characters/player_portrait.svg` - 主人公のサンプル画像
- `items/potion.svg` - ポーションのサンプル画像
- `backgrounds/plains_bg.svg` - 平原背景のサンプル画像

## ライセンス注意事項

商用利用する場合は、以下の点にご注意ください：

- フリー素材サイトの利用規約を確認
- AI生成素材の著作権ガイドラインを確認  
- クレジット表記が必要な素材は適切に記載
- 有償素材を使用する場合は適切にライセンス購入

## 素材調達におすすめのサイト

### 画像素材：
- いらすとや（https://www.irasutoya.com/）
- Pixabay（https://pixabay.com/ja/）
- Unsplash（https://unsplash.com/）

### 音楽・効果音：
- DOVA-SYNDROME（https://dova-s.jp/）
- 魔王魂（https://maou.audio/）
- 効果音ラボ（https://soundeffect-lab.info/）

### AI生成ツール：
- Stable Diffusion（画像生成）
- Suno AI（音楽生成）
- Eleven Labs（音声生成）
@echo off
REM クイック保存用バッチファイル
echo 🚀 クイック保存開始...

REM 変更をGitに追加
git add .

REM 簡潔なコミット
git commit -m "ゲーム更新 - %date% %time%"

REM GitHubにプッシュ
git push origin master

echo ✨ 保存完了！ https://github.com/asahi0402-arch/fallen-hero-rpg
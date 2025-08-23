@echo off
echo ゲームをGitHubに保存中...

REM 変更をステージに追加
git add .

REM コミットメッセージを生成（日時付き）
for /f "tokens=2-4 delims=/ " %%a in ('date /t') do (
    set day=%%a
    set month=%%b
    set year=%%c
)
for /f "tokens=1-2 delims=: " %%a in ('time /t') do (
    set hour=%%a
    set minute=%%b
)

git commit -m "ゲーム改修: %year%/%month%/%day% %hour%:%minute% 🎮"

REM GitHubにプッシュ
./gh-cli/bin/gh.exe repo sync

echo.
echo ✅ ゲームがGitHubに保存されました！
echo リポジトリ: https://github.com/asahi0402-arch/fallen-hero-rpg
echo.
pause
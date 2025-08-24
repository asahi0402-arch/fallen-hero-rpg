#!/usr/bin/env python3
"""
簡単なHTTPサーバー - CORS対応版 + ポート自動検出
ゲーム用のローカルサーバーを起動します
"""

import http.server
import socketserver
import os
import socket
import webbrowser
from urllib.parse import urlparse

class CORSRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # CORS対応のヘッダーを追加
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

def find_available_port(start_port=8080, max_attempts=10):
    """利用可能なポートを検出する"""
    for port in range(start_port, start_port + max_attempts):
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.bind(('', port))
                return port
        except OSError:
            print(f"ポート {port} は使用中です...")
            continue
    return None

def kill_existing_servers():
    """既存のサーバープロセスを終了させる（標準ライブラリ版）"""
    import subprocess
    import sys
    
    try:
        # WindowsでPythonプロセスを検索
        if sys.platform == 'win32':
            result = subprocess.run(['tasklist', '/FI', 'IMAGENAME eq python.exe', '/FO', 'CSV'], 
                                  capture_output=True, text=True, encoding='shift-jis')
            if result.returncode == 0:
                lines = result.stdout.strip().split('\n')
                if len(lines) > 1:  # ヘッダー行を除く
                    print("既存のPythonプロセスが検出されました。手動で終了することをお勧めします。")
                    print("または、タスクマネージャーでpython.exeプロセスを終了してください。")
        else:
            # Unix系の場合
            result = subprocess.run(['pgrep', '-f', 'server.py'], capture_output=True, text=True)
            if result.returncode == 0:
                pids = result.stdout.strip().split('\n')
                for pid in pids:
                    if pid:
                        subprocess.run(['kill', pid])
                        print(f"プロセス {pid} を終了しました")
    except Exception as e:
        print(f"プロセス検索中にエラー: {e}")
        print("既存のサーバープロセスが残っている場合は、手動で終了してください")

if __name__ == "__main__":
    print("堕ちた英雄 - ゲームサーバー起動中...")
    
    # 既存のサーバープロセスを終了
    kill_existing_servers()
    
    # 利用可能なポートを検出
    PORT = find_available_port()
    
    if PORT is None:
        print("利用可能なポートが見つかりません。手動でポート 8080-8090 を解放してください。")
        input("何かキーを押してください...")
        exit(1)
    
    # ゲームディレクトリをサーバーのルートに設定
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    try:
        with socketserver.TCPServer(("", PORT), CORSRequestHandler) as httpd:
            url = f"http://localhost:{PORT}"
            print(f"[OK] ゲームサーバーがポート {PORT} で起動しました！")
            print(f"[URL] ブラウザでアクセス: {url}")
            print("[INFO] サーバーを停止するには Ctrl+C を押してください")
            
            # ブラウザを自動で開く
            try:
                webbrowser.open(url)
                print("[BROWSER] ブラウザを開きました")
            except Exception:
                print("[WARNING] ブラウザの自動起動に失敗しました。手動で上記URLにアクセスしてください")
            
            httpd.serve_forever()
            
    except KeyboardInterrupt:
        print("\n[STOP] サーバーを停止しました")
    except Exception as e:
        print(f"[ERROR] サーバーエラー: {e}")
        input("何かキーを押してください...")
        exit(1)
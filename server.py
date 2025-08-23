#!/usr/bin/env python3
"""
簡単なHTTPサーバー - CORS対応版
ゲーム用のローカルサーバーを起動します
"""

import http.server
import socketserver
import os
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

if __name__ == "__main__":
    PORT = 8000
    
    # ゲームディレクトリをサーバーのルートに設定
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    with socketserver.TCPServer(("", PORT), CORSRequestHandler) as httpd:
        print("🎮 堕ちた英雄 ゲームサーバー起動中...")
        print(f"🌐 ブラウザで http://localhost:{PORT} にアクセスしてください")
        print("🛑 サーバーを停止するには Ctrl+C を押してください")
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n✅ サーバーを停止しました")
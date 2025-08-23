const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8000;

// MIMEタイプのマップ
const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.csv': 'text/csv',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
    // CORS対応ヘッダーを追加
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    let filePath = '.' + req.url;
    if (filePath === './') {
        filePath = './index.html';
    }

    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404);
                res.end('ファイルが見つかりません: ' + filePath);
            } else {
                res.writeHead(500);
                res.end('サーバーエラー: ' + error.code);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log('🎮 堕ちた英雄 ゲームサーバー起動中...');
    console.log(`🌐 ブラウザで http://localhost:${PORT} にアクセスしてください`);
    console.log('🛑 サーバーを停止するには Ctrl+C を押してください');
});

process.on('SIGINT', () => {
    console.log('\n✅ サーバーを停止しました');
    process.exit(0);
});
// Service Worker: トップレベルナビゲーションを傍受し、
// viewer.html でラップして開き直す

const VIEWER_PATH = '/viewer.html'; // 相対パスは scope に依存

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

let wrapEnabled = true;
let viewerPath = null;

self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SET_WRAP_MODE') {
        wrapEnabled = event.data.enabled;
        if (event.data.viewerPath) viewerPath = event.data.viewerPath;
    }
});

self.addEventListener('fetch', (event) => {
    const req = event.request;
    const url = new URL(req.url);

    // 自オリジンの viewer.html / index.html / sw.js はそのまま通す
    if (url.origin === self.location.origin) {
        return; // デフォルト処理
    }

    // クロスオリジン & トップレベルナビゲーション（新規タブ含む）を傍受
    if (wrapEnabled &&
        req.mode === 'navigate' &&
        req.destination === 'document') {

        // viewer.html にリダイレクトして、開きたいURLをハッシュで渡す
        const targetURL = req.url;
        const payload = btoa(unescape(encodeURIComponent(JSON.stringify({
            url: targetURL,
            strict: true,
            spoof: true
        }))));

        const wrapped = (viewerPath || VIEWER_PATH) + '#' + payload;
        event.respondWith(Response.redirect(wrapped, 302));
        return;
    }

    // それ以外はデフォルト
});

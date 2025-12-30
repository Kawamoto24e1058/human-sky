import { io } from 'socket.io-client';

// HMR時もソケットを一度だけ生成するためのシングルトン
declare global {
  interface Window {
    __HS_SOCKET?: ReturnType<typeof io>;
    __HS_SOCKET_LISTENERS_ATTACHED?: boolean;
  }
}

// 接続先URLの決定
// - 本番(Render等)では window.location.origin を使用
// - 開発ではバックエンドの localhost:3001 に直接接続
const BASE_URL = (import.meta as any).env?.PROD ? window.location.origin : 'http://localhost:3001';

// Socket.IOに接続
// WebSocket優先 + Pollingフォールバック
if (!window.__HS_SOCKET) {
  window.__HS_SOCKET = io(BASE_URL, {
    autoConnect: true,
    transports: ['websocket', 'polling'],
    // Cookies/認証ヘッダーを常に送信
    withCredentials: true,
    // 自動再接続を有効化
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
    // Socket.IOのデフォルトパスを明示
    path: '/socket.io/',
    // アップグレード許可
    upgrade: true,
    rememberUpgrade: true,
    forceNew: false,
    closeOnBeforeunload: true
  });
}

export const socket = window.__HS_SOCKET!;

// リスナーは一度だけ登録（HMRでの重複防止）
if (!window.__HS_SOCKET_LISTENERS_ATTACHED) {
  window.__HS_SOCKET_LISTENERS_ATTACHED = true;
  // デバッグ情報
  console.log('[Socket] 🔧 Configuration:', {
  baseUrl: BASE_URL,
  origin: window.location.origin,
  transports: ['websocket','polling'],
  withCredentials: true,
  path: '/socket.io/',
  note: 'Production: window.location.origin, Dev: localhost:3001'
  });
  console.log('[Socket] ✓ Connecting to:', BASE_URL);

// 🔍 全てのSocket.IOイベントを可視化（デバッグ用）
  socket.onAny((eventName, ...args) => {
  console.log(`[Socket] 📨 Event: "${eventName}"`, {
    timestamp: new Date().toLocaleTimeString('ja-JP'),
    args: args,
    argsCount: args.length
  });
  
  // ローカルストレージにイベント履歴を保存
  try {
    const events = JSON.parse(localStorage.getItem('__socketEventLog') || '[]');
    events.push({
      event: eventName,
      timestamp: new Date().toISOString(),
      argsPreview: JSON.stringify(args).slice(0, 200) // 最初の200文字のみ
    });
    localStorage.setItem('__socketEventLog', JSON.stringify(events.slice(-50))); // 最新50件保持
  } catch (e) {
    // ローカルストレージエラーは無視
  }
  });

// 送信イベントの可視化
  socket.onAnyOutgoing((eventName, ...args) => {
  console.log(`[Socket] 📤 Sending: "${eventName}"`, {
    timestamp: new Date().toLocaleTimeString('ja-JP'),
    args: args,
    argsCount: args.length
  });
  });

  socket.on('connect', () => {
  console.log('[Socket] ✅ Connected:', socket.id);
  console.log('[Socket] Connection details:', {
    transport: socket.io.engine?.transport?.name || 'unknown',
    origin: window.location.origin,
    protocol: window.location.protocol
  });
  
  // グローバルウィンドウにソケット情報を保存（デバッグ用）
  (window as any).__socketInfo = {
    id: socket.id,
    connected: true,
    transport: socket.io.engine?.transport?.name || 'unknown',
    origin: window.location.origin,
    timestamp: new Date().toISOString()
  };
  });

  socket.on('connect_error', (err) => {
  const errorMessage = `[Socket] ❌ Connect Error: ${err.message}`;
  const isCodespaces = window.location.hostname.includes('app.github.dev') || 
                       window.location.hostname.includes('github.dev');
  
  console.error(errorMessage, {
    message: err.message,
    data: (err as any).data,
    timestamp: new Date().toISOString(),
    origin: window.location.origin,
    isCodespaces,
    transport: socket.io.engine?.transport?.name || 'unknown',
    currentTransports: socket.io.engine?.upcomingTransports || 'unknown'
  });
  
  // xhr poll errorの詳細ログ
  if (err.message?.includes('xhr')) {
    console.error('[Socket] 🚨 XHR Polling Error Details:', {
      description: 'HTTPポーリングが失敗しています。WebSocketのみに切り替えました。',
      origin: window.location.origin,
      path: '/socket.io/',
      transports: 'websocket only',
      suggestedCheck: 'WebSocketが正常に接続されるか確認してください'
    });
  }
  
  // Codespacesのポート設定に関する警告
  let portWarning = '';
  if (isCodespaces) {
    portWarning = `
⚠️ GitHub Codespaces環境を検出しました

【重要】ポート設定を確認してください：
1. VSCode下部の「ポート」タブを開く
2. ポート 3001 が「Public」（公開）になっているか確認
3. もし「Private」（非公開）の場合：
   → ポート 3001 を右クリック
   → 「ポートの表示範囲」→「Public」を選択
4. ブラウザをリロードして再接続

現在の接続先: ${window.location.origin}
`;
    console.warn(portWarning);
    
    // 画面上に警告を表示
    if (!document.getElementById('codespaces-port-warning')) {
      const warningDiv = document.createElement('div');
      warningDiv.id = 'codespaces-port-warning';
      warningDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        max-width: 400px;
        background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
        color: white;
        padding: 20px;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        z-index: 10000;
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 14px;
        line-height: 1.6;
        animation: slideIn 0.3s ease-out;
      `;
      warningDiv.innerHTML = `
        <div style="display: flex; align-items: start; gap: 12px;">
          <div style="font-size: 24px; flex-shrink: 0;">⚠️</div>
          <div style="flex: 1;">
            <strong style="display: block; font-size: 16px; margin-bottom: 8px;">
              WebSocket接続エラー
            </strong>
            <p style="margin: 8px 0;">ポート 3001 が <strong>Public</strong> に設定されていることを確認してください。</p>
            <ol style="margin: 8px 0; padding-left: 20px;">
              <li>VSCode下部の「ポート」タブを開く</li>
              <li>ポート 3001 を右クリック</li>
              <li>「ポートの表示範囲」→「Public」を選択</li>
              <li>ブラウザをリロード</li>
            </ol>
            <button onclick="this.parentElement.parentElement.parentElement.remove()" 
                    style="margin-top: 12px; padding: 8px 16px; background: rgba(255,255,255,0.2); 
                           border: 1px solid rgba(255,255,255,0.3); color: white; border-radius: 6px; 
                           cursor: pointer; font-size: 13px;">
              閉じる
            </button>
          </div>
        </div>
      `;
      
      const style = document.createElement('style');
      style.textContent = `
        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `;
      document.head.appendChild(style);
      document.body.appendChild(warningDiv);
      
      // 30秒後に自動で消す
      setTimeout(() => {
        warningDiv.style.animation = 'slideIn 0.3s ease-out reverse';
        setTimeout(() => warningDiv.remove(), 300);
      }, 30000);
    }
  }
  
  // スクリーン上にも表示（HTMLアラート）
  const errorDetails = `
接続エラーが発生しました
━━━━━━━━━━━━━━━━━━━━━
エラー: ${err.message}
Origin: ${window.location.origin}
時刻: ${new Date().toLocaleString('ja-JP')}
${isCodespaces ? '\n⚠️ Codespacesポート設定を確認してください（コンソール参照）' : ''}

ブラウザコンソールで詳細を確認してください (F12 キーを押す)
  `.trim();
  
  // ローカルストレージにエラーを記録
  try {
    const errors = JSON.parse(localStorage.getItem('__socketErrors') || '[]');
    errors.push({
      type: 'connect_error',
      message: err.message,
      timestamp: new Date().toISOString(),
      origin: window.location.origin,
      isCodespaces,
      portWarning: isCodespaces ? 'Check if port 3001 is set to Public' : null
    });
    localStorage.setItem('__socketErrors', JSON.stringify(errors.slice(-10))); // 最新10件保持
  } catch (e) {
    console.error('[Socket] Failed to save error to localStorage:', e);
  }
  
  // 画面上に表示（既存のToastシステムと連携予定）
  if (typeof window !== 'undefined' && (window as any).__showErrorToast) {
    (window as any).__showErrorToast(errorMessage, {
      detail: `Origin: ${window.location.origin}`,
      duration: 8000
    });
  }
  });

  socket.on('disconnect', (reason) => {
  const warnMessage = `[Socket] 👋 Disconnected: ${reason}`;
  console.warn(warnMessage, {
    reason,
    timestamp: new Date().toISOString()
  });
  
  // グローバルウィンドウの情報を更新
  (window as any).__socketInfo = {
    id: socket.id,
    connected: false,
    reason,
    timestamp: new Date().toISOString()
  };
  
  // 自発的な切断以外は警告を表示
  if (reason !== 'io client namespace disconnect' && reason !== 'io server namespace disconnect') {
    const disconnectMessage = `
接続が切断されました
━━━━━━━━━━━━━━━━━━━━━
原因: ${reason}
時刻: ${new Date().toLocaleString('ja-JP')}

再接続を試みています...
    `.trim();
    
    console.warn('[Socket] Disconnect details:', {
      reason,
      timestamp: new Date().toISOString()
    });
    
    // ローカルストレージに記録
    try {
      const events = JSON.parse(localStorage.getItem('__socketEvents') || '[]');
      events.push({
        type: 'disconnect',
        reason,
        timestamp: new Date().toISOString()
      });
      localStorage.setItem('__socketEvents', JSON.stringify(events.slice(-20))); // 最新20件保持
    } catch (e) {
      console.error('[Socket] Failed to save event to localStorage:', e);
    }
    
    if (typeof window !== 'undefined' && (window as any).__showWarningToast) {
      (window as any).__showWarningToast(warnMessage, { duration: 5000 });
    }
  }
  });

// デバッグ用のグローバル関数をウィンドウに登録
  if (typeof window !== 'undefined') {
  (window as any).__socketDebug = {
    // 接続情報を表示
    info: () => {
      console.log('[Socket Debug] Connection Info:', {
        id: socket.id,
        connected: socket.connected,
        disconnected: socket.disconnected,
        origin: window.location.origin,
        transport: socket.io.engine?.transport?.name || 'unknown',
        timestamp: new Date().toISOString()
      });
    },
    
    // エラーログを表示
    errors: () => {
      const errors = JSON.parse(localStorage.getItem('__socketErrors') || '[]');
      console.table(errors);
      return errors;
    },
    
    // イベントログを表示
    events: () => {
      const events = JSON.parse(localStorage.getItem('__socketEventLog') || '[]');
      console.table(events);
      return events;
    },
    
    // 全てのログをクリア
    clear: () => {
      localStorage.removeItem('__socketErrors');
      localStorage.removeItem('__socketEvents');
      localStorage.removeItem('__socketEventLog');
      console.log('[Socket Debug] All logs cleared');
    },
    
    // 手動で再接続
    reconnect: () => {
      console.log('[Socket Debug] Manual reconnect...');
      socket.disconnect();
      setTimeout(() => socket.connect(), 1000);
    },
    
    // 接続テスト
    test: () => {
      console.log('[Socket Debug] Testing connection...');
      socket.emit('ping', { timestamp: Date.now() }, (response: any) => {
        console.log('[Socket Debug] Ping response:', response);
      });
    }
  };
  
  console.log('%c[Socket] デバッグコマンドが利用可能です', 'color: #4AF0FF; font-weight: bold; font-size: 14px;');
  console.log('%c使い方:', 'color: #4AF0FF; font-weight: bold;');
  console.log('  __socketDebug.info()      - 接続情報を表示');
  console.log('  __socketDebug.errors()    - エラーログを表示');
  console.log('  __socketDebug.events()    - イベントログを表示');
  console.log('  __socketDebug.clear()     - ログをクリア');
  console.log('  __socketDebug.reconnect() - 手動再接続');
  console.log('  __socketDebug.test()      - 接続テスト');
  }
}

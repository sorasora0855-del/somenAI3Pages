import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [message, setMessage] = useState('');

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <button className="icon-button" onClick={() => setSidebarOpen(false)} aria-label="サイドバーを閉じる">☰</button>
          <div className="brand">somenAI</div>
        </div>
        <button className="new-chat">＋ 新しいチャット</button>
        <nav className="chat-list" aria-label="チャット履歴">
          <button>チャットA</button>
          <button>チャットB</button>
          <button>チャットC</button>
        </nav>
        <div className="sidebar-bottom">
          <button>📚 参考資料</button>
          <button>⚙ 設定</button>
        </div>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          {!sidebarOpen && (
            <button className="icon-button" onClick={() => setSidebarOpen(true)} aria-label="サイドバーを開く">☰</button>
          )}
          <div className="mobile-brand">somenAI</div>
          <button className="profile-button" aria-label="アカウント">●</button>
        </header>

        <section className="chat-area">
          <div className="welcome">
            <div className="logo-placeholder">somenAI</div>
            <h1>何をお手伝いしようか？</h1>
            <p>あなたのためのAIアシスタント</p>
          </div>
        </section>

        <form className="composer" onSubmit={(event) => event.preventDefault()}>
          <button type="button" className="attach-button" aria-label="ファイルを添付">＋</button>
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="メッセージを入力…"
            rows={1}
          />
          <button type="submit" className="send-button" disabled={!message.trim()} aria-label="送信">↑</button>
        </form>
        <div className="disclaimer">somenAIはAIによって回答を生成します。重要な情報は確認してください。</div>
      </main>
    </div>
  );
}

void API_BASE_URL;
createRoot(document.getElementById('root')).render(<App />);

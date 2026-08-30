import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import { API_BASE_URL } from './config.js';

const api = async (path, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: 'include',
    ...options,
    headers: { 'content-type': 'application/json', ...(options.headers || {}) },
  });
  if (response.status === 204) return null;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || '通信に失敗しました');
  return data;
};

function AuthScreen({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ username: '', password: '', registrationKey: '' });
  const [error, setError] = useState('');
  const submit = async (e) => {
    e.preventDefault(); setError('');
    try {
      const data = await api(`/api/auth/${mode}`, { method: 'POST', body: JSON.stringify(form) });
      onLogin(data.user);
    } catch (err) { setError(err.message); }
  };
  return <div className="auth-shell"><div className="auth-card">
    <div className="auth-logo">somenAI</div>
    <h1>{mode === 'login' ? 'おかえりなさい' : 'somenAIをはじめよう'}</h1>
    <p className="auth-subtitle">{mode === 'login' ? 'アカウントにログインしてください' : '登録キーを使ってアカウントを作成'}</p>
    <form onSubmit={submit} className="auth-form">
      {mode === 'register' && <input value={form.registrationKey} onChange={e => setForm({...form, registrationKey:e.target.value})} placeholder="登録キー" autoComplete="off" required />}
      <input value={form.username} onChange={e => setForm({...form, username:e.target.value})} placeholder="ユーザー名" autoComplete="username" required />
      <input value={form.password} onChange={e => setForm({...form, password:e.target.value})} placeholder="パスワード（8文字以上）" type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required />
      {error && <div className="error-box">{error}</div>}
      <button className="primary-button" type="submit">{mode === 'login' ? 'ログイン' : 'アカウントを作成'}</button>
    </form>
    <button className="text-button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>
      {mode === 'login' ? '新規登録はこちら' : 'ログインに戻る'}
    </button>
  </div></div>;
}

function ChatApp({ user, onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef(null);

  const loadChats = async () => {
    const data = await api('/api/chats'); setChats(data.chats);
    if (!activeChat && data.chats[0]) setActiveChat(data.chats[0]);
  };
  useEffect(() => { loadChats().catch(e => setError(e.message)); }, []);
  useEffect(() => {
    if (!activeChat) { setMessages([]); return; }
    api(`/api/chats/${activeChat.id}/messages`).then(d => setMessages(d.messages)).catch(e => setError(e.message));
  }, [activeChat]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const newChat = async () => {
    const data = await api('/api/chats', { method:'POST', body: JSON.stringify({}) });
    setChats(c => [data.chat, ...c]); setActiveChat(data.chat); setMessages([]);
  };
  const send = async e => {
    e.preventDefault(); if (!message.trim() || !activeChat || sending) return;
    const text = message.trim(); setMessage(''); setSending(true); setError('');
    setMessages(m => [...m, { id:`local-${Date.now()}`, role:'user', content:text }]);
    try {
      const data = await api(`/api/chats/${activeChat.id}/respond`, { method:'POST', body: JSON.stringify({ content:text }) });
      setMessages(m => [...m, data.message]); await loadChats();
    } catch (err) { setError(err.message); }
    finally { setSending(false); }
  };
  const deleteChat = async id => { await api(`/api/chats/${id}`, {method:'DELETE'}); const left=chats.filter(c=>c.id!==id); setChats(left); setActiveChat(left[0]||null); };
  const logout = async () => { await api('/api/auth/logout',{method:'POST'}).catch(()=>{}); onLogout(); };

  return <div className="app-shell">
    <aside className={`sidebar ${sidebarOpen?'open':'closed'}`}>
      <div className="sidebar-header"><button className="icon-button" onClick={()=>setSidebarOpen(false)}>☰</button><div className="brand">somenAI</div></div>
      <button className="new-chat" onClick={newChat}>＋ 新しいチャット</button>
      <nav className="chat-list">{chats.map(chat => <div className={`chat-row ${activeChat?.id===chat.id?'active':''}`} key={chat.id}><button onClick={()=>setActiveChat(chat)}>{chat.title}</button><button className="delete-chat" onClick={()=>deleteChat(chat.id)} aria-label="削除">×</button></div>)}</nav>
      <div className="sidebar-bottom"><button>📚 参考資料</button><button>⚙ 設定</button><button onClick={logout}>↪ ログアウト</button></div>
    </aside>
    <main className="main-panel">
      <header className="topbar">{!sidebarOpen&&<button className="icon-button" onClick={()=>setSidebarOpen(true)}>☰</button>}<div className="mobile-brand">{activeChat?.title||'somenAI'}</div><button className="profile-button" title={user.username}>{user.role==='admin'?'管理者':'ユーザー'}</button></header>
      <section className="chat-area">
        {!activeChat ? <div className="welcome"><div className="logo-placeholder">somenAI</div><h1>何をお手伝いしようか？</h1><p>新しいチャットを始めよう</p><button className="primary-button welcome-button" onClick={newChat}>＋ 新しいチャット</button></div> : <div className="messages">{messages.map(m => <article className={`message ${m.role}`} key={m.id}><div className="message-role">{m.role==='user'?'あなた':'somenAI'}</div><div className="message-content">{m.content}</div></article>)}{sending&&<article className="message assistant"><div className="message-role">somenAI</div><div className="typing"><i></i><i></i><i></i></div></article>}<div ref={bottomRef}/></div>}
      </section>
      {error&&<div className="error-inline">{error}</div>}
      <form className="composer" onSubmit={send}><button type="button" className="attach-button">＋</button><textarea value={message} onChange={e=>setMessage(e.target.value)} placeholder="メッセージを入力…" rows={1} disabled={!activeChat||sending} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send(e);}}}/><button type="submit" className="send-button" disabled={!message.trim()||!activeChat||sending}>↑</button></form>
      <div className="disclaimer">somenAI • {user.username} でログイン中</div>
    </main>
  </div>;
}

function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  useEffect(() => { api('/api/me').then(d=>setUser(d.user)).catch(()=>{}).finally(()=>setChecking(false)); }, []);
  if (checking) return <div className="loading-screen"><div className="loading-logo">somenAI</div></div>;
  return user ? <ChatApp user={user} onLogout={()=>setUser(null)} /> : <AuthScreen onLogin={setUser} />;
}

createRoot(document.getElementById('root')).render(<App />);

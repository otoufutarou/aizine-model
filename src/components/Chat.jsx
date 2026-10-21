import { useEffect, useRef, useState } from 'react';

const CHIPS = ['ガーリーにして', 'モードにして', 'ピースして', '夜の背景', 'おまかせ', 'くるくる回って'];

const AI_LABEL = {
  off: '💬 AIとおしゃべり（β・約1GB）',
  unsupported: 'この端末ではAIおしゃべり非対応（WebGPUなし）',
  error: '読み込み失敗。もう一度試す',
};

export function Chat({ messages, onSend, ai, onEnableAi }) {
  const [text, setText] = useState('');
  const endRef = useRef(null);

  useEffect(() => {
    const el = endRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const submit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSend(text);
    setText('');
  };

  return (
    <div className="chat">
      <div className="chat-log" ref={endRef} aria-live="polite">
        {messages.map((m) => (
          <div key={m.id} className={`bubble ${m.from}`}>
            {m.from === 'aira' && <span className="avatar-dot">A</span>}
            <p>{m.text}</p>
          </div>
        ))}
      </div>
      {ai.status !== 'ready' && (
        <button type="button" className="ai-btn" disabled={ai.status === 'loading' || ai.status === 'unsupported'} onClick={onEnableAi}>
          {ai.status === 'loading' ? `AIを読み込み中… ${Math.round(ai.progress * 100)}%` : AI_LABEL[ai.status]}
        </button>
      )}
      <div className="chips">
        {CHIPS.map((c) => (
          <button key={c} type="button" onClick={() => onSend(c)}>{c}</button>
        ))}
      </div>
      <form onSubmit={submit} className="chat-form">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="例：ガーリーにして / ピースして"
          aria-label="AIRAへのメッセージ"
          enterKeyHint="send"
          autoComplete="off"
        />
        <button type="submit">送信</button>
      </form>
    </div>
  );
}

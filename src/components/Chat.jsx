import { useEffect, useRef, useState } from 'react';

const CHIPS = ['ガーリーにして', 'モードにして', 'ピースして', '夜の背景', 'おまかせ', 'くるくる回って'];

export function Chat({ messages, onSend }) {
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

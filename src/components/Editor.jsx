import { useEffect, useMemo, useState } from 'react';
import { DEFAULT_PERSONA, checkPost } from '../editor/persona.js';

const KEY = 'aira-persona-v1';
const ICON = { ok: '✓', warn: '!', fail: '✕' };

const load = () => {
  try {
    return { ...DEFAULT_PERSONA, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') };
  } catch {
    return DEFAULT_PERSONA;
  }
};

export function Editor() {
  const [persona, setPersona] = useState(load);
  const [draft, setDraft] = useState('');
  const result = useMemo(() => checkPost(persona, draft), [persona, draft]);
  const set = (k) => (e) => setPersona((p) => ({ ...p, [k]: e.target.value }));

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(persona));
  }, [persona]);

  return (
    <div className="editor">
      <h3>1. 人格を決める</h3>
      <label>考え方・人柄<textarea rows="3" value={persona.mind} onChange={set('mind')} /></label>
      <label>口調
        <select value={persona.tone} onChange={set('tone')}>
          <option value="casual">タメ口</option>
          <option value="polite">です・ます</option>
        </select>
      </label>
      <label>語尾（カンマ区切り）<input value={persona.endings} onChange={set('endings')} /></label>
      <label>好きなもの・世界観ワード<input value={persona.likes} onChange={set('likes')} /></label>
      <label>NGワード<input value={persona.ngWords} onChange={set('ngWords')} /></label>
      <div className="row">
        <label>最大文字数<input type="number" min="10" value={persona.maxLen} onChange={(e) => setPersona((p) => ({ ...p, maxLen: Number(e.target.value) || 90 }))} /></label>
        <label>絵文字の上限<input type="number" min="0" value={persona.maxEmoji} onChange={(e) => setPersona((p) => ({ ...p, maxEmoji: Number(e.target.value) || 0 }))} /></label>
      </div>
      <h3>2. 投稿案をチェック</h3>
      <textarea className="draft" rows="3" placeholder={`${persona.name}の投稿案を入力`} value={draft} onChange={(e) => setDraft(e.target.value)} />
      {draft.trim() && (
        <div className="result">
          <div className={`score ${result.score >= 80 ? 'good' : result.score >= 60 ? 'mid' : 'low'}`}>世界観スコア <b>{result.score}</b>/100</div>
          <ul>
            {result.checks.map((c) => (
              <li key={c.id} className={c.status}><i>{ICON[c.status]}</i><b>{c.label}</b> {c.detail}</li>
            ))}
          </ul>
          {result.hints.map((h) => <p key={h} className="hint">💡 {h}</p>)}
        </div>
      )}
      <p className="note">ルールベースの簡易チェックです。バズの予測ではなく、キャラの一貫性の目安です。設定はこのブラウザに保存されます。</p>
    </div>
  );
}

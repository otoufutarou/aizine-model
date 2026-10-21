import { useEffect, useMemo, useState } from 'react';
import { DEFAULT_PERSONA, checkPost } from '../editor/persona.js';
import { AXES, matchClients, buildRoadmap, planText, verdict } from '../editor/clients.js';

const KEY = 'aira-persona-v1';
const ICON = { ok: '✓', warn: '!', fail: '✕' };
const STEPS = [
  { id: 'persona', label: '人物設計' },
  { id: 'match', label: '相性' },
  { id: 'roadmap', label: '展開' },
  { id: 'check', label: '投稿チェック' },
  { id: 'try', label: 'お試し会話' },
];

const load = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? '{}');
    return { ...DEFAULT_PERSONA, ...saved, axes: { ...DEFAULT_PERSONA.axes, ...saved.axes } };
  } catch {
    return DEFAULT_PERSONA;
  }
};

const tone = (score) => (score >= 75 ? 'good' : score >= 55 ? 'mid' : 'low');

export function Editor({ chat }) {
  const [persona, setPersona] = useState(load);
  const [step, setStep] = useState('persona');
  const [draft, setDraft] = useState('');
  const [copied, setCopied] = useState(false);

  const matches = useMemo(() => matchClients(persona), [persona]);
  const roadmap = useMemo(() => buildRoadmap(persona, matches), [persona, matches]);
  const result = useMemo(() => checkPost(persona, draft), [persona, draft]);
  const set = (k) => (e) => setPersona((p) => ({ ...p, [k]: e.target.value }));
  const setAxis = (id) => (e) => setPersona((p) => ({ ...p, axes: { ...p.axes, [id]: Number(e.target.value) } }));

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(persona));
  }, [persona]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(planText(persona, matches, roadmap));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="editor">
      <nav className="steps">
        {STEPS.map((s) => (
          <button key={s.id} className={step === s.id ? 'active' : ''} onClick={() => setStep(s.id)}>{s.label}</button>
        ))}
      </nav>

      {step === 'persona' && (
        <>
          <label>名前<input value={persona.name} onChange={set('name')} /></label>
          <label>考え方・人柄<textarea rows="3" value={persona.mind} onChange={set('mind')} /></label>
          <h3>性格の軸（相性判定に使います）</h3>
          {AXES.map((a) => (
            <label key={a.id} className="axis">
              <span>{a.label}<b>{persona.axes[a.id]}</b></span>
              <input type="range" min="0" max="100" step="5" value={persona.axes[a.id]} onChange={setAxis(a.id)} />
              <em><i>{a.lo}</i><i>{a.hi}</i></em>
            </label>
          ))}
          <h3>話し方・世界観</h3>
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
          <button className="primary" onClick={() => setStep('match')}>この人物で相性を見る →</button>
        </>
      )}

      {step === 'match' && (
        <>
          <p className="lead">{persona.name}と相性のよい広告業種（スコアが高い順）</p>
          {matches.map((m, i) => (
            <article key={m.id} className={`match ${tone(m.score)}`}>
              <header><span>{i + 1}</span><h4>{m.name}</h4><b>{m.score}</b><em>{verdict(m.score)}</em></header>
              <div className="bar"><i style={{ width: `${m.score}%` }} /></div>
              {m.reasons.map((r) => <p key={r} className="why">◎ {r}</p>)}
              <p className="how">見せ方: {m.fit}</p>
              {m.cautions.map((r) => <p key={r} className="warn-line">! {r}</p>)}
            </article>
          ))}
          <button className="primary" onClick={() => setStep('roadmap')}>広告展開の道筋を見る →</button>
        </>
      )}

      {step === 'roadmap' && (
        <>
          <p className="lead">{persona.name}の展開ロードマップ（上位3業種から自動で作成）</p>
          {roadmap.map((r) => (
            <article key={r.phase} className="phase">
              <header><h4>{r.phase}</h4><em>{r.term}</em></header>
              <p className="goal">{r.goal}</p>
              <ul>{r.actions.map((a) => <li key={a}>{a}</li>)}</ul>
              <p className="kpi">KPI: {r.kpi}</p>
            </article>
          ))}
          <button className="primary" onClick={copy}>{copied ? 'コピーしました ✓' : '企画シートをコピー'}</button>
        </>
      )}

      {step === 'check' && (
        <>
          <p className="lead">投稿案が{persona.name}の世界観に合っているか確認します</p>
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
        </>
      )}

      {step === 'try' && chat}

      <p className="note">ルールベースの仮説整理ツールです。業種データはサンプルで、バズや成果の予測ではありません。設定はこのブラウザに保存されます。</p>
    </div>
  );
}

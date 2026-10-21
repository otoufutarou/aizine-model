import { useCallback, useState } from 'react';
import { Stage } from './components/Stage.jsx';
import { Picker } from './components/Picker.jsx';
import { Chat } from './components/Chat.jsx';
import { OUTFITS, DEFAULT_OUTFIT } from './data/outfits.js';
import { POSES, DEFAULT_POSE } from './data/poses.js';
import { EXPRESSIONS, DEFAULT_EXPRESSION } from './avatar/expressions.js';
import { faceCanvas } from './avatar/textures.js';
import { BACKGROUNDS, DEFAULT_BG } from './data/backgrounds.js';
import { parseCommand } from './chat/parser.js';

const TABS = [
  { id: 'outfit', label: '衣装', en: 'LOOK' },
  { id: 'pose', label: 'ポーズ', en: 'POSE' },
  { id: 'face', label: '表情', en: 'FACE' },
  { id: 'bg', label: '背景', en: 'SET' },
  { id: 'chat', label: 'チャット', en: 'CHAT' },
];

const Swatches = ({ colors }) => (
  <span className="swatches">{colors.map((c) => <i key={c} style={{ background: c }} />)}</span>
);

let nextId = 1;
const msg = (from, text) => ({ id: nextId++, from, text });

export default function App() {
  const [outfit, setOutfit] = useState(DEFAULT_OUTFIT);
  const [pose, setPose] = useState(DEFAULT_POSE);
  const [expression, setExpression] = useState(DEFAULT_EXPRESSION);
  const [compare, setCompare] = useState(false);
  const [bg, setBg] = useState(DEFAULT_BG);
  const [spin, setSpin] = useState(false);
  const [closeUp, setCloseUp] = useState(false);
  const [tab, setTab] = useState('outfit');
  const [messages, setMessages] = useState(() => [
    msg('aira', 'はじめまして、AIRAだよ♡ 「ガーリーにして」「ピースして」「夜の背景」みたいに話しかけてね！'),
  ]);

  const send = useCallback((text) => {
    const { actions, lines } = parseCommand(text, undefined, { outfit });
    actions.forEach((a) => {
      if (a.type === 'outfit') setOutfit(a.id);
      if (a.type === 'pose') setPose(a.id);
      if (a.type === 'expression') setExpression(a.id);
      if (a.type === 'bg') setBg(a.id);
      if (a.type === 'spin') setSpin(a.value);
      if (a.type === 'reset') {
        setOutfit(DEFAULT_OUTFIT);
        setPose(DEFAULT_POSE);
        setExpression(DEFAULT_EXPRESSION);
        setBg(DEFAULT_BG);
        setSpin(false);
      }
    });
    setMessages((m) => [...m, msg('user', text), ...lines.map((l) => msg('aira', l))]);
  }, [outfit]);

  return (
    <div className="app">
      <header className="top">
        <div className="logo">
          <span className="logo-main">AIRA</span>
          <span className="logo-sub">FASHION STUDIO</span>
        </div>
        <div className="sticker">VIRTUAL<br />ISSUE 01</div>
      </header>

      <main className="layout">
        <section className="stage-wrap">
          <Stage outfitId={outfit} poseId={pose} expressionId={expression} bgId={bg} autoRotate={spin} closeUp={closeUp} />
          <div className="profile">
            <b>AIRA</b> <span>20歳 / VIRTUAL MODEL</span>
          </div>
          <button type="button" className={`spin ${spin ? 'on' : ''}`} onClick={() => setSpin((s) => !s)}>
            ⟳ 360°
          </button>
          <button type="button" className={`spin face-btn ${closeUp ? 'on' : ''}`} onClick={() => setCloseUp((c) => !c)}>
            ☺ FACE
          </button>
          <button type="button" className={`spin compare-btn ${compare ? 'on' : ''}`} onClick={() => setCompare((c) => !c)}>
            ▦ 4FACES
          </button>
          {compare && (
            <div className="compare" role="dialog" aria-label="表情比較">
              {EXPRESSIONS.map((e) => (
                <figure key={e.id} className={e.id === expression ? 'on' : ''}>
                  <img src={faceCanvas(e.id).toDataURL()} alt={e.name} />
                  <figcaption><small>{e.en}</small>{e.name}</figcaption>
                </figure>
              ))}
            </div>
          )}
        </section>

        <aside className="panel">
          <nav className="tabs" role="tablist">
            {TABS.map((t) => (
              <button key={t.id} role="tab" aria-selected={tab === t.id} className={tab === t.id ? 'active' : ''} onClick={() => setTab(t.id)}>
                <small>{t.en}</small>
                {t.label}
              </button>
            ))}
          </nav>
          <div className="tab-body">
            {tab === 'outfit' && (
              <Picker items={OUTFITS} value={outfit} onChange={setOutfit} render={(o) => (<><span className="card-desc">{o.desc}</span><Swatches colors={o.swatch} /></>)} />
            )}
            {tab === 'pose' && (
              <Picker items={POSES} value={pose} onChange={setPose} render={() => null} />
            )}
            {tab === 'face' && (
              <Picker items={EXPRESSIONS} value={expression} onChange={setExpression} render={() => null} />
            )}
            {tab === 'bg' && (
              <Picker items={BACKGROUNDS} value={bg} onChange={setBg} render={(b) => <Swatches colors={b.swatch} />} />
            )}
            {tab === 'chat' && <Chat messages={messages} onSend={send} />}
          </div>
        </aside>
      </main>
    </div>
  );
}

import { useCallback, useRef, useState } from 'react';
import { Stage } from './components/Stage.jsx';
import { Picker } from './components/Picker.jsx';
import { Chat } from './components/Chat.jsx';
import { Editor } from './components/Editor.jsx';
import { OUTFITS, DEFAULT_OUTFIT } from './data/outfits.js';
import { POSES, DEFAULT_POSE } from './data/poses.js';
import { EXPRESSIONS, DEFAULT_EXPRESSION } from './avatar/expressions.js';
import { faceCanvas } from './avatar/textures.js';
import { BACKGROUNDS, DEFAULT_BG } from './data/backgrounds.js';
import { parseCommand } from './chat/parser.js';
import { loadEngine, streamReply, webgpuSupported } from './chat/llm.js';
import { getOutfit } from './data/outfits.js';
import { getPose } from './data/poses.js';

const TABS = [
  { id: 'outfit', label: '衣装', en: 'LOOK' },
  { id: 'pose', label: 'ポーズ', en: 'POSE' },
  { id: 'face', label: '表情', en: 'FACE' },
  { id: 'bg', label: '背景', en: 'SET' },
  { id: 'editor', label: '編集部', en: 'DESK' },
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

  const [ai, setAi] = useState({ status: webgpuSupported() ? 'off' : 'unsupported', progress: 0 });
  const engine = useRef(null);
  const history = useRef([]);

  const enableAi = useCallback(async () => {
    setAi({ status: 'loading', progress: 0 });
    try {
      engine.current = await loadEngine((progress) => setAi({ status: 'loading', progress }));
      setAi({ status: 'ready', progress: 1 });
      setMessages((m) => [...m, msg('aira', 'おしゃべりモードON♡ 好きなこと話しかけてね！（着替えは今までどおり「ガーリーにして」でOK）')]);
    } catch {
      setAi({ status: 'error', progress: 0 });
    }
  }, []);

  const chatWithAi = useCallback(async (text) => {
    const id = nextId++;
    setMessages((m) => [...m, { id, from: 'aira', text: '…' }]);
    history.current.push({ role: 'user', content: text });
    const set = (t) => setMessages((m) => m.map((x) => (x.id === id ? { ...x, text: t } : x)));
    try {
      const out = await streamReply(engine.current, history.current, { outfitName: getOutfit(outfit).name, poseName: getPose(pose).name }, set);
      history.current.push({ role: 'assistant', content: out });
      if (!out) set('えへへ、もう一回言って？');
    } catch {
      history.current.pop();
      set('ごめん、うまく答えられなかった…。もう一回言ってみて！');
    }
  }, [outfit, pose]);

  const send = useCallback((text) => {
    const { actions, lines, unknown } = parseCommand(text, undefined, { outfit });
    if (unknown && ai.status === 'ready') {
      setMessages((m) => [...m, msg('user', text)]);
      chatWithAi(text);
      return;
    }
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
  }, [outfit, ai.status, chatWithAi]);

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
            {tab === 'editor' && <Editor chat={<Chat messages={messages} onSend={send} ai={ai} onEnableAi={enableAi} />} />}
          </div>
        </aside>
      </main>
    </div>
  );
}

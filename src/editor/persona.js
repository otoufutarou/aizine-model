// Editor-facing persona definition and a rule-based "world view" check for draft posts.
// Everything is deterministic and runs in the browser; scores are a guide for editors, not a reach forecast.

export const DEFAULT_PERSONA = {
  name: 'AIRA',
  mind: '20歳。トレンドは好きだけど流されず、自分の「好き」を大事にする。努力は見せず、さらっとおしゃれを楽しむ。',
  tone: 'casual',
  endings: 'よ,ね,かな,だよ,♡,！',
  likes: 'ストリート,厚底,シルバー,ピンク,抜け感,差し色,スニーカー,お気に入り',
  ngWords: '絶対,最安,No.1,必ず痩せ,他社',
  maxLen: 90,
  maxEmoji: 2,
};

export const splitList = (s) => String(s ?? '').split(/[,、\n]/).map((x) => x.trim()).filter(Boolean);

const POLITE = /(です|ます|ません|でした|ました|ください)[。！!♡]?\s*$/;
const EMOJI = /\p{Extended_Pictographic}|[♡♥★☆♪]/gu;
const HOOK = /[?？]|みんな|教えて|どっち|どれ|一緒に|#\S+/;

const check = (id, label, status, detail) => ({ id, label, status, detail });

export function checkPost(persona, text) {
  const t = String(text ?? '').trim();
  if (!t) return { score: 0, checks: [], hints: [] };

  const ng = splitList(persona.ngWords).filter((w) => t.includes(w));
  const likes = splitList(persona.likes).filter((w) => t.includes(w));
  const endings = splitList(persona.endings);
  const emoji = (t.match(EMOJI) ?? []).length;
  const lastSentence = t.split(/[。\n]/).filter(Boolean).pop() ?? t;
  const politeMismatch = persona.tone === 'casual' && POLITE.test(lastSentence.trim());
  const endingHit = endings.some((e) => lastSentence.trim().endsWith(e) || lastSentence.includes(e));

  const checks = [
    ng.length ? check('ng', 'NGワード', 'fail', `「${ng.join('」「')}」は使わない設定です`) : check('ng', 'NGワード', 'ok', '問題なし'),
    politeMismatch
      ? check('tone', '口調', 'fail', `${persona.name}はタメ口の設定です。です・ます調になっています`)
      : endingHit
        ? check('tone', '口調', 'ok', '設定した語尾が入っています')
        : check('tone', '口調', 'warn', '設定した語尾（' + endings.slice(0, 3).join('・') + '…）が見当たりません'),
    likes.length ? check('likes', '世界観ワード', 'ok', `「${likes.join('」「')}」`) : check('likes', '世界観ワード', 'warn', '好きなもの・世界観のワードが入っていません'),
    t.length <= persona.maxLen ? check('len', '長さ', 'ok', `${t.length}字（上限${persona.maxLen}字）`) : check('len', '長さ', 'warn', `${t.length}字。上限${persona.maxLen}字を超えています`),
    emoji <= persona.maxEmoji ? check('emoji', '絵文字・記号', 'ok', `${emoji}個`) : check('emoji', '絵文字・記号', 'warn', `${emoji}個。多めです（上限${persona.maxEmoji}個）`),
  ];

  const points = { ok: 1, warn: 0.5, fail: 0 };
  const weight = { ng: 30, tone: 25, likes: 20, len: 10, emoji: 15 };
  let score = Math.round(checks.reduce((sum, c) => sum + weight[c.id] * points[c.status], 0));
  if (ng.length) score = Math.min(score, 40);

  const hints = [];
  if (ng.length) hints.push('NGワードを言い換えましょう。');
  if (politeMismatch) hints.push('「〜です」を「〜だよ」「〜なの」にするとキャラに合います。');
  if (!likes.length) hints.push(`「${splitList(persona.likes).slice(0, 3).join('」「')}」などを1つ入れると世界観が伝わります。`);
  if (!HOOK.test(t)) hints.push('反応のきっかけに、問いかけ（「どっち派？」）やハッシュタグを足すのも手です（効果は実測で確認を）。');
  return { score, checks, hints };
}

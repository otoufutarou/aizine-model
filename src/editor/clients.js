// Persona -> advertiser-category fit -> rollout roadmap.
// Rule-based hypothesis tool: category profiles are editable sample data, not market statistics.

export const AXES = [
  { id: 'trend', label: 'トレンド感', lo: '定番', hi: '最先端' },
  { id: 'friendly', label: '親しみやすさ', lo: '憧れ', hi: '身近' },
  { id: 'mature', label: '大人っぽさ', lo: 'キュート', hi: '大人' },
  { id: 'edge', label: '個性・尖り', lo: '万人受け', hi: '尖り' },
  { id: 'active', label: 'アクティブさ', lo: 'おうち派', hi: '外向き' },
];

// profile: the persona traits the category usually expects (0-100). weight: how much each axis matters.
export const CATEGORIES = [
  {
    id: 'fashion', name: 'アパレル・ファッション', profile: [85, 60, 50, 70, 60], weight: [3, 1, 1, 2, 1],
    fit: '着こなし投稿やコーデ企画で、着ている理由まで語らせる', risk: '他ブランドとの併用・競合ブランドの扱いを事前に決める',
  },
  {
    id: 'cosme', name: 'コスメ・スキンケア', profile: [80, 75, 45, 45, 55], weight: [2, 2, 1, 1, 1],
    fit: '「使ってみた」「推しカラー」など日常の延長で見せる', risk: '効能の断定表現（法規）と、PR表記の徹底',
  },
  {
    id: 'sneaker', name: 'スニーカー・スポーツ', profile: [75, 60, 40, 70, 90], weight: [1, 1, 1, 2, 3],
    fit: '外出・ライブ・運動のシーンに足元として登場させる', risk: '「運動が苦手」など設定と矛盾しないようにする',
  },
  {
    id: 'entertainment', name: '音楽・映像・ゲーム', profile: [85, 65, 40, 75, 50], weight: [2, 1, 1, 3, 1],
    fit: '好きな作品への反応や推し活の語りで、ファンと同じ目線に立つ', risk: '作品の世界観とキャラの口調のズレ',
  },
  {
    id: 'gadget', name: 'スマホ・ガジェット', profile: [80, 55, 55, 55, 65], weight: [3, 1, 1, 1, 1],
    fit: '撮影・加工・持ち歩きなど、使うシーンを具体的に見せる', risk: '性能の比較や数値の言い切り',
  },
  {
    id: 'drink', name: '飲料・お菓子', profile: [60, 85, 35, 35, 70], weight: [1, 3, 1, 1, 1],
    fit: 'ひと息つく場面や差し入れなど、身近なシーンで登場', risk: '健康・ダイエットを連想させる表現',
  },
  {
    id: 'food', name: '外食・食品', profile: [55, 80, 50, 25, 70], weight: [1, 3, 1, 2, 1],
    fit: '友だちとの外食や「今日のごはん」で自然に見せる', risk: '食の好みが固定されるため、設定との整合を管理',
  },
  {
    id: 'travel', name: '旅行・ホテル', profile: [55, 60, 65, 30, 85], weight: [1, 1, 2, 1, 3],
    fit: '旅の準備や持ち物、現地での一日を連載のように見せる', risk: '実在の場所の演出は許諾と表現の確認が必要',
  },
  {
    id: 'finance', name: '金融・保険・サブスク', profile: [35, 50, 75, 10, 50], weight: [2, 1, 3, 3, 1],
    fit: '若い世代の「はじめて」を応援する立ち位置なら成立', risk: '尖った人格だと信頼性の面で不一致になりやすい',
  },
];

const dir = (diff) => (diff > 0 ? '高め' : '低め');

export function matchClients(persona) {
  const traits = AXES.map((a) => persona.axes?.[a.id] ?? 50);
  return CATEGORIES.map((c) => {
    const wsum = c.weight.reduce((a, b) => a + b, 0);
    const dist = c.weight.reduce((s, w, i) => s + w * Math.abs(traits[i] - c.profile[i]), 0) / wsum;
    const score = Math.max(0, Math.min(100, Math.round(100 - dist * 1.3)));

    const rows = AXES.map((a, i) => ({ a, diff: traits[i] - c.profile[i], gap: Math.abs(traits[i] - c.profile[i]), w: c.weight[i] }));
    const good = rows.filter((r) => r.gap <= 15).sort((x, y) => y.w - x.w || x.gap - y.gap).slice(0, 2);
    const worst = rows.filter((r) => r.gap > 25).sort((x, y) => y.gap * y.w - x.gap * x.w)[0];

    const reasons = good.map((r) => `「${r.a.label}」がこの業種の期待と近い`);
    const cautions = [];
    if (worst) cautions.push(`「${worst.a.label}」がこの業種の想定より${dir(worst.diff)}（差${worst.gap}）`);
    cautions.push(c.risk);
    return { ...c, score, reasons, cautions };
  }).sort((a, b) => b.score - a.score);
}

export const verdict = (score) => (score >= 75 ? '相性◎' : score >= 55 ? '工夫次第' : '慎重に');

export function buildRoadmap(persona, matches) {
  const [a, b, c] = matches;
  const likes = String(persona.likes).split(/[,、]/).map((s) => s.trim()).filter(Boolean).slice(0, 3).join('・');
  return [
    {
      phase: '1. 認知', term: '0〜3か月',
      goal: `${persona.name}の世界観を固める。広告は入れない`,
      actions: [`誌面とSNSで日常投稿（「${likes}」を軸に）`, 'プロフィールと口調のルールを固定し、チェックで一貫性を保つ', '読者の反応が多い話題を記録する'],
      kpi: 'フォロワー数・保存率・コメントの質',
    },
    {
      phase: '2. 共感', term: '3〜6か月',
      goal: '読者との関係を作り、私物として商品が自然に登場する土台を作る',
      actions: ['「どっち派？」など読者参加の企画', `${a.name}系のアイテムを私物として登場（広告表記なし・提供なしを明示）`, '企画ごとの反応を比較して、人物の軸を微調整する'],
      kpi: '参加数・シェア数・好意的コメント比率',
    },
    {
      phase: '3. タイアップ', term: '6〜12か月',
      goal: '最も相性の高い業種で、最初の広告展開を行う',
      actions: [`第1候補: ${a.name}（${a.fit}）`, `第2候補: ${b.name}（${b.fit}）`, 'PR表記と事前ルール（NG・競合）を契約前に確定する'],
      kpi: '広告主の指標（認知・購入意向）・好感度の変化',
    },
    {
      phase: '4. 拡張', term: '12か月〜',
      goal: '業種を広げ、出版社のIP展開と広告を両立させる',
      actions: [`${c.name}などへ業種を拡大`, 'グッズ・イベント・別媒体など、IPとしての展開を検討', '実績データで相性判定を補正する'],
      kpi: '案件数・継続率・IP関連収益',
    },
  ];
}

export function planText(persona, matches, roadmap) {
  const top = matches.slice(0, 3).map((m, i) => `${i + 1}. ${m.name}（${m.score}点・${verdict(m.score)}）\n   見せ方: ${m.fit}\n   注意: ${m.cautions.join(' / ')}`).join('\n');
  const rm = roadmap.map((r) => `${r.phase}（${r.term}）\n  目的: ${r.goal}\n${r.actions.map((x) => `  - ${x}`).join('\n')}\n  KPI: ${r.kpi}`).join('\n');
  const axes = AXES.map((a) => `${a.label}: ${persona.axes?.[a.id] ?? 50}`).join(' / ');
  return `【${persona.name} 企画シート】\n人物: ${persona.mind}\n軸: ${axes}\n\n■相性の高い業種\n${top}\n\n■展開ロードマップ\n${rm}\n\n※仮説整理用のたたき台です。実績データで補正してください。`;
}

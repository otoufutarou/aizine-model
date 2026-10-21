// Optional in-browser chat model (WebLLM, runs on WebGPU; no server, no API key).
// Loaded lazily so the normal site stays small. Keyword commands never go through the model.

export const LLM_MODEL = 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC';

export const webgpuSupported = () => typeof navigator !== 'undefined' && 'gpu' in navigator;

export function buildSystemPrompt({ outfitName, poseName }) {
  return [
    'あなたは「AIRA」。20歳の日本人バーチャルモデルで、ファッションが大好きなZ世代の女の子です。',
    '口調は明るくてフレンドリーなタメ口。1〜2文の短い返事で、絵文字は♡か♪を多くても1つだけ使う。',
    'Z世代ファッション誌のようなトレンド（Kストリート、Y2Kギャル、スポーツMIX、シティモード、抜け感、差し色、小物）の話が得意。',
    `いまの衣装は「${outfitName}」、ポーズは「${poseName}」。`,
    '着替えやポーズの変更を頼まれたら「『ガーリーにして』のように言ってね」と案内する。',
    '個人情報は聞かない。医療・政治・恋愛相談などの重い話は、やさしくファッションの話に戻す。',
  ].join('\n');
}

let enginePromise = null;

export function loadEngine(onProgress) {
  if (!enginePromise) {
    enginePromise = import('@mlc-ai/web-llm')
      .then(({ CreateMLCEngine }) => CreateMLCEngine(LLM_MODEL, { initProgressCallback: (p) => onProgress?.(p.progress ?? 0, p.text) }))
      .catch((e) => {
        enginePromise = null;
        throw e;
      });
  }
  return enginePromise;
}

export async function streamReply(engine, history, ctx, onText) {
  const messages = [{ role: 'system', content: buildSystemPrompt(ctx) }, ...history.slice(-8)];
  const chunks = await engine.chat.completions.create({ messages, stream: true, max_tokens: 120, temperature: 0.8 });
  let out = '';
  for await (const c of chunks) {
    out += c.choices[0]?.delta?.content ?? '';
    onText(out);
  }
  return out.trim();
}

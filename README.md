# AIRA Fashion Studio

React + Vite + Three.js + React Three Fiber で作った 3D ファッションスタジオ。
20歳の架空のバーチャルモデル **AIRA**（4.5頭身ローポリ・ダークブラウンのロングヘア・黄色い市松ビーニー・手描き風の目とつり眉・頬の「///」）を、ブラウザ上で着せ替え・ポーズ・背景チェンジできます。
外部 API・有料 AI は不使用（チャットはブラウザ内のキーワード解析）。静的ファイルのみなので GitHub Pages で公開できます。

## 機能

- 3D アバター表示（ドラッグで回転 / ピンチ・ホイールでズーム / 360° ボタンで自動回転）
- 衣装 3 種：ストリート（初期：クロップドカーディガン・水色カーゴパンツ・厚底スニーカー）／ガーリー／モード
- ポーズに連動して表情が変わります（ピース＝ウィンク、バイバイ＝にっこり）
- ポーズ 5 種：スタンド・ピース・ハンドオンヒップ・バイバイ・ランウェイ
- 背景 4 種：ピンクスタジオ・ネオンナイト・シルバーランウェイ・ドリームポップ
- 日本語チャット（例：「ガーリーにして」「ピースして」「夜の背景」「おまかせ」「くるくる回って」「リセット」）
- スマートフォン対応（縦：上にステージ／下に操作パネル、横：左右分割）

## 実行方法

Node.js 18 以上が必要です。

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # チャット解析のテスト
npm run build    # dist/ に本番ビルド
npm run preview  # ビルド結果の確認
```

## GitHub Pages で公開

`vite.config.js` は `base: './'` のため、リポジトリ名を問わずサブパスで動作します。

1. このリポジトリを GitHub に push（デフォルトブランチ `main`）。
2. GitHub の **Settings → Pages → Build and deployment → Source** を **GitHub Actions** にする。
3. `main` に push すると `.github/workflows/deploy.yml` がテスト・ビルド・デプロイを実行。
4. `https://<ユーザー名>.github.io/<リポジトリ名>/` で公開されます。

手動デプロイする場合は `npm run build` 後に `dist/` を公開ブランチ（例：`gh-pages`）へ配置してください。

## 構成

```
src/
  config.js                  GLB モデルの URL 設定（null = 仮アバター）
  data/outfits|poses|backgrounds.js   衣装・ポーズ・背景の定義
  chat/parser.js             日本語キーワード解析（外部通信なし）
  avatar/
    Avatar.jsx               仮アバター / GLB の切替
    ProceduralAvatar.jsx, Head.jsx   Three.js 基本形状の仮アバター
    GLBAvatar.jsx            GLB アバター
    useRig.js                関節名ベースのポーズ駆動（両アバター共通）
  components/                Stage(3D)・Picker・Chat
tests/parser.test.js
```

## GLB モデルへの差し替え

1. `public/models/aira.glb` を置く。
2. `src/config.js` を `export const AVATAR_MODEL_URL = `${import.meta.env.BASE_URL}models/aira.glb`;` に変更。
3. GLB は次の規約に従うこと：
   - **関節ノード名**：`hips, spine, chest, neck, head, shoulderL, elbowL, shoulderR, elbowR, thighL, kneeL, thighR, kneeR`
     （キャラクターは +Z 向き、足元が y=0、`L` は +X 側）。ポーズは `src/data/poses.js` の回転値で駆動されます。
   - **衣装ノード名**：`<衣装ID>_<任意>`（例 `street_top`, `girly_skirt`, `mode_coat`）。選択中の衣装のノードだけ表示されます。衣装 ID は `street / girly / mode`。
4. 衣装やポーズの追加は `src/data/` の配列にエントリを足し、チャットのキーワードは `src/chat/parser.js` に追記します。

## 備考

ロゴ・デザインはすべてオリジナルで、既存ブランドのロゴは使用していません。

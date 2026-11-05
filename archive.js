// 雑誌アーカイブのサンプルデータ（デモ用の架空エントリ。実運用では雑誌社のアーカイブDBに差し替える）。
// slot: morning / lunch / afternoon / evening / night
import { MAGS, ASSIGN } from './magazines.js';
import { EXTRA_ITEMS, EXTRA_ASSIGN } from './catalog.js';

const RAW = [
  { id: 'a01', mag: 'BRUTUS', issue: '喫茶店特集', kind: 'spot', slot: 'morning', tags: ['cafe', 'solo'], emoji: '☕', title: '朝8時から開く純喫茶で、モーニングを', body: '昭和のままの窓際席とたまごサンド。本を一冊持っていきたい静けさ。', area: '神保町', minutes: 60 },
  { id: 'a02', mag: 'BRUTUS', issue: '本屋特集', kind: 'spot', slot: 'afternoon', tags: ['book', 'solo', 'shop'], emoji: '📚', title: '店主の選書が光る小さな本屋へ', body: '一冊だけ買って帰る。装丁の話ができる店主がいる。', area: '下北沢', minutes: 60 },
  { id: 'a03', mag: 'POPEYE', issue: 'シティボーイ特集', kind: 'spot', slot: 'afternoon', tags: ['shop', 'fashion'], emoji: '🛍️', title: '古着とヴィンテージ雑貨を巡る2時間', body: '一点ものを探して歩く。履き慣れたスニーカーで。', area: '高円寺', minutes: 120 },
  { id: 'a04', mag: 'POPEYE', issue: '公園特集', kind: 'spot', slot: 'lunch', tags: ['park', 'solo', 'date'], emoji: '🌳', title: '公園ベンチでパンのランチ', body: '近所のベーカリーで買って、木陰で食べる。', area: '代々木公園', minutes: 60 },
  { id: 'a05', mag: 'VOCE', issue: 'ご褒美ケア特集', kind: 'spot', slot: 'afternoon', tags: ['beauty', 'solo'], emoji: '💆', title: '予定の合間に、60分のヘッドスパ', body: '頭皮をほぐすと顔まで明るくなる。夜の予定の前に。', area: '表参道', minutes: 60 },
  { id: 'a06', mag: 'VOCE', issue: 'デパコス特集', kind: 'spot', slot: 'afternoon', tags: ['beauty', 'shop'], emoji: '💄', title: '新作リップをカウンターで試す', body: 'BAさんに色の相談を。手の甲ではなく唇で確かめて。', area: '銀座', minutes: 45 },
  { id: 'a07', mag: 'dancyu', issue: '喫茶と甘味特集', kind: 'spot', slot: 'afternoon', tags: ['cafe', 'sweets', 'date'], emoji: '🍮', title: '老舗の固めプリンと深煎りコーヒー', body: '行列は14時台が狙い目。持ち帰りもできる。', area: '浅草', minutes: 60 },
  { id: 'a08', mag: 'dancyu', issue: '町中華特集', kind: 'spot', slot: 'lunch', tags: ['food', 'solo'], emoji: '🍜', title: '昼だけの中華そばと餃子', body: '午前11時の開店直後が空いている。', area: '荻窪', minutes: 60 },
  { id: 'a09', mag: 'dancyu', issue: '東京の夜ごはん', kind: 'spot', slot: 'evening', tags: ['food', 'date'], emoji: '🍷', title: 'カウンター8席のビストロで一杯', body: '一人でも二人でも居心地がいい。ワインはグラスで。', area: '恵比寿', minutes: 90 },
  { id: 'a10', mag: 'BRUTUS', issue: '映画館特集', kind: 'spot', slot: 'evening', tags: ['movie', 'date', 'solo'], emoji: '🎬', title: '名画座のレイトショー', body: '二本立てのうち一本だけ観て帰るのも贅沢。', area: '池袋', minutes: 120 },
  { id: 'a11', mag: 'POPEYE', issue: '銭湯特集', kind: 'spot', slot: 'night', tags: ['relax', 'solo', 'sport'], emoji: '♨️', title: '一日の終わりに銭湯とコーヒー牛乳', body: 'サウナ後の外気浴まで含めて90分。', area: '蒲田', minutes: 90 },
  { id: 'a12', mag: 'BRUTUS', issue: '美術館特集', kind: 'spot', slot: 'afternoon', tags: ['art', 'date', 'solo'], emoji: '🖼️', title: '小さな美術館で一点だけじっくり観る', body: '常設の一点に絞ると、帰り道まで余韻が残る。', area: '清澄白河', minutes: 90 },

  { id: 'e01', mag: 'BRUTUS', issue: '今月のアート', kind: 'spot', slot: 'afternoon', tags: ['event', 'art', 'date'], emoji: '🎨', title: '【開催中】現代の器展 ― 手で使う、日々のうつわ', body: '作家20人の新作を手に取れる展示即売。会期は今月末まで。', area: '代官山', minutes: 60, when: '今月末まで開催' },
  { id: 'e02', mag: 'POPEYE', issue: 'この秋のマーケット', kind: 'spot', slot: 'lunch', tags: ['event', 'food', 'park'], emoji: '🎪', title: '【週末】青空ブックマーケット＆コーヒー', body: '古本と焙煎所が集まる公園マーケット。雨天中止。', area: '駒沢公園', minutes: 90, when: '土日開催' },
  { id: 'e03', mag: 'dancyu', issue: '秋の酒と食', kind: 'spot', slot: 'evening', tags: ['event', 'food', 'wine'], emoji: '🍶', title: '【夜限定】日本酒と小皿の立ち飲みイベント', body: '蔵元が来場して直接注いでくれる。チケット制・当日券あり。', area: '中目黒', minutes: 90, when: '今週末 18時〜' },

  { id: 'g01', mag: 'dancyu', issue: '手土産特集', kind: 'gift', slot: 'any', tags: ['gift', 'sweets'], emoji: '🍪', title: '日持ちする焼き菓子の詰め合わせ', body: '個包装で分けやすい。年上の方にも間違いのない一箱。', area: '手土産', minutes: 0 },
  { id: 'g02', mag: 'dancyu', issue: '手土産特集', kind: 'gift', slot: 'any', tags: ['gift', 'wine'], emoji: '🍾', title: '自然派ワインとチーズのセット', body: '会食の後半に開けてもらえる、少し遊びのある手土産。', area: '手土産', minutes: 0 },
  { id: 'g03', mag: 'BRUTUS', issue: '手土産特集', kind: 'gift', slot: 'any', tags: ['gift', 'tea'], emoji: '🍵', title: '産地で選ぶ煎茶のミニ缶', body: '重くならず、相手の好みを選ばない。小さな栞つき。', area: '手土産', minutes: 0 },
  { id: 'g04', mag: 'VOCE', issue: '贈り物コスメ特集', kind: 'gift', slot: 'any', tags: ['gift', 'beauty', 'birthday'], emoji: '🧴', title: 'ハンドクリームの小さなギフト', body: '香りが穏やかで、誕生日のちょっとした一言にも。', area: '贈り物', minutes: 0 },
  { id: 'g05', mag: 'POPEYE', issue: '贈り物特集', kind: 'gift', slot: 'any', tags: ['gift', 'birthday'], emoji: '🎁', title: '文房具屋の限定ノート＋ペン', body: '「使ってね」で渡せる、気負わない誕生日プレゼント。', area: '贈り物', minutes: 0 },

  { id: 'b01', mag: 'POPEYE', issue: '海へ行こう', kind: 'goods', slot: 'any', tags: ['beach'], emoji: '🕶️', title: '海に持っていきたい偏光サングラス', body: '水面のぎらつきを抑える。軽くて失くしても諦めがつく値段。', area: '海のもの', minutes: 0 },
  { id: 'b02', mag: 'POPEYE', issue: '海へ行こう', kind: 'goods', slot: 'any', tags: ['beach'], emoji: '🧺', title: '砂がつかないレジャーシートとカゴ', body: 'はたくだけで砂が落ちる。帰りの車内が汚れない。', area: '海のもの', minutes: 0 },
  { id: 'b03', mag: 'VOCE', issue: '夏の紫外線対策', kind: 'goods', slot: 'any', tags: ['beach', 'beauty'], emoji: '🧴', title: '汗・水に強い日焼け止めとリップ', body: '塗り直しが楽なスティックタイプ。リップのUVも忘れずに。', area: '海のもの', minutes: 0 },

  { id: 't01', mag: 'BRUTUS', issue: '温泉と宿特集', kind: 'trip', slot: 'any', tags: ['trip', 'onsen'], emoji: '♨️', title: '2泊3日、箱根で「何もしない」', body: '朝は川沿いを散歩、昼は蕎麦、夜は部屋で本。宿は2〜3か月前が狙い目。', area: '箱根', minutes: 0 },
  { id: 't02', mag: 'POPEYE', issue: '島へ行く', kind: 'trip', slot: 'any', tags: ['trip', 'sea'], emoji: '🏝️', title: '週末、瀬戸内の島を自転車で', body: 'フェリーで渡って、島のカフェとミカン畑を巡る1泊2日。', area: '瀬戸内', minutes: 0 },
  { id: 't03', mag: 'dancyu', issue: '食べ歩き特集', kind: 'trip', slot: 'any', tags: ['trip', 'food'], emoji: '🍣', title: '金沢で市場と寿司をはしご', body: '朝は近江町市場、夜はカウンター。新幹線で日帰りも可能。', area: '金沢', minutes: 0 },
  { id: 'd01', mag: 'BRUTUS', issue: 'デート特集', kind: 'date', slot: 'any', tags: ['date', 'art'], emoji: '💑', title: '美術館→喫茶→ビストロの王道デート', body: '14時に美術館、16時に喫茶、19時にカウンターのビストロ。予約は1か月前から。', area: '清澄白河→恵比寿', minutes: 0 },
  { id: 'd02', mag: 'POPEYE', issue: 'デート特集', kind: 'date', slot: 'any', tags: ['date', 'park'], emoji: '🚲', title: '公園とレコード店を歩く昼デート', body: 'パンを買って公園で食べ、レコード屋を冷かす。歩きやすい靴で。', area: '代々木', minutes: 0 },
  { id: 'd03', mag: 'VOCE', issue: '記念日特集', kind: 'date', slot: 'any', tags: ['date', 'beauty'], emoji: '💐', title: '記念日はホテルのアフタヌーンティーで', body: '二か月前に予約開始の店が多い。服はいつもより少し綺麗めに。', area: '丸の内', minutes: 0 },
];

// 元データの mag（旧表記）は無視し、架空誌・掲載形式・日付で上書きする
export const ARCHIVE = [...RAW, ...EXTRA_ITEMS].map((it) => {
  const [magId, format, date] = ASSIGN[it.id] || EXTRA_ASSIGN[it.id];
  return { ...it, mag: MAGS[magId].name, magId, format, date };
});

// 広告（スポンサー）在庫のサンプル。tags が提案カードのタグと合うとき優先して出す。
export const ADS = [
  { id: 'ad1', brand: 'Maison Kitsune Sweets', emoji: '🍰', title: '手土産に、季節限定のフィナンシェ', body: '予約すれば当日店頭受け取りOK。', cta: '詳しく見る', tags: ['gift', 'sweets', 'cafe'] },
  { id: 'ad2', brand: 'SUNNY Optical', emoji: '🕶️', title: '海のための偏光サングラス', body: '雑誌掲載モデル、期間限定10%OFF。', cta: 'ショップへ', tags: ['beach', 'trip', 'sea'] },
  { id: 'ad3', brand: 'Hotel Nagomi', emoji: '🛎️', title: '平日限定、記念日プラン', body: 'アフタヌーンティー付き宿泊プラン。', cta: '空室を見る', tags: ['date', 'trip', 'onsen'] },
  { id: 'ad4', brand: 'BEAUTY LAB', emoji: '💄', title: '会食前の10分メイク直し', body: '店頭カウンターで無料カウンセリング。', cta: '店舗を探す', tags: ['beauty', 'food', 'date'] },
];

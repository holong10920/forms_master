/** Local deterministic catalog transcribed from the read-only apply hub configs.
 * These are editable choice data, never a category service or executable legacy code. */
export const productFamilies: [string, string][] = [
  ["laundry", "洗濯機、乾燥機"],
  ["fridge", "冷蔵庫、冷凍庫"],
  ["hvac", "冷暖房、空調"],
  ["kitchen", "キッチン家電"],
  ["tv", "テレビ、周辺機器"],
  ["beauty", "美容、健康器具"],
  ["pc_site", "PC、スマホ、タブレット"],
  ["camera_site", "カメラ、光学機器"],
  ["audio", "オーディオ"],
  ["gakki_site", "楽器"],
  ["sports_outdoor", "スポーツ・アウトドア"],
  ["other", "その他"],
];
export const productCategories: Record<string, [string, string][]> = {
  laundry: [
    ["laundry-f", "ドラム式洗濯機"],
    ["laundry-t", "縦型洗濯機"],
    ["laundry-d", "乾燥機"],
  ],
  pc_site: [
    ["desktop", "デスクトップPC"],
    ["note", "ノートPC"],
    ["phone", "スマホ本体"],
    ["tablet", "タブレット"],
    ["pc-accessories", "周辺機器"],
  ],
  camera_site: [
    ["camera", "カメラ本体"],
    ["lens", "レンズ"],
    ["camera-accessories", "アクセサリー"],
    ["telescope", "望遠鏡"],
    ["fieldglasses", "双眼鏡"],
    ["microscope", "顕微鏡"],
  ],
  gakki_site: [
    ["guitar-bass", "ギター、ベース"],
    ["piano", "ピアノ、エレクトーン"],
    ["keyboard", "キーボード、電子ピアノ"],
    ["inst", "管楽器・弦楽器・打楽器"],
    ["dtm-dj", "DTM・DJ・音響機器"],
    ["gakki-accessories", "周辺機器・アクセサリー"],
    ["gakki-o", "その他"],
  ],
  sports_outdoor: [
    ["bicycle_site", "自転車"],
    ["golf", "ゴルフ"],
    ["fishing", "釣具"],
    ["sports-o", "その他"],
  ],
};
export const productSubcategories: Record<string, [string, string][]> = {
  camera: [
    ["camera-d", "デジタルカメラ"],
    ["camera-v", "ビデオカメラ"],
    ["camera-a", "アクションカメラ"],
    ["camera-f", "フィルムカメラ"],
    ["camera-i", "インスタントカメラ"],
    ["camera-o", "その他"],
  ],
  bicycle_site: [
    ["bike", "自転車本体"],
    ["parts", "パーツ"],
    ["bicycle-accessories", "アクセサリー"],
  ],
  fishing: [
    ["rod", "ロッド"],
    ["reel", "リール"],
    ["fishing-accessories", "アクセサリー"],
  ],
};

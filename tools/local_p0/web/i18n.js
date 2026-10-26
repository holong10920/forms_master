// Admin chrome localization (ja default, vi-VN). Admin code keeps writing Japanese; this layer
// translates rendered chrome text in place and restores the original on switching back.
// Form content and identifiers live under [translate="no"] and are never touched.
const exact = new Map(
  Object.entries({
    "Local synthetic P0 · 実データを入力しないでください":
      "Local synthetic P0 · Không nhập dữ liệu thật",
    表示言語: "Ngôn ngữ hiển thị",
    "ログイン / 切替": "Đăng nhập / Chuyển",
    ログアウト: "Đăng xuất",
    サイト: "Trang",
    フォーム: "Biểu mẫu",
    "開く / 再読込": "Mở / Tải lại",
    新規フォーム名: "Tên biểu mẫu mới",
    イベント申込: "Đăng ký sự kiện",
    フォーム作成: "Tạo biểu mẫu",
    フォーム名: "Tên biểu mẫu",
    自動保存: "Tự động lưu",
    保存: "Lưu",
    診断: "Chẩn đoán",
    プレビュー: "Xem trước",
    レビュー依頼: "Gửi duyệt",
    未公開ドラフト削除: "Xóa bản nháp chưa phát hành",
    この下書きは他の場所で更新されました: "Bản nháp này đã được cập nhật ở nơi khác",
    "自分の未保存の変更はこの画面に残っています。":
      "Các thay đổi chưa lưu của bạn vẫn còn trên màn hình này.",
    最新版と比較: "So sánh với bản mới nhất",
    フィールド: "Trường",
    種類: "Loại",
    フィールド追加: "Thêm trường",
    ステップ追加: "Thêm bước",
    共通ブロック: "Khối dùng chung",
    固定リビジョン: "Phiên bản cố định",
    共通ブロックを挿入: "Chèn khối dùng chung",
    設定: "Cài đặt",
    "フロー（参照用）": "Luồng (tham khảo)",
    分岐ルール: "Quy tắc rẽ nhánh",
    名前付き条件: "Điều kiện có tên",
    "Data Contract / 変更点": "Data Contract / Thay đổi",
    契約変更を確認しました: "Tôi đã xác nhận thay đổi hợp đồng",
    "レビュー / 公開履歴": "Duyệt / Lịch sử phát hành",
    隔離プレビュー: "Xem trước cách ly",
    未保存の変更があります: "Có thay đổi chưa lưu",
    "保存中…": "Đang lưu…",
    保存しました: "Đã lưu",
    "競合: 未保存の変更はこの画面に残っています":
      "Xung đột: các thay đổi chưa lưu vẫn còn trên màn hình này",
    "最新版を読み込んだあと、この一覧を見ながら変更をもう一度行ってください。自動マージは行いません。":
      "Sau khi tải bản mới nhất, hãy thực hiện lại các thay đổi theo danh sách này. Không tự động gộp.",
    "プレビューを停止しました：この版は利用できません。更新を確認してからプレビューを開き直してください。":
      "Đã dừng xem trước: phiên bản này không còn dùng được. Hãy kiểm tra cập nhật rồi mở lại xem trước.",
    "プレビューを停止しました：状態を確認できません。":
      "Đã dừng xem trước: không xác định được trạng thái.",
    アカウント切替の前に保存してください: "Hãy lưu trước khi chuyển tài khoản",
    ログイン中: "Đang đăng nhập",
    ログイン完了: "Đã đăng nhập",
    ログアウトの前に保存してください: "Hãy lưu trước khi đăng xuất",
    サイト切替の前に保存してください: "Hãy lưu trước khi chuyển trang",
    "未保存の変更を破棄して最新版を読み込みますか？":
      "Bỏ các thay đổi chưa lưu và tải bản mới nhất?",
    読み込み中: "Đang tải",
    保存済みドラフトを読み込みました: "Đã tải bản nháp đã lưu",
    新規作成の前に保存してください: "Hãy lưu trước khi tạo mới",
    フォームを開いてください: "Hãy mở một biểu mẫu",
    "VERSION_CONFLICT: 最新版と比較してください": "VERSION_CONFLICT: hãy so sánh với bản mới nhất",
    ドラフト削除: "Đã xóa bản nháp",
    "診断: 問題なし": "Chẩn đoán: không có vấn đề",
    隔離プレビューを準備中: "Đang chuẩn bị xem trước cách ly",
    プレビュー準備完了: "Xem trước đã sẵn sàng",
    "Data Contract の変更を確認してからレビュー依頼してください":
      "Hãy xác nhận thay đổi Data Contract trước khi gửi duyệt",
    入力ステップを選択してください: "Hãy chọn một bước nhập liệu",
    ブロックが利用できません: "Không dùng được khối này",
    ブロック別名: "Bí danh khối",
    ブロックを削除: "Xóa khối",
    "Canvas でフィールドを選択": "Chọn một trường trên Canvas",
    表示名: "Tên hiển thị",
    データキー: "Khóa dữ liệu",
    ステップ: "Bước",
    ステップ名: "Tên bước",
    データ分類: "Phân loại dữ liệu",
    "選択肢 (値|表示名、1行1件)": "Lựa chọn (giá trị|tên hiển thị, mỗi dòng một mục)",
    計算演算子: "Toán tử tính toán",
    "定数 0": "Hằng số 0",
    フィールド削除: "Xóa trường",
    テーマ: "Giao diện",
    モーション: "Chuyển động",
    なし: "Không",
    控えめ: "Nhẹ nhàng",
    ガイド付き: "Có hướng dẫn",
    速さ: "Tốc độ",
    ゆっくり: "Chậm",
    標準: "Chuẩn",
    速い: "Nhanh",
    ステップ切替: "Chuyển bước",
    条件表示: "Hiển thị theo điều kiện",
    検証フィードバック: "Phản hồi kiểm tra",
    送信フィードバック: "Phản hồi khi gửi",
    "モーションの On/Off はプリセットで切替し、隔離プレビューで確認できます。OS の動きを減らす設定を尊重します。":
      "Bật/tắt chuyển động bằng preset và kiểm tra trong xem trước cách ly. Tôn trọng cài đặt giảm chuyển động của hệ điều hành.",
    "送信後の処理: 合成 mock log のみ（ローカル、実システム連携なし）":
      "Xử lý sau khi gửi: chỉ ghi mock log giả lập (cục bộ, không kết nối hệ thống thật)",
    それ以外: "Trường hợp khác",
    "既存の式は保持されます。この画面では編集できません。":
      "Biểu thức hiện có được giữ nguyên. Không chỉnh sửa được trên màn hình này.",
    条件なし: "Không có điều kiện",
    単一条件: "Một điều kiện",
    すべて満たす: "Thỏa mãn tất cả",
    いずれかを満たす: "Thỏa mãn một trong số",
    参照可能なフィールドがありません: "Không có trường nào có thể tham chiếu",
    条件: "Điều kiện",
    等しい値: "Giá trị bằng",
    整数を入力してください: "Hãy nhập số nguyên",
    "未回答・非表示のときは、この条件は成立しません（次の分岐へ進みます）。経路によって参照が inactive になる場合があります。":
      "Khi chưa trả lời hoặc bị ẩn, điều kiện này không thỏa (chuyển sang nhánh tiếp theo). Tùy luồng, tham chiếu có thể ở trạng thái inactive.",
    名前付き条件名: "Tên điều kiện",
    名前付き条件を削除: "Xóa điều kiện có tên",
    名前付き条件を追加: "Thêm điều kiện có tên",
    フィールドを追加してください: "Hãy thêm trường",
    次のステップ: "Bước tiếp theo",
    条件削除: "Xóa điều kiện",
    条件分岐を追加: "Thêm nhánh điều kiện",
    選択フィールドを追加してください: "Hãy thêm trường lựa chọn",
    "スナップショット / Data Contract": "Ảnh chụp / Data Contract",
    承認対象をプレビュー: "Xem trước bản cần duyệt",
    "承認 (Data Contract 確認)": "Duyệt (xác nhận Data Contract)",
    差し戻し: "Trả lại",
    再チェック: "Kiểm tra lại",
    ローカル公開: "Phát hành cục bộ",
    公開をキャンセル: "Hủy phát hành",
    この版から複製: "Nhân bản từ phiên bản này",
    公開スナップショットから複製しました: "Đã nhân bản từ ảnh chụp đã phát hành",
    この版へロールバック: "Khôi phục về phiên bản này",
    ロールバック完了: "Đã khôi phục",
    監査ログ: "Nhật ký kiểm toán",
    // Translation panel
    "翻訳（日本語 / Tiếng Việt）": "Bản dịch (日本語 / Tiếng Việt)",
    "ベトナム語 (vi-VN) を有効化": "Bật tiếng Việt (vi-VN)",
    未翻訳のみ表示: "Chỉ hiện mục chưa dịch",
    "自動翻訳 ja→vi（下書き）": "Dịch tự động ja→vi (bản nháp)",
    "自動翻訳 vi→ja（下書き）": "Dịch tự động vi→ja (bản nháp)",
    項目: "Mục",
    状態: "Trạng thái",
    翻訳済み: "Đã dịch",
    "未翻訳（日本語で表示）": "Chưa dịch (hiển thị tiếng Nhật)",
    "自動翻訳（要確認）": "Dịch tự động (cần kiểm tra)",
    既定の文言: "Văn bản mặc định",
    未設定: "Chưa đặt",
    日本語が必要です: "Cần có tiếng Nhật",
    "ID・データキー・選択肢の値・ルールは言語に依存しません。空欄は日本語（または既定の文言）で表示されます。":
      "ID, khóa dữ liệu, giá trị lựa chọn và quy tắc không phụ thuộc ngôn ngữ. Ô trống sẽ hiển thị bằng tiếng Nhật (hoặc văn bản mặc định).",
    "自動翻訳は承認済みの翻訳プロバイダーがある場合のみ動作します。結果は空欄にだけ下書きとして入り、手入力の翻訳は上書きしません。":
      "Dịch tự động chỉ hoạt động khi có nhà cung cấp dịch đã được phê duyệt. Kết quả chỉ điền vào ô trống dưới dạng bản nháp, không ghi đè bản dịch đã nhập tay.",
    "自動翻訳は利用できません：承認済みの翻訳プロバイダーが設定されていません。手動で入力してください。":
      "Không dùng được dịch tự động: chưa cấu hình nhà cung cấp dịch đã được phê duyệt. Vui lòng nhập thủ công.",
    翻訳対象の空欄がありません: "Không có ô trống cần dịch",
    "ベトナム語が無効のため、公開フォームには日本語のみ含まれます。":
      "Tiếng Việt đang tắt nên biểu mẫu phát hành chỉ có tiếng Nhật.",
    フォームタイトル: "Tiêu đề biểu mẫu",
    フォーム説明: "Mô tả biểu mẫu",
    プレースホルダー: "Placeholder",
    ヘルプ: "Trợ giúp",
    選択肢: "Lựa chọn",
    "ボタン: 次へ": "Nút: Tiếp theo",
    "ボタン: 戻る": "Nút: Quay lại",
    "ボタン: 送信": "Nút: Gửi",
    選択プロンプト: "Lời nhắc chọn",
    確認画面タイトル: "Tiêu đề màn hình xác nhận",
    送信プレビュー見出し: "Tiêu đề xem trước dữ liệu gửi",
    エラー概要: "Tóm tắt lỗi",
    完了タイトル: "Tiêu đề hoàn tất",
    完了メッセージ: "Thông điệp hoàn tất",
    合成データ表示: "Nhãn dữ liệu giả lập",
    "メッセージ: 数値": "Thông báo: số",
    "メッセージ: 必須": "Thông báo: bắt buộc",
    "メッセージ: 同意": "Thông báo: đồng ý",
    "メッセージ: 最小文字数": "Thông báo: số ký tự tối thiểu",
    "メッセージ: 最大文字数": "Thông báo: số ký tự tối đa",
    "メッセージ: 最小値": "Thông báo: giá trị tối thiểu",
    "メッセージ: 最大値": "Thông báo: giá trị tối đa",
    "メッセージ: 最小選択数": "Thông báo: số lựa chọn tối thiểu",
    "メッセージ: 最大選択数": "Thông báo: số lựa chọn tối đa",
    "メッセージ: 排他選択肢": "Thông báo: lựa chọn loại trừ",
  }),
);
const rulePrefix = { 表示: "hiển thị", 必須: "bắt buộc", 分岐: "rẽ nhánh", 名前付き: "có tên" };
for (const [ja, vi] of Object.entries(rulePrefix)) {
  exact.set(ja + "条件", "Điều kiện " + vi);
  exact.set(ja + "条件を置換", "Thay thế điều kiện " + vi);
  exact.set(ja + "条件の組み合わせ", "Cách kết hợp điều kiện " + vi);
  exact.set(ja + "条件フィールド", "Trường điều kiện " + vi);
  exact.set(ja + "演算子", "Toán tử điều kiện " + vi);
  exact.set(ja + "条件: 等しい値", "Điều kiện " + vi + ": giá trị bằng");
  exact.set(ja + "条件を追加", "Thêm điều kiện " + vi);
}
const patterns = [
  [/^フォーム作成: (.*)$/s, "Đã tạo biểu mẫu: $1"],
  [/^保存版 v(\d+)$/, "Bản đã lưu v$1"],
  [/^レビュー依頼: (.*)$/s, "Đã gửi duyệt: $1"],
  [/^保存できませんでした: (.*)$/s, "Không lưu được: $1"],
  [/^公開: (.*)$/s, "Đã phát hành: $1"],
  [/^共通ブロック: (.*)$/s, "Khối dùng chung: $1"],
  [/^共通ブロック · (.*)$/s, "Khối dùng chung · $1"],
  [
    /^参照 (\d+) 件が残ります。削除後は診断で修正が必要です。$/,
    "Còn $1 tham chiếu. Sau khi xóa cần sửa theo kết quả chẩn đoán.",
  ],
  [/^使用箇所 (\d+)件に参照が残ります。削除しますか？$/, "Còn tham chiếu ở $1 vị trí. Xóa không?"],
  [/^使用箇所 (\d+)件$/, "Được dùng ở $1 vị trí"],
  [/^優先順位 (\d+) · 上の分岐が優先されます$/, "Thứ tự ưu tiên $1 · nhánh phía trên được ưu tiên"],
  [/^優先 (\d+) · 条件あり → (.*)$/s, "Ưu tiên $1 · có điều kiện → $2"],
  [/^優先 (\d+) · 参照なし → (.*)$/s, "Ưu tiên $1 · không có tham chiếu → $2"],
  [/^優先 (\d+) · (.*)$/s, "Ưu tiên $1 · $2"],
  [/^それ以外 → (.*)$/s, "Trường hợp khác → $1"],
  [/^名前付き: (.*)$/s, "Có tên: $1"],
  [/^参照を確認: (.*)$/s, "Kiểm tra tham chiếu: $1"],
  [/^要再確認: (.*)$/s, "Cần kiểm tra lại: $1"],
  [/^依存フィールド (\d+)$/, "Trường phụ thuộc $1"],
  [/^(.*)条件行を削除 (\d+)$/, (_, p, n) => `Xóa dòng điều kiện ${rulePrefix[p] ?? p} ${n}`],
  [/^(.*) · 現在公開中$/s, "$1 · Đang phát hành"],
  [/^(.*) · 必須$/s, "$1 · Bắt buộc"],
  [/^(.*) · 任意$/s, "$1 · Không bắt buộc"],
  [/^翻訳済み (\d+) \/ (\d+)$/, "Đã dịch $1 / $2"],
  [
    /^自動翻訳の下書き (\d+) 件を追加しました（要確認）$/,
    "Đã thêm $1 bản nháp dịch tự động (cần kiểm tra)",
  ],
  [
    /^固定リビジョンを (.*) → (.*) に変更します。.*$/s,
    "Đổi phiên bản cố định $1 → $2. Hãy kiểm tra ảnh hưởng tới Data Contract và tham chiếu. Các biểu mẫu khác không bị thay đổi.",
  ],
];
function translate(source) {
  const core = source.trim();
  if (!core) return source;
  let out = exact.get(core);
  if (out === undefined)
    for (const [re, to] of patterns)
      if (re.test(core)) {
        out = core.replace(re, to);
        break;
      }
  return out === undefined ? source : source.replace(core, out);
}
const storageKey = "fb.admin.locale";
let locale = "ja";
try {
  locale = window.sessionStorage.getItem(storageKey) === "vi" ? "vi" : "ja";
} catch {
  // Storage may be blocked; fall back to Japanese for this page view.
}
const texts = new WeakMap(),
  attrs = new WeakMap(),
  attributeNames = ["placeholder", "title", "aria-label"];
const skip = (n) =>
  !!(n.nodeType === 1 ? n : n.parentElement)?.closest('[translate="no"],script,style');
function textNode(n) {
  if (skip(n)) return;
  const known = texts.get(n);
  const source = known && n.data === known.out ? known.source : n.data;
  const out = locale === "vi" ? translate(source) : source;
  texts.set(n, { source, out });
  if (n.data !== out) n.data = out;
}
function attribute(el, name) {
  if (!el.hasAttribute(name) || skip(el)) return;
  const map = attrs.get(el) ?? new Map(),
    known = map.get(name),
    value = el.getAttribute(name);
  const source = known && value === known.out ? known.source : value;
  const out = locale === "vi" ? translate(source) : source;
  map.set(name, { source, out });
  attrs.set(el, map);
  if (value !== out) el.setAttribute(name, out);
}
function apply(root) {
  if (root.nodeType === 3) return textNode(root);
  if (root.nodeType !== 1 || skip(root)) return;
  const walker = document.createTreeWalker(root, window.NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) textNode(walker.currentNode);
  for (const el of [root, ...root.querySelectorAll("[placeholder],[title],[aria-label]")])
    for (const name of attributeNames) attribute(el, name);
}
new window.MutationObserver((records) => {
  for (const r of records) {
    if (r.type === "characterData") textNode(r.target);
    else if (r.type === "attributes") attribute(r.target, r.attributeName);
    else for (const n of r.addedNodes) apply(n);
  }
}).observe(document.body, {
  subtree: true,
  childList: true,
  characterData: true,
  attributes: true,
  attributeFilter: attributeNames,
});
const nativeConfirm = window.confirm.bind(window);
window.confirm = (message) => nativeConfirm(locale === "vi" ? translate(String(message)) : message);
const picker = document.getElementById("admin-locale");
function setLocale(next) {
  locale = next === "vi" ? "vi" : "ja";
  try {
    window.sessionStorage.setItem(storageKey, locale);
  } catch {
    // Not persisted; the choice still applies to this page view.
  }
  document.documentElement.lang = locale === "vi" ? "vi-VN" : "ja-JP";
  picker.value = locale;
  apply(document.body);
}
picker.addEventListener("change", () => setLocale(picker.value));
setLocale(locale);

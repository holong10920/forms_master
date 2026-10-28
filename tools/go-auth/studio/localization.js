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
    項目: "Mục",
    状態: "Trạng thái",
    既定の文言: "Văn bản mặc định",
    未設定: "Chưa đặt",
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
const rulePrefix = {
  表示: "hiển thị",
  必須: "bắt buộc",
  分岐: "rẽ nhánh",
  名前付き: "có tên",
  スキップ: "bỏ qua",
};
for (const [ja, vi] of Object.entries(rulePrefix)) {
  exact.set(ja + "条件", "Điều kiện " + vi);
  exact.set(ja + "条件を置換", "Thay thế điều kiện " + vi);
  exact.set(ja + "条件の組み合わせ", "Cách kết hợp điều kiện " + vi);
  exact.set(ja + "条件フィールド", "Trường điều kiện " + vi);
  exact.set(ja + "演算子", "Toán tử điều kiện " + vi);
  exact.set(ja + "条件: 等しい値", "Điều kiện " + vi + ": giá trị bằng");
  exact.set(ja + "条件を追加", "Thêm điều kiện " + vi);
}
// Form Studio chrome (header, home, build, flow, preview, publish). Earlier entries win.
for (const [ja, vi] of Object.entries({
  // Shell / header / sign-in
  "合成データ専用のローカル環境です · 実データを入力しないでください":
    "Môi trường local chỉ dành cho dữ liệu giả lập · Không nhập dữ liệu thật",
  "Form Studio にサインイン": "Đăng nhập Form Studio",
  "ローカルの Mock IdP（OIDC + PKCE）で合成アカウントを選んでください。役割によって操作できる内容が変わります。":
    "Chọn tài khoản giả lập qua Mock IdP local (OIDC + PKCE). Các thao tác khả dụng tùy theo vai trò.",
  編集者: "Người biên tập",
  "フォームの作成・編集とレビュー依頼": "Tạo, sửa biểu mẫu và gửi duyệt",
  レビュー担当: "Người duyệt",
  "レビュー内容の承認・差し戻し": "Phê duyệt hoặc trả lại nội dung duyệt",
  公開担当: "Người phát hành",
  "承認済みの版の公開・ロールバック": "Phát hành và quay về phiên bản đã duyệt",
  閲覧者: "Người xem",
  "閲覧のみ（変更不可）": "Chỉ xem (không thể thay đổi)",
  他サイトの編集者: "Người biên tập trang khác",
  "別サイトのみ編集可能（サイト分離の確認用）":
    "Chỉ sửa được trang khác (để kiểm tra cách ly trang)",
  セキュリティ担当: "Người phụ trách bảo mật",
  配備ポリシーの確認: "Kiểm tra chính sách triển khai",
  "Sports サイト（合成）": "Trang Sports (giả lập)",
  "PC サイト（合成）": "Trang PC (giả lập)",
  "別サイト（合成）": "Trang khác (giả lập)",
  "あなたの役割:": "Vai trò của bạn:",
  アカウント: "Tài khoản",
  アカウントを切り替え: "Chuyển tài khoản",
  フォーム一覧へ: "Tới danh sách biểu mẫu",
  フォーム一覧: "Danh sách biểu mẫu",
  編集モード: "Chế độ chỉnh sửa",
  その他の操作: "Thao tác khác",
  作成: "Tạo",
  フロー: "Luồng",
  公開: "Phát hành",
  閲覧のみ: "Chỉ xem",
  レビューする: "Duyệt ngay",
  公開へ進む: "Đi tới phát hành",
  公開中: "Đang phát hành",
  レビュー中: "Đang duyệt",
  承認済み: "Đã phê duyệt",
  下書き: "Bản nháp",
  保存済み: "Đã lưu",
  "保存中…": "Đang lưu…",
  競合あり: "Có xung đột",
  "未保存（保存エラー）": "Chưa lưu (lỗi lưu)",
  未保存の変更: "Thay đổi chưa lưu",
  "未保存（自動保存オフ）": "Chưa lưu (tắt tự động lưu)",
  最終保存: "Lưu lần cuối",
  "編集後 1.5 秒で保存します": "Lưu sau 1,5 giây kể từ khi sửa",
  今すぐ保存: "Lưu ngay",
  最新版を再読込: "Tải lại bản mới nhất",
  最新版を読み込む: "Tải bản mới nhất",
  診断を実行: "Chạy chẩn đoán",
  キーボード操作: "Thao tác bàn phím",
  "マウスを使わずにすべての編集操作ができます。":
    "Có thể thực hiện mọi thao tác chỉnh sửa mà không cần chuột.",
  選択中のフィールドを移動: "Di chuyển trường đang chọn",
  選択中のフィールドを複製: "Nhân bản trường đang chọn",
  選択中のフィールドを削除: "Xóa trường đang chọn",
  タブを切り替え: "Chuyển thẻ",
  "セッションの有効期限が切れました。未保存の変更はこの画面に残っています。再ログインすると編集を続けられます。":
    "Phiên đăng nhập đã hết hạn. Thay đổi chưa lưu vẫn còn trên màn hình này. Đăng nhập lại để tiếp tục chỉnh sửa.",
  再ログイン: "Đăng nhập lại",
  "自分の未保存の変更はこの画面に残っています。自動マージは行いません。":
    "Thay đổi chưa lưu của bạn vẫn còn trên màn hình này. Không tự động gộp.",
  技術的な詳細: "Chi tiết kỹ thuật",
  "未保存の変更を安全に保持できません。再ログインを停止しました。":
    "Không thể giữ an toàn thay đổi chưa lưu. Đã dừng đăng nhập lại.",
  "この画面の未保存の変更は失われます。": "Các thay đổi chưa lưu trên màn hình này sẽ bị mất.",
  破棄して読み込む: "Bỏ và tải lại",
  "未公開ドラフトを削除しますか？": "Xóa bản nháp chưa phát hành?",
  "保存済みのドラフトを削除します。公開済みのフォームは削除できません。":
    "Xóa bản nháp đã lưu. Không thể xóa biểu mẫu đã phát hành.",
  削除する: "Xóa",
  キャンセル: "Hủy",
  閉じる: "Đóng",
  削除: "Xóa",
  変更: "Thay đổi",
  変更する: "Thay đổi",
  編集: "Sửa",
  追加: "Thêm",
  // Home
  フォームを検索: "Tìm biểu mẫu",
  新規フォーム: "Biểu mẫu mới",
  新しいフォーム: "Biểu mẫu mới",
  新規フォームを作成: "Tạo biểu mẫu mới",
  空のフォームから作成: "Tạo từ biểu mẫu trống",
  無題のフォーム: "Biểu mẫu chưa đặt tên",
  該当するフォームがありません: "Không có biểu mẫu phù hợp",
  "別のキーワードで検索してください。": "Hãy tìm bằng từ khóa khác.",
  まだフォームがありません: "Chưa có biểu mẫu",
  "「新規フォーム」から最初のフォームを作成しましょう。":
    'Hãy tạo biểu mẫu đầu tiên từ "Biểu mẫu mới".',
  "編集者がフォームを作成すると、ここに表示されます。":
    "Khi người biên tập tạo biểu mẫu, biểu mẫu sẽ hiển thị ở đây.",
  フォーム一覧を読み込めませんでした: "Không tải được danh sách biểu mẫu",
  "通信状態を確認して再試行してください。": "Hãy kiểm tra kết nối và thử lại.",
  再試行: "Thử lại",
  "入力ステップ・確認・完了の 3 ステップで作成されます。":
    "Được tạo với 3 bước: nhập liệu, xác nhận, hoàn tất.",
  "空欄の場合は「無題のフォーム」になります。あとから変更できます。":
    'Nếu để trống sẽ là "Biểu mẫu chưa đặt tên". Có thể đổi sau.',
  "例：イベント申込": "Ví dụ: Đăng ký sự kiện",
  // Build: outline / palette / canvas
  構成: "Cấu trúc",
  構成とフィールド追加: "Cấu trúc và thêm trường",
  フォームの構成: "Cấu trúc biểu mẫu",
  左パネル: "Bảng bên trái",
  構成パネル: "Bảng cấu trúc",
  キャンバス: "Canvas",
  プロパティパネル: "Bảng thuộc tính",
  プロパティ: "Thuộc tính",
  フィールドなし: "Không có trường",
  ステップを追加: "Thêm bước",
  基本: "Cơ bản",
  選択: "Lựa chọn",
  "連絡先・個人情報": "Liên hệ · Thông tin cá nhân",
  高度な項目: "Mục nâng cao",
  利用可: "Khả dụng",
  利用不可: "Không khả dụng",
  挿入: "Chèn",
  表示サイズ: "Kích thước hiển thị",
  スマホ: "Điện thoại",
  選択してください: "Vui lòng chọn",
  表示名を編集: "Sửa tên hiển thị",
  フィールド操作: "Thao tác trường",
  上へ移動: "Di chuyển lên",
  下へ移動: "Di chuyển xuống",
  複製: "Nhân bản",
  名前を変更: "Đổi tên",
  ここにフィールドを追加: "Thêm trường vào đây",
  フィールドを追加: "Thêm trường",
  参照先のフィールドが見つかりません: "Không tìm thấy trường được tham chiếu",
  このステップにはまだフィールドがありません: "Bước này chưa có trường nào",
  "よく使う項目をすぐ追加するか、左の「追加」タブから選んでください。":
    'Thêm nhanh mục thường dùng hoặc chọn từ thẻ "Thêm" bên trái.',
  その他の項目: "Mục khác",
  "入力ステップは最低 1 つ必要です": "Cần ít nhất 1 bước nhập liệu",
  "ブロックはこのフォームから外れます。他のフォームは変更されません。":
    "Khối sẽ bị gỡ khỏi biểu mẫu này. Các biểu mẫu khác không thay đổi.",
  // Build: inspector
  選択を解除してフォーム設定を表示: "Bỏ chọn và hiển thị cài đặt biểu mẫu",
  選択を解除: "Bỏ chọn",
  検証: "Kiểm tra hợp lệ",
  詳細: "Chi tiết",
  分岐: "Rẽ nhánh",
  スタイル: "Kiểu dáng",
  "閲覧のみの権限です。内容を確認できますが変更はできません。":
    "Bạn chỉ có quyền xem. Có thể xem nội dung nhưng không thể thay đổi.",
  "お客様に表示される質問文です。": "Câu hỏi hiển thị cho khách hàng.",
  "入力欄に薄く表示される例です（任意）。": "Ví dụ hiển thị mờ trong ô nhập (tùy chọn).",
  "質問の下に表示される補足説明です（任意）。":
    "Giải thích bổ sung hiển thị dưới câu hỏi (tùy chọn).",
  計算: "Tính toán",
  プラグイン設定: "Cài đặt plugin",
  入力ルール: "Quy tắc nhập",
  必須: "Bắt buộc",
  "未入力のまま次へ進めないようにします。": "Không cho đi tiếp khi chưa nhập.",
  入力の制限: "Giới hạn nhập",
  表示ルール: "Quy tắc hiển thị",
  表示: "Hiển thị",
  常に表示: "Luôn hiển thị",
  必須ルール: "Quy tắc bắt buộc",
  "条件なし（「検証」の必須設定に従う）":
    'Không điều kiện (theo cài đặt bắt buộc trong "Kiểm tra hợp lệ")',
  非表示になったら入力値をクリア: "Xóa giá trị khi bị ẩn",
  "非表示になった項目の値は送信されません。": "Giá trị của mục bị ẩn sẽ không được gửi.",
  "条件に使えるフィールドがまだありません。先に選択肢などの項目を追加してください。":
    "Chưa có trường dùng được cho điều kiện. Hãy thêm mục như lựa chọn trước.",
  個人情報: "Thông tin cá nhân",
  機密: "Bí mật",
  データ: "Dữ liệu",
  "送信データの項目名です。公開後に変更すると受け取り側に影響します。":
    "Tên mục trong dữ liệu gửi. Thay đổi sau khi phát hành sẽ ảnh hưởng tới phía nhận.",
  "分類は上げることのみできます（下げられません）。":
    "Chỉ có thể nâng mức phân loại (không thể hạ).",
  配置するステップ: "Bước đặt trường",
  情報: "Thông tin",
  送信: "Gửi",
  "表示のみ（送信しない）": "Chỉ hiển thị (không gửi)",
  送信データに含める: "Đưa vào dữ liệu gửi",
  一時保存: "Lưu tạm",
  保存しない: "Không lưu",
  許可: "Cho phép",
  送信される値: "Giá trị được gửi",
  "選択肢は最低 1 つ必要です": "Cần ít nhất 1 lựa chọn",
  選択肢の値が重複しています: "Giá trị lựa chọn bị trùng",
  選択肢を追加: "Thêm lựa chọn",
  まとめて編集: "Sửa hàng loạt",
  "1 行に 1 件、「値|表示名」の形式で入力します。":
    'Mỗi dòng một mục, theo định dạng "giá trị|tên hiển thị".',
  計算方法: "Cách tính",
  "足し算（+）": "Cộng (+)",
  "引き算（−）": "Trừ (−)",
  "掛け算（×）": "Nhân (×)",
  文字列をつなげる: "Nối chuỗi",
  "計算結果は表示のみで、送信データには含まれません。":
    "Kết quả tính chỉ để hiển thị, không được đưa vào dữ liệu gửi.",
  都道府県で絞り込む: "Lọc theo tỉnh/thành",
  店舗選択の案内文: "Lời hướng dẫn chọn cửa hàng",
  "最大 40 文字。": "Tối đa 40 ký tự.",
  "プラグインのプログラムは管理画面では実行されません。動作は隔離プレビューで確認してください。":
    "Chương trình plugin không chạy trong màn hình quản trị. Hãy kiểm tra hoạt động trong bản xem trước cách ly.",
  最小文字数: "Số ký tự tối thiểu",
  最大文字数: "Số ký tự tối đa",
  最小値: "Giá trị tối thiểu",
  最大値: "Giá trị tối đa",
  最小選択数: "Số lựa chọn tối thiểu",
  最大選択数: "Số lựa chọn tối đa",
  制限なし: "Không giới hạn",
  "チェックを必須にする（同意など）": "Bắt buộc đánh dấu (đồng ý, v.v.)",
  "この画面で編集できない検証（保持されます）:":
    "Quy tắc kiểm tra không sửa được ở đây (được giữ nguyên):",
  "空欄の場合は既定の文言が表示されます。": "Nếu để trống sẽ hiển thị văn bản mặc định.",
  確認画面: "Màn hình xác nhận",
  完了画面: "Màn hình hoàn tất",
  "確認画面と完了画面は自動で作成されます。並び替え・削除はできません。":
    "Màn hình xác nhận và hoàn tất được tạo tự động. Không thể sắp xếp lại hay xóa.",
  "ステップの見出しとして表示されます（任意）。": "Hiển thị làm tiêu đề của bước (tùy chọn).",
  ステップを削除: "Xóa bước",
  "入力ステップが 1 つだけのため削除できません。": "Chỉ có 1 bước nhập liệu nên không thể xóa.",
  "固定リビジョンを変更しますか？": "Đổi phiên bản cố định?",
  "条件で参照するときの名前です。": "Tên dùng khi tham chiếu trong điều kiện.",
  "ブロックの更新は自動では反映されません。リビジョンを選んで固定します。":
    "Cập nhật của khối không tự động áp dụng. Hãy chọn và cố định phiên bản.",
  ブロックの設定: "Cài đặt khối",
  含まれるフィールド: "Các trường bên trong",
  "共通ブロックの中身はこの画面では編集できません。":
    "Không thể sửa nội dung khối dùng chung ở màn hình này.",
  公開項目: "Mục công khai",
  "高コントラスト（読みやすさ重視）": "Tương phản cao (ưu tiên dễ đọc)",
  "動きを使いません（最も軽量）": "Không dùng chuyển động (nhẹ nhất)",
  フェードと小さな移動で変化を伝えます: "Thể hiện thay đổi bằng hiệu ứng mờ dần và dịch chuyển nhỏ",
  ステップ間をスライドで案内します: "Dẫn dắt giữa các bước bằng hiệu ứng trượt",
  プリセット: "Mẫu có sẵn",
  動きを使う場面: "Khi nào dùng chuyển động",
  "OS の「視差効果を減らす」設定がオンのお客様には動きを表示しません。「なし」の場合、公開フォームにモーション用のプログラムは含まれません。":
    'Không hiển thị chuyển động với khách bật "Giảm chuyển động" trên hệ điều hành. Khi chọn "Không", biểu mẫu phát hành sẽ không chứa chương trình chuyển động.',
  プレビューで確認: "Kiểm tra trong xem trước",
  はじめに: "Bắt đầu",
  "左の「追加」から質問の種類を選んで追加します": 'Chọn loại câu hỏi từ "Thêm" bên trái để thêm',
  "キャンバスの項目をクリックして、右側で内容を編集します":
    "Nhấp vào mục trên canvas và sửa nội dung ở bên phải",
  "「プレビュー」でお客様の画面を確認します": 'Xem màn hình của khách trong "Xem trước"',
  "「レビュー依頼」で承認を依頼し、公開します": 'Gửi duyệt bằng "Gửi duyệt" rồi phát hành',
  "キャンバスの項目を選択すると、その項目の設定がここに表示されます。":
    "Chọn một mục trên canvas để hiển thị cài đặt của mục đó tại đây.",
  お客様に表示する文言: "Văn bản hiển thị cho khách",
  "空欄の場合は管理用のフォーム名を表示します。": "Nếu để trống sẽ hiển thị tên biểu mẫu quản lý.",
  ボタン: "Nút",
  "色・フォント・余白は承認済みテーマで管理されます。フィールド単位の色・余白・フォントは現在のスキーマでは指定できません（今後の拡張候補）。":
    "Màu, phông chữ và khoảng cách do theme đã phê duyệt quản lý. Schema hiện tại chưa cho đặt màu, khoảng cách, phông chữ cho từng trường (ứng viên mở rộng sau).",
  フォーム情報: "Thông tin biểu mẫu",
  "フォーム ID": "ID biểu mẫu",
  保存版: "Bản đã lưu",
  対応言語: "Ngôn ngữ hỗ trợ",
  送信後の処理: "Xử lý sau khi gửi",
  // Rules
  が次と等しい: "bằng",
  が次と異なる: "khác",
  が次より小さい: "nhỏ hơn",
  が次以下: "nhỏ hơn hoặc bằng",
  が次より大きい: "lớn hơn",
  が次以上: "lớn hơn hoặc bằng",
  が未回答: "chưa trả lời",
  が回答済み: "đã trả lời",
  が次のいずれか: "là một trong",
  が次のいずれでもない: "không thuộc",
  で次を選択している: "có chọn",
  で次のいずれかを選択している: "có chọn một trong",
  名前付き: "Có tên",
  スキップ: "Bỏ qua",
  "常に（条件なし）": "Luôn luôn (không điều kiện)",
  条件を置換: "Thay thế điều kiện",
  次の条件を満たすとき: "Khi thỏa điều kiện sau",
  "すべての条件を満たすとき（AND）": "Khi thỏa tất cả điều kiện (AND)",
  "いずれかの条件を満たすとき（OR）": "Khi thỏa bất kỳ điều kiện nào (OR)",
  条件の組み合わせ: "Cách kết hợp điều kiện",
  "条件: 等しい値": "Điều kiện: giá trị bằng",
  または: "hoặc",
  かつ: "và",
  条件を削除: "Xóa điều kiện",
  条件削除: "Xóa điều kiện",
  条件フィールド: "Trường điều kiện",
  演算子: "Toán tử",
  条件を追加: "Thêm điều kiện",
  "複数の場所で使う条件に名前を付けて保存できます。表示・必須・分岐の条件から選択できます。":
    "Có thể đặt tên và lưu điều kiện dùng ở nhiều nơi, rồi chọn trong điều kiện hiển thị, bắt buộc và rẽ nhánh.",
  条件名: "Tên điều kiện",
  "名前付き条件を削除しますか？": "Xóa điều kiện có tên?",
  "上から順に評価し、最初に一致した分岐へ進みます。どれにも一致しない場合は「それ以外」へ進みます。":
    'Đánh giá từ trên xuống và đi tới nhánh khớp đầu tiên. Nếu không nhánh nào khớp sẽ đi tới "Trường hợp khác".',
  もし: "Nếu",
  "→ 移動先": "→ Đích đến",
  常に: "Luôn luôn",
  "移動先が未設定です。プレビューは一部のみ表示されます。":
    "Chưa đặt đích đến. Bản xem trước chỉ hiển thị một phần.",
  参照できるフィールドを先に追加してください: "Hãy thêm trường có thể tham chiếu trước",
  "最初のステップはスキップできません。": "Không thể bỏ qua bước đầu tiên.",
  "条件分岐があるステップにはスキップ条件を設定できません。":
    "Không thể đặt điều kiện bỏ qua cho bước có rẽ nhánh.",
  スキップしない: "Không bỏ qua",
  // Flow
  "ステップの順序と分岐を確認できます（参照用）。分岐の編集は「作成」でステップを選択して行います。":
    'Xem thứ tự các bước và rẽ nhánh (tham khảo). Để sửa rẽ nhánh, hãy chọn bước trong "Tạo".',
  "お客様に表示される文言を日本語とベトナム語で管理します。":
    "Quản lý văn bản hiển thị cho khách bằng tiếng Nhật và tiếng Việt.",
  日本語: "Tiếng Nhật",
  項目: "Mục",
  // Preview
  プレビュー情報: "Thông tin xem trước",
  プレビューできるレビューがありません: "Không có bản duyệt nào để xem trước",
  未作成: "Chưa tạo",
  "準備中…": "Đang chuẩn bị…",
  準備完了: "Sẵn sàng",
  停止中: "Đã dừng",
  エラー: "Lỗi",
  プレビューを更新: "Cập nhật xem trước",
  プレビューを開始: "Bắt đầu xem trước",
  "プレビューを準備中…": "Đang chuẩn bị xem trước…",
  "保存済みの版から隔離プレビューを作成しています。":
    "Đang tạo bản xem trước cách ly từ phiên bản đã lưu.",
  プレビューを停止しました: "Đã dừng xem trước",
  "「プレビューを開始」で新しいプレビューを作成できます。":
    'Nhấn "Bắt đầu xem trước" để tạo bản xem trước mới.',
  プレビューはまだありません: "Chưa có bản xem trước",
  "「プレビューを開始」を押すと、お客様と同じ画面を別オリジンで確認できます。":
    'Nhấn "Bắt đầu xem trước" để xem màn hình giống khách hàng trên một origin riêng.',
  プレビューの状態: "Trạng thái xem trước",
  "レビュー対象のスナップショットを表示しています。": "Đang hiển thị ảnh chụp được gửi duyệt.",
  "保存済みの版を表示します。編集後は保存してから「プレビューを更新」を押してください。":
    'Hiển thị phiên bản đã lưu. Sau khi sửa, hãy lưu rồi nhấn "Cập nhật xem trước".',
  "未設定の経路の先には進めません。プレビューでは送信できません。":
    "Không thể đi tiếp qua đường dẫn chưa đặt. Không thể gửi trong bản xem trước.",
  確認事項: "Điểm cần kiểm tra",
  隔離: "Cách ly",
  "プレビューは別オリジン（127.0.0.1:4175）で動作し、管理画面の Cookie やスクリプトとは分離されています。プラグインのプログラムは管理画面では実行されません。":
    "Bản xem trước chạy trên origin riêng (127.0.0.1:4175), tách biệt với cookie và script của màn hình quản trị. Chương trình plugin không chạy trong màn hình quản trị.",
  // Review / publish
  "保存済みの版をスナップショットとして固定し、レビュー担当者に承認を依頼します。":
    "Cố định phiên bản đã lưu làm ảnh chụp và gửi người duyệt phê duyệt.",
  "Data Contract（技術詳細）": "Data Contract (chi tiết kỹ thuật)",
  "送信データの構造が変わる場合、確認が必要です": "Cần xác nhận khi cấu trúc dữ liệu gửi thay đổi",
  レビューを依頼する: "Gửi duyệt",
  レビューを依頼: "Gửi yêu cầu duyệt",
  "送信データの構造に変更はありません。": "Cấu trúc dữ liệu gửi không thay đổi.",
  分類: "Phân loại",
  レビューと公開: "Duyệt và phát hành",
  "承認済みのスナップショットだけが公開されます。公開後もいつでも以前の版に戻せます。":
    "Chỉ ảnh chụp đã duyệt mới được phát hành. Sau khi phát hành vẫn có thể quay về phiên bản trước bất cứ lúc nào.",
  公開までの流れ: "Quy trình đến khi phát hành",
  承認: "Phê duyệt",
  差し戻し: "Trả lại",
  要再確認: "Cần kiểm tra lại",
  "要再確認:": "Cần kiểm tra lại:",
  公開処理中: "Đang phát hành",
  公開済み: "Đã phát hành",
  置き換え済み: "Đã thay thế",
  "公開中の版が変わりました。新しくレビュー依頼が必要です。":
    "Phiên bản đang phát hành đã thay đổi. Cần gửi duyệt mới.",
  "プラットフォームが更新されました。再チェックしてください。":
    "Nền tảng đã được cập nhật. Vui lòng kiểm tra lại.",
  まだ公開されていません: "Chưa phát hành",
  "承認済みのスナップショットを公開すると、お客様用の URL がここに表示されます。":
    "Khi phát hành ảnh chụp đã duyệt, URL cho khách hàng sẽ hiển thị ở đây.",
  公開中のフォームを新しいタブで開く: "Mở biểu mẫu đang phát hành trong thẻ mới",
  "お客様はこの URL からフォームに回答します（ローカル合成環境）。":
    "Khách hàng trả lời biểu mẫu qua URL này (môi trường giả lập local).",
  内容を確認: "Xem nội dung",
  "このレビューを承認しますか？": "Phê duyệt bản duyệt này?",
  "承認すると公開担当者が公開できるようになります。送信データの構造（Data Contract）を確認済みとして記録します。":
    "Sau khi phê duyệt, người phát hành có thể phát hành. Cấu trúc dữ liệu gửi (Data Contract) được ghi nhận là đã xác nhận.",
  承認する: "Phê duyệt",
  承認しました: "Đã phê duyệt",
  "このレビューを差し戻しますか？": "Trả lại bản duyệt này?",
  "編集者が修正して再度レビュー依頼できます。": "Người biên tập có thể sửa và gửi duyệt lại.",
  差し戻す: "Trả lại",
  差し戻しました: "Đã trả lại",
  承認にはレビュー担当の権限が必要です: "Cần quyền người duyệt để phê duyệt",
  再チェックしました: "Đã kiểm tra lại",
  "このスナップショットを公開しますか？": "Phát hành ảnh chụp này?",
  "承認済みの内容をローカル環境に公開します。お客様用 URL にすぐ反映され、あとから以前の版に戻せます。":
    "Phát hành nội dung đã duyệt lên môi trường local. URL cho khách được cập nhật ngay và có thể quay về phiên bản trước sau đó.",
  公開する: "Phát hành",
  "公開処理中…": "Đang phát hành…",
  "この版へロールバックしますか？": "Quay về phiên bản này?",
  ロールバックする: "Quay về",
  現在公開中: "Đang phát hành",
  レビュー: "Duyệt",
  まだレビュー依頼はありません: "Chưa có yêu cầu duyệt",
  "フォームが完成したら「レビュー依頼」で承認を依頼します。":
    'Khi biểu mẫu hoàn thành, hãy yêu cầu phê duyệt bằng "Gửi duyệt".',
  "編集者がレビューを依頼すると、ここに表示されます。":
    "Khi người biên tập gửi duyệt, yêu cầu sẽ hiển thị ở đây.",
  公開処理: "Tiến trình phát hành",
  公開履歴: "Lịch sử phát hành",
  "公開履歴はまだありません。": "Chưa có lịch sử phát hành.",
  実行者: "Người thực hiện",
  操作: "Thao tác",
  対象: "Đối tượng",
  // Server error codes and diagnostics (state.js)
  "セッションの有効期限が切れました。再ログインしてください。":
    "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
  "この操作を行う権限がありません。": "Bạn không có quyền thực hiện thao tác này.",
  "セキュリティトークンが無効です。ページを再読み込みしてください。":
    "Mã bảo mật không hợp lệ. Vui lòng tải lại trang.",
  "他の場所で更新されています。最新版と比較してください。":
    "Đã được cập nhật ở nơi khác. Hãy so sánh với bản mới nhất.",
  "対象が見つかりません。": "Không tìm thấy đối tượng.",
  "フォームに修正が必要な箇所があります。": "Biểu mẫu có chỗ cần sửa.",
  "フォームが大きすぎます。": "Biểu mẫu quá lớn.",
  "フォーム名を 1〜200 文字で入力してください。": "Vui lòng nhập tên biểu mẫu từ 1–200 ký tự.",
  "対象のサイトまたはフォームが一致しません。": "Trang hoặc biểu mẫu không khớp.",
  "レビュー後に変更があったため、再確認が必要です。":
    "Có thay đổi sau khi duyệt nên cần kiểm tra lại.",
  "公開前に再チェックが必要です。": "Cần kiểm tra lại trước khi phát hành.",
  "プラットフォームが更新されたため、再チェックが必要です。":
    "Nền tảng đã được cập nhật nên cần kiểm tra lại.",
  "公開状態が変わりました。最新の状態を確認してください。":
    "Trạng thái phát hành đã thay đổi. Hãy kiểm tra trạng thái mới nhất.",
  "別の公開処理が進行中です。完了を待ってから再実行してください。":
    "Đang có một lần phát hành khác. Hãy chờ hoàn tất rồi thử lại.",
  "プレビューの有効期限が切れました。開き直してください。":
    "Bản xem trước đã hết hạn. Vui lòng mở lại.",
  "この操作はプレビューでのみ利用できます。": "Thao tác này chỉ dùng được trong bản xem trước.",
  "Data Contract の変更確認が必要です。": "Cần xác nhận thay đổi Data Contract.",
  "データ分類は下げられません。": "Không thể hạ mức phân loại dữ liệu.",
  "互換性のない変更です。既存のフィールドを変更せず、新しいフィールドとして追加してください。":
    "Thay đổi không tương thích. Đừng sửa trường hiện có; hãy thêm thành trường mới.",
  "データキーが重複しています。": "Khóa dữ liệu bị trùng.",
  データキーが重複しています: "Khóa dữ liệu bị trùng",
  "公開済みのフォームは削除できません。": "Không thể xóa biểu mẫu đã phát hành.",
  "この版には戻せません。": "Không thể quay về phiên bản này.",
  "この言語の組み合わせには対応していません。": "Không hỗ trợ cặp ngôn ngữ này.",
  "公開用ビルドに失敗しました。": "Tạo bản dựng phát hành thất bại.",
  "共通ブロックが利用できない状態です。": "Khối dùng chung hiện không dùng được.",
  "プラグインの準備ができていません。": "Plugin chưa sẵn sàng.",
  "サーバーに接続できません。ローカル環境が起動しているか確認してください。":
    "Không kết nối được máy chủ. Hãy kiểm tra môi trường local đã chạy chưa.",
  条件の比較方法がフィールドの種類と合っていません:
    "Cách so sánh điều kiện không phù hợp với loại trường",
  値の種類が正しくありません: "Kiểu giá trị không đúng",
  "参照先（フィールドまたは条件）が見つかりません":
    "Không tìm thấy đối tượng tham chiếu (trường hoặc điều kiện)",
  このステップから参照できないフィールドが使われています:
    "Đang dùng trường không thể tham chiếu từ bước này",
  後ろのステップのフィールドは参照できません: "Không thể tham chiếu trường của bước phía sau",
  この参照方法には対応していません: "Không hỗ trợ cách tham chiếu này",
  "数値が許容範囲外です（整数を入力してください）":
    "Số nằm ngoài phạm vi cho phép (hãy nhập số nguyên)",
  条件の値が不足しています: "Thiếu giá trị điều kiện",
  "ID の形式が正しくありません": "Định dạng ID không đúng",
  "削除済みの ID は再利用できません": "Không thể dùng lại ID đã xóa",
  条件または計算が循環しています: "Điều kiện hoặc phép tính bị vòng lặp",
  "ID またはデータキーが重複しています": "ID hoặc khóa dữ liệu bị trùng",
  データ分類が必要な水準より低く設定されています: "Mức phân loại dữ liệu thấp hơn mức cần thiết",
  "「次のステップ」が未設定のステップがあります": 'Có bước chưa đặt "Bước tiếp theo"',
  ステップの移動がループしています: "Việc chuyển bước bị lặp vòng",
  到達できないステップがあります: "Có bước không thể tới được",
  "フォームの上限（項目数など）を超えています": "Vượt giới hạn của biểu mẫu (số mục, v.v.)",
  フォーム定義の形式が正しくありません: "Định dạng định nghĩa biểu mẫu không đúng",
  "選択肢の設定が正しくありません（値の重複など）":
    "Cấu hình lựa chọn không đúng (trùng giá trị, v.v.)",
  最初のステップの設定が正しくありません: "Cấu hình bước đầu tiên không đúng",
  表示専用の項目は送信データに含められません: "Mục chỉ hiển thị không thể đưa vào dữ liệu gửi",
  プラグインの利用宣言がありません: "Thiếu khai báo sử dụng plugin",
  共通ブロックが見つかりません: "Không tìm thấy khối dùng chung",
  共通ブロックの非公開項目は参照できません:
    "Không thể tham chiếu mục không công khai của khối dùng chung",
  共通ブロックの固定リビジョンが正しくありません:
    "Phiên bản cố định của khối dùng chung không đúng",
  共通ブロックの入力設定が正しくありません: "Cấu hình đầu vào của khối dùng chung không đúng",
  共通ブロックの識別情報が一致しません: "Thông tin nhận dạng của khối dùng chung không khớp",
  脆弱性のある共通ブロックは使用できません: "Không thể dùng khối dùng chung có lỗ hổng",
  承認されていないテーマです: "Theme chưa được phê duyệt",
  ステップの設定が正しくありません: "Cấu hình bước không đúng",
  "スキップ条件が正しくありません（分岐のないステップのみ、前のステップの項目を参照）":
    "Điều kiện bỏ qua không đúng (chỉ cho bước không rẽ nhánh, tham chiếu mục của bước trước)",
  計算式が正しくありません: "Công thức tính không đúng",
  どのステップにも配置されていないフィールドがあります: "Có trường chưa được đặt vào bước nào",
  言語設定が正しくありません: "Cấu hình ngôn ngữ không đúng",
  完了ステップの設定が正しくありません: "Cấu hình bước hoàn tất không đúng",
  "モーション「なし」では詳細設定を指定できません":
    'Không thể đặt cấu hình chi tiết khi chuyển động là "Không"',
  プラグインが利用できません: "Không dùng được plugin",
  プラグインの準備ができていません: "Plugin chưa sẵn sàng",
  定義を確認してください: "Hãy kiểm tra định nghĩa",
  "操作を完了できませんでした。": "Không thể hoàn tất thao tác.",
  フィールドがありません: "Chưa có trường",
  "「次のステップ」が未設定です": 'Chưa đặt "Bước tiếp theo"',
  表示名が空です: "Tên hiển thị đang trống",
  選択肢がありません: "Chưa có lựa chọn",
  削除されたフィールドを参照するルールがあります: "Có quy tắc tham chiếu trường đã bị xóa",
}))
  if (!exact.has(ja)) exact.set(ja, vi);
const patterns = [
  [/^選択肢 (\d+) の表示名$/, "Tên hiển thị lựa chọn $1"],
  [/^選択肢 (\d+) の値$/, "Giá trị lựa chọn $1"],
  [/^選択肢 (\d+) を上へ移動$/, "Chuyển lựa chọn $1 lên"],
  [/^選択肢 (\d+) を削除$/, "Xóa lựa chọn $1"],
  [/^値 (\d+)$/, "Giá trị $1"],
  [/^分岐 (\d+)$/, "Nhánh $1"],
  [/^優先 (\d+)$/, "Ưu tiên $1"],
  [/^分岐 (\d+) の優先度を上げる$/, "Tăng ưu tiên nhánh $1"],
  [/^分岐 (\d+) の優先度を下げる$/, "Giảm ưu tiên nhánh $1"],
  [/^分岐 (\d+) の移動先$/, "Đích của nhánh $1"],
  [/^確認事項 (\d+) 件$/, "$1 điểm cần kiểm tra"],
  [
    /^このフィールドを参照する条件・計算が (\d+) 件あります。削除後は診断で修正が必要です。$/,
    "Có $1 điều kiện/phép tính tham chiếu trường này. Sau khi xóa cần sửa theo kết quả chẩn đoán.",
  ],
  [
    /^このステップの項目 (\d+) 件も削除されます。このステップへの移動は次のステップへ付け替えます。$/,
    "$1 mục trong bước này cũng sẽ bị xóa. Các chuyển hướng tới bước này sẽ được nối sang bước kế tiếp.",
  ],
  [
    /^使用箇所 (\d+)件に参照が残ります。削除後は診断で修正が必要です。$/,
    "Còn tham chiếu ở $1 vị trí. Sau khi xóa cần sửa theo kết quả chẩn đoán.",
  ],
  [/^(.+) を追加・変更$/s, "Thêm/sửa: $1"],
  [/^(.+) を削除$/s, "Xóa: $1"],
  [/^(.+) を変更$/s, "Thay đổi: $1"],
  // Role lists such as "編集者・レビュー担当"; only when every part is a known label.
  [
    /^[^・\s]+(?:・[^・\s]+)+$/,
    (s) => {
      const parts = s.split("・");
      return parts.every((p) => exact.has(p)) ? parts.map((p) => exact.get(p)).join(", ") : s;
    },
  ],
  [/^(.+) · v(\d+)$/, (_, s, v) => (exact.get(s) ?? s) + " · v" + v],
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
function setLocale(next) {
  locale = next === "vi" ? "vi" : "ja";
  try {
    window.sessionStorage.setItem(storageKey, locale);
  } catch {
    // Not persisted; the choice still applies to this page view.
  }
  document.documentElement.lang = locale === "vi" ? "vi-VN" : "ja-JP";
  apply(document.body);
}
document.addEventListener("studio:locale", (event) => setLocale(event.detail));
setLocale(locale);

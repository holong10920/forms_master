import { titles, labels } from "./reference-labels.ts";
import type { EngineIRV1 } from "@fb/contracts";
type Texts = NonNullable<EngineIRV1["texts"]>;
/** Built-in customer-runtime messages: data only, compiled into the pinned IR (ja default). */
export const systemTexts = {
  requiredBadge: { ja: "必須", vi: "Bắt buộc" },
  optionalBadge: { ja: "任意", vi: "Tùy chọn" },
  progressLabel: { ja: "お申し込みの流れ", vi: "Các bước đăng ký" },
  syntheticNotice: { ja: "合成データのみ", vi: "Chỉ dữ liệu giả lập" },
  next: { ja: "次へ", vi: "Tiếp theo" },
  back: { ja: "戻る", vi: "Quay lại" },
  submit: { ja: "ローカル模擬受付", vi: "Gửi (mô phỏng cục bộ)" },
  selectPrompt: { ja: "選択してください", vi: "Vui lòng chọn" },
  reviewTitle: { ja: "入力内容の確認", vi: "Xác nhận nội dung đã nhập" },
  payloadTitle: {
    ja: "送信プレビュー（合成データ）",
    vi: "Xem trước dữ liệu gửi (dữ liệu giả lập)",
  },
  errorSummary: {
    ja: "入力内容を確認してください。",
    vi: "Vui lòng kiểm tra lại nội dung đã nhập.",
  },
  completeTitle: { ja: "ローカル模擬受付完了", vi: "Đã tiếp nhận (mô phỏng cục bộ)" },
  completeBody: {
    ja: "実際の申込・外部送信は行っていません。",
    vi: "Không có đăng ký thực tế hay gửi dữ liệu ra bên ngoài.",
  },
  emptyValue: { ja: "未入力", vi: "Chưa nhập" },
  yes: { ja: "はい", vi: "Có" },
  no: { ja: "いいえ", vi: "Không" },
  referenceLabel: { ja: "受付番号", vi: "Mã tiếp nhận" },
  referencePreview: {
    ja: "プレビューでは受付番号は発行されません",
    vi: "Bản xem trước không cấp mã tiếp nhận",
  },
  invalidNumber: { ja: "安全な整数を入力してください", vi: "Vui lòng nhập một số nguyên hợp lệ" },
  formatEmail: { ja: "メールアドレスの形式を確認してください", vi: "Email không hợp lệ" },
  formatPhoneJP: {
    ja: "0から始まる10〜11桁で入力してください",
    vi: "Nhập số điện thoại 10–11 chữ số bắt đầu bằng 0",
  },
  formatPostalJP: { ja: "郵便番号を7桁で入力してください", vi: "Nhập mã bưu điện 7 chữ số" },
  formatKatakana: { ja: "全角カタカナで入力してください", vi: "Nhập Katakana toàn chiều rộng" },
  formatDate: {
    ja: "有効な日付を入力してください (1900–2100)",
    vi: "Nhập ngày hợp lệ (1900–2100)",
  },
  required: { ja: "必須項目です", vi: "Đây là mục bắt buộc" },
  mustBeTrue: { ja: "同意が必要です", vi: "Bạn cần đồng ý để tiếp tục" },
  minLength: { ja: "{n}文字以上で入力してください", vi: "Vui lòng nhập ít nhất {n} ký tự" },
  maxLength: { ja: "{n}文字以内で入力してください", vi: "Vui lòng nhập tối đa {n} ký tự" },
  min: { ja: "{n}以上の値を入力してください", vi: "Vui lòng nhập giá trị từ {n} trở lên" },
  max: { ja: "{n}以下の値を入力してください", vi: "Vui lòng nhập giá trị không quá {n}" },
  minItems: { ja: "{n}件以上選択してください", vi: "Vui lòng chọn ít nhất {n} mục" },
  maxItems: { ja: "{n}件以内で選択してください", vi: "Vui lòng chọn tối đa {n} mục" },
  exclusiveOption: {
    ja: "この選択肢は他の選択肢と同時に選べません",
    vi: "Lựa chọn này không thể chọn cùng các lựa chọn khác",
  },
} satisfies Texts;
/** Resolves every message for each supported locale into the pinned IR, so the runtime carries
 * no message strings. Form overrides win; empty strings fall back to the built-in text. */
export function localize(ir: EngineIRV1): void {
  for (const node of ir.nodes)
    for (const field of node.type === "group" ? [node, ...node.fields] : [node]) {
      field.label = { ...field.label, ja: field.label?.ja || titles[field.id] || field.key };
      if (field.type !== "group")
        for (const option of field.options ?? [])
          option.label = {
            ...option.label,
            ja: option.label?.ja || labels[option.value] || option.value,
          };
    }
  const supported = ir.locale?.supported ?? ["ja"];
  const texts: Texts = {};
  for (const key of Object.keys({ ...systemTexts, ...ir.texts }) as (keyof Texts)[]) {
    const own = ir.texts?.[key],
      base: { ja?: string; vi?: string } =
        (systemTexts as Record<string, { ja: string; vi: string }>)[key] ?? {};
    const entry = Object.fromEntries(
      supported.flatMap((l) => {
        const value = own?.[l] || base[l];
        return value ? [[l, value]] : [];
      }),
    );
    if (Object.keys(entry).length) texts[key] = entry;
  }
  ir.texts = texts;
}

import { h, field, input, select, btn, L } from "./ui.js";
import { commit } from "./rules.js";
let viewport = "desktop";
const numbers = [
  ["logoHeight", "ロゴ高さ", 20, 48],
  ["controlHeight", "入力高さ", 36, 64],
  ["controlRadius", "入力角丸", 0, 16],
  ["maxWidth", "最大幅 / Chiều rộng tối đa", 320, 960],
  ["padding", "内側余白 / Đệm", 0, 64],
  ["margin", "外側余白 / Lề", 0, 64],
  ["gap", "間隔 / Khoảng cách", 0, 64],
  ["columns", "列 / Số cột", 1, 3],
  ["fontSize", "文字サイズ / Cỡ chữ", 12, 24],
  ["radius", "角丸 / Bo góc", 0, 32],
  ["borderWidth", "枠線 / Độ dày viền", 0, 4],
];
export function appearanceEditor(owner) {
  const out = [];
  out.push(
    field(
      "対象画面 / Màn hình",
      select(
        [
          ["desktop", "PC"],
          ["mobile", "Mobile < 640px"],
        ],
        viewport,
        (v) => {
          viewport = v;
          commit();
        },
      ),
    ),
  );
  const current = viewport === "mobile" ? owner.appearance?.mobile : owner.appearance;
  function set(key, value) {
    owner.appearance ??= {};
    const values = viewport === "mobile" ? (owner.appearance.mobile ??= {}) : owner.appearance;
    if (value === "") {
      const remaining = Object.fromEntries(Object.entries(values).filter(([k]) => k !== key));
      if (viewport === "mobile") owner.appearance.mobile = remaining;
      else owner.appearance = remaining;
    } else values[key] = value;
    commit();
  }
  for (const [key, label, min, max] of numbers)
    out.push(
      field(
        label,
        input(current?.[key] ?? "", {
          type: "number",
          min,
          max,
          step: 1,
          placeholder: L("継承", "Kế thừa"),
          onCommit: (v, el) => {
            if (v !== "" && (!Number.isInteger(Number(v)) || Number(v) < min || Number(v) > max)) {
              el.setAttribute("aria-invalid", "true");
              return;
            }
            set(key, v === "" ? "" : Number(v));
          },
        }),
      ),
    );
  for (const [key, label] of [
    ["color", "文字色 / Màu chữ"],
    ["background", "背景色 / Nền"],
    ["borderColor", "枠線色 / Màu viền"],
  ])
    out.push(
      field(
        label,
        input(current?.[key] ?? "", {
          placeholder: "#112233",
          onCommit: (v, el) => {
            if (v !== "" && !/^#[0-9a-fA-F]{6}$/.test(v)) {
              el.setAttribute("aria-invalid", "true");
              return;
            }
            set(key, v);
          },
        }),
      ),
    );
  out.push(
    field(
      "配置 / Căn lề",
      select(
        [
          ["", "継承 / Kế thừa"],
          ["left", "左 / Trái"],
          ["center", "中央 / Giữa"],
          ["right", "右 / Phải"],
        ],
        current?.align ?? "",
        (v) => set("align", v),
      ),
    ),
  );
  out.push(
    field(
      "文字の太さ / Độ đậm",
      select(
        [
          ["", "継承"],
          ["400", "400"],
          ["500", "500"],
          ["600", "600"],
          ["700", "700"],
        ],
        String(current?.fontWeight ?? ""),
        (v) => set("fontWeight", v === "" ? "" : Number(v)),
      ),
    ),
  );
  out.push(
    field(
      "影 / Đổ bóng",
      select(
        [
          ["", "継承 / Kế thừa"],
          ["none", "なし / Không"],
          ["soft", "柔らかい / Nhẹ"],
        ],
        current?.shadow ?? "",
        (v) => set("shadow", v),
      ),
    ),
  );
  for (const [key, label] of [
    ["primaryColor", "メイン色"],
    ["secondaryColor", "補助色"],
    ["requiredColor", "必須バッジ色"],
    ["inputBorderColor", "入力枠色"],
    ["focusColor", "フォーカス色"],
    ["controlBackground", "入力背景色"],
    ["selectedBackground", "選択背景色"],
    ["optionalColor", "任意バッジ色"],
    ["pageBackground", "ページ背景色"],
  ])
    out.push(
      field(
        label,
        input(current?.[key] ?? "", {
          placeholder: "#008b46",
          onCommit: (v, el) => {
            if (v && !/^#[a-fA-F0-9]{6}$/.test(v)) {
              el.setAttribute("aria-invalid", "true");
              return;
            }
            set(key, v);
          },
        }),
      ),
    );
  for (const [key, label, choices] of [
    [
      "labelVisibility",
      "ラベル表示",
      [
        ["visible", "表示"],
        ["visuallyHidden", "読み上げ専用"],
      ],
    ],
    [
      "headerVariant",
      "ヘッダー配置",
      [
        ["inline", "フォーム内"],
        ["fullWidth", "全幅・固定"],
      ],
    ],
    [
      "controlStyle",
      "入力スタイル",
      [
        ["standard", "標準"],
        ["outlined", "入力済みを枠で表示"],
      ],
    ],
    [
      "labelWeight",
      "ラベルの太さ",
      [
        ["400", "400"],
        ["500", "500"],
        ["600", "600"],
        ["700", "700"],
      ],
    ],
    [
      "requiredBadge",
      "必須バッジ形式",
      [
        ["solid", "塗り"],
        ["outline", "枠線"],
      ],
    ],
    [
      "fontFamily",
      "フォント",
      [
        ["system", "System"],
        ["hiragino", "Hiragino / Yu Gothic"],
        ["noto", "Noto Sans JP"],
      ],
    ],
    [
      "headerLogo",
      "ヘッダーロゴ",
      [
        ["none", "なし"],
        ["instrument-local", "楽器（承認済ローカル画像）"],
      ],
    ],
    [
      "progressStyle",
      "進捗表示",
      [
        ["circles", "丸"],
        ["bar", "バー"],
        ["compact", "コンパクト・商品ステージ"],
      ],
    ],
  ])
    out.push(
      field(
        label,
        select([["", "継承"], ...choices], current?.[key] ?? "", (v) =>
          set(key, key === "labelWeight" && v ? Number(v) : v),
        ),
      ),
    );
  out.push(
    field(
      "ヘッダー文言",
      input(current?.headerText ?? "", { maxLength: 100, onCommit: (v) => set("headerText", v) }),
    ),
  );
  out.push(
    btn(
      "スタイルをリセット / Đặt lại",
      () => {
        delete owner.appearance;
        commit();
      },
      { size: "sm" },
    ),
    h(
      "p",
      { class: "small muted" },
      "宣言的な値のみ。CSS/JavaScript・任意URLは使用できません。 / Chỉ cho phép giá trị khai báo.",
    ),
  );
  return out;
}

import { h, field, input, select, btn } from "./ui.js";
import { commit } from "./rules.js";
/** Item-scoped structured conditions, including nested all/any. */
export function itemCondition(group, value, update, title = "表示条件") {
  const current = value ?? { op: "isNotEmpty", args: [{ item: group.fields[0].id }] };
  const op = current.op ?? "isNotEmpty";
  const change = (v) => {
    update(v);
    commit();
  };
  const out = [
    field(
      title + "の種類",
      select(
        [
          ["", "常に表示"],
          ["eq", "一致"],
          ["in", "いずれかに一致"],
          ["isNotEmpty", "入力あり"],
          ["and", "すべて"],
          ["or", "いずれか"],
          ["not", "反転"],
        ],
        value ? op : "",
        (next) => {
          if (!next) return change(undefined);
          if (["and", "or"].includes(next))
            return change({
              op: next,
              args: [{ op: "isNotEmpty", args: [{ item: group.fields[0].id }] }],
            });
          if (next === "not")
            return change({
              op: next,
              args: [{ op: "isNotEmpty", args: [{ item: group.fields[0].id }] }],
            });
          change({
            op: next,
            args: [
              { item: current.args?.[0]?.item ?? group.fields[0].id },
              ...(next === "isNotEmpty" ? [] : [{ const: next === "in" ? [] : "" }]),
            ],
          });
        },
      ),
    ),
  ];
  if (!value) return out;
  if (["and", "or", "not"].includes(op)) {
    for (const [index, child] of current.args.entries())
      out.push(
        h(
          "div",
          {},
          ...itemCondition(
            group,
            child,
            (next) => {
              const args = [...current.args];
              if (next) args[index] = next;
              else args.splice(index, 1);
              update(args.length ? { ...current, args } : undefined);
            },
            title + " " + String(index + 1),
          ),
        ),
      );
    if (op !== "not")
      out.push(
        btn(
          title + "を追加",
          () =>
            change({
              ...current,
              args: [...current.args, { op: "isNotEmpty", args: [{ item: group.fields[0].id }] }],
            }),
          { size: "sm" },
        ),
      );
  } else {
    out.push(
      field(
        title + "の参照",
        select(
          group.fields.map((f) => [f.id, f.label?.ja ?? f.key]),
          current.args?.[0]?.item ?? group.fields[0].id,
          (id) => change({ ...current, args: [{ item: id }, ...current.args.slice(1)] }),
        ),
      ),
    );
    if (op !== "isNotEmpty")
      out.push(
        field(
          title + "の値" + (op === "in" ? "（カンマ区切り）" : ""),
          input(
            op === "in"
              ? (current.args?.[1]?.const ?? []).join(",")
              : (current.args?.[1]?.const ?? ""),
            {
              onCommit: (v) =>
                change({
                  ...current,
                  args: [
                    current.args[0],
                    {
                      const:
                        op === "in"
                          ? v
                              .split(",")
                              .map((s) => s.trim())
                              .filter(Boolean)
                          : v,
                    },
                  ],
                }),
            },
          ),
        ),
      );
  }
  return out;
}

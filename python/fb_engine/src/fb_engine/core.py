"""G1 executable IR semantics. Inputs are trusted IR plus untrusted typed values."""

from collections.abc import Callable
from math import isfinite
from typing import Any, TypedDict, cast

type Scalar = str | int | bool
type Cell = Scalar | list[Scalar]


class GroupValue(TypedDict):
    order: list[str]
    items: dict[str, dict[str, Cell]]


type Value = Cell | GroupValue
type IR = dict[str, Any]
MAX_INTEGER = 2**53 - 1
TRIM = (
    "\u0009\u000a\u000b\u000c\u000d\u0020\u00a0\u1680"
    "\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a"
    "\u2028\u2029\u202f\u205f\u3000\ufeff"
)


class EngineError(Exception):
    def __init__(self, code: str, path: str = "") -> None:
        self.code, self.path = code, path
        super().__init__(code)


def checked(value: int) -> int:
    if abs(value) > MAX_INTEGER:
        raise EngineError("E-NUM-RANGE")
    return value


def field_id(ref: str) -> str:
    if not ref.startswith("$local:"):
        raise EngineError("E-REF-UNSUPPORTED")
    return ref[7:]


def normalize(value: Any, field: IR) -> Value | None:
    if field["type"] == "group":
        return normalize_group(value, field)
    if value is None:
        raise EngineError("E-PAYLOAD-NULL", field["id"])
    if isinstance(value, str):
        value = value.strip(TRIM)
    if value == "" or (isinstance(value, list) and not value):
        return None
    kind = field["type"]
    if kind == "number":
        if type(value) not in (int, float) or not isfinite(value) or int(value) != value:
            raise EngineError("E-TYPE", field["id"])
        if abs(value) > MAX_INTEGER:
            raise EngineError("E-NUM-RANGE", field["id"])
        value = int(value)
    elif kind == "boolean":
        if type(value) is not bool:
            raise EngineError("E-TYPE", field["id"])
    elif kind == "choice.checkboxes":
        if (
            not isinstance(value, list)
            or not all(isinstance(v, str) for v in value)
            or len(set(value)) != len(value)
        ):
            raise EngineError("E-TYPE", field["id"])
    elif kind == "calculated":
        if type(value) not in (str, bool, int):
            raise EngineError("E-TYPE", field["id"])
        if type(value) is int:
            checked(value)
    elif not isinstance(value, str):
        raise EngineError("E-TYPE", field["id"])
    if "options" in field:
        options = [o["value"] for o in field["options"]]
        if any(v not in options for v in (value if isinstance(value, list) else [value])):
            raise EngineError("E-OPTION", field["id"])
    return cast(Value, value)


def empty(value: Value | None) -> bool:
    return value is None or value == "" or (isinstance(value, list) and not value)


def boolean(value: Value | None) -> bool:
    if type(value) is not bool:
        raise EngineError("E-TYPE-OPERATOR")
    return value


def number(value: Value | None) -> int:
    if type(value) is not int:
        raise EngineError("E-TYPE-OPERATOR")
    return checked(value)


def evaluate(expr: IR, read: Callable[[str], Value | None], conditions: IR) -> Value | None:
    if "const" in expr:
        v = expr["const"]
        return cast(Value, int(v) if type(v) is float and isfinite(v) and v.is_integer() else v)
    if "item" in expr:
        return read("$item:" + expr["item"])
    if "ref" in expr:
        return read(field_id(expr["ref"]))
    if "cond" in expr:
        if expr["cond"] not in conditions:
            raise EngineError("E-REF-DANGLING", expr["cond"])
        return evaluate(conditions[expr["cond"]]["when"], read, conditions)
    op = expr["op"]
    if op == "choose":
        branch = 1 if boolean(evaluate(expr["args"][0], read, conditions)) else 2
        return evaluate(expr["args"][branch], read, conditions)
    if op in ("sum", "count", "any", "all"):
        group = evaluate(expr["args"][0], read, conditions)
        if isinstance(group, dict):
            if len(expr["args"]) == 1:
                if op != "count":
                    raise EngineError("E-ARITY")
                return len(group["order"])
            values = []
            for item_id in group["order"]:

                def item_read(key: str, item_id: str = item_id) -> Value | None:
                    return (
                        group["items"][item_id].get(key[6:])
                        if key.startswith("$item:")
                        else read(key)
                    )

                values.append(evaluate(expr["args"][1], item_read, conditions))
            if op == "sum":
                total = 0
                for v in values:
                    if v is not None:
                        total = checked(total + number(v))
                return total
            booleans = [boolean(v) for v in values]
            return (
                sum(booleans) if op == "count" else any(booleans) if op == "any" else all(booleans)
            )
    args = [evaluate(e, read, conditions) for e in expr["args"]]
    x = args[0] if args else None
    y = args[1] if len(args) > 1 else None
    if op in ("isEmpty", "isNotEmpty"):
        return empty(x) if op == "isEmpty" else not empty(x)
    if op in ("and", "or"):
        values = [boolean(v) for v in args]
        return all(values) if op == "and" else any(values)
    if op == "not":
        return not boolean(x)
    if op in ("eq", "neq"):
        eq = type(x) is type(y) and x == y
        return not empty(x) and not empty(y) and (eq if op == "eq" else not eq)
    if op in ("in", "notIn"):
        found = isinstance(y, list) and any(type(x) is type(v) and x == v for v in y)
        return not empty(x) and isinstance(y, list) and (found if op == "in" else not found)
    if op == "includes":
        return (
            isinstance(x, list) and not empty(y) and any(type(y) is type(v) and y == v for v in x)
        )
    if op == "includesAny":
        return (
            isinstance(x, list)
            and isinstance(y, list)
            and any(type(a) is type(b) and a == b for a in x for b in y)
        )
    if op in ("lt", "lte", "gt", "gte"):
        if empty(x) or empty(y):
            return False
        a, b = number(x), number(y)
        return {"lt": a < b, "lte": a <= b, "gt": a > b, "gte": a >= b}[op]
    if op == "count":
        if empty(x):
            return 0
        if not isinstance(x, list):
            raise EngineError("E-TYPE-OPERATOR")
        return len(x)
    if op in ("sum", "any", "all"):
        if empty(x):
            return True if op == "all" else 0 if op == "sum" else False
        if not isinstance(x, list):
            raise EngineError("E-TYPE-OPERATOR")
        if op == "sum":
            total = 0
            for v in x:
                total = checked(total + number(v))
            return total
        values = [boolean(v) for v in x]
        return any(values) if op == "any" else all(values)
    if any(v is None for v in args):
        return None
    if op == "concat":
        if not all(isinstance(v, str) for v in args):
            raise EngineError("E-TYPE-OPERATOR")
        return "".join(cast(list[str], args))
    numbers = [number(v) for v in args]
    if not numbers:
        raise EngineError("E-ARITY")
    if op == "min":
        return min(numbers)
    if op == "max":
        return max(numbers)
    total = numbers[0]
    for v in numbers[1:]:
        if op == "add":
            total = checked(total + v)
        elif op == "subtract":
            total = checked(total - v)
        elif op == "multiply":
            total = checked(total * v)
        else:
            raise EngineError("E-OPERATOR")
    return total


def references(expr: IR, conditions: IR, pending: frozenset[str] = frozenset()) -> list[str]:
    if "ref" in expr:
        return [field_id(expr["ref"])]
    if "const" in expr or "item" in expr:
        return []
    if "cond" in expr:
        key = expr["cond"]
        if key in pending:
            raise EngineError("E-DEPENDENCY-CYCLE", key)
        if key not in conditions:
            raise EngineError("E-REF-DANGLING", key)
        return references(conditions[key]["when"], conditions, pending | {key})
    return [ref for arg in expr["args"] for ref in references(arg, conditions, pending)]


def field_order(ir: IR) -> list[IR]:
    result: list[IR] = []
    done: set[str] = set()
    pending: set[str] = set()
    fields = {f["id"]: f for f in ir["nodes"]}

    def visit(key: str) -> None:
        if key in done:
            return
        if key in pending:
            raise EngineError("E-DEPENDENCY-CYCLE", key)
        if key not in fields:
            raise EngineError("E-REF-DANGLING", key)
        pending.add(key)
        f = fields[key]
        expressions = [f[p] for p in ("visibleWhen", "requiredWhen", "formula") if p in f]
        if f["type"] == "group":
            expressions += [
                child[p]
                for child in f["fields"]
                for p in ("visibleWhen", "requiredWhen", "formula")
                if p in child
            ]
        for expr in expressions:
            for dep in sorted(references(expr, ir["conditions"])):
                visit(dep)
        pending.remove(key)
        done.add(key)
        result.append(f)

    for key in sorted(fields):
        visit(key)
    return result


def snapshot(ir: IR, state: IR, submit: bool = False) -> IR:
    path: list[str] = []
    active: set[str] = set()
    effective: dict[str, Value] = {}
    errors: list[IR] = []
    order = field_order(ir)
    steps = {s["id"]: s for s in ir["steps"]}
    key: str | None = ir["steps"][0]["id"]
    past_current = False
    while key:
        if key in path or len(path) >= len(steps):
            raise EngineError("E-GRAPH-CYCLE")
        step = steps[key]

        def read(name: str) -> Value | None:
            return effective.get(name) if name in active else None

        skipped = "skipWhen" in step and evaluate(step["skipWhen"], read, ir["conditions"]) is True
        if not skipped:
            path.append(key)
            if step["kind"] != "complete" and (submit or not past_current):
                members = {
                    field_id(c.get("field", c.get("group", ""))) for c in step.get("content", [])
                }
                for f in order:
                    if f["id"] not in members:
                        continue
                    if (
                        "visibleWhen" in f
                        and evaluate(f["visibleWhen"], read, ir["conditions"]) is not True
                    ):
                        continue
                    active.add(f["id"])
                    if f["type"] == "group":
                        group, addresses, group_errors = effective_group(
                            f,
                            normalize_group(
                                state["values"].get(f["id"], {"order": [], "items": {}}), f
                            ),
                            read,
                            ir["conditions"],
                        )
                        effective[f["id"]] = group
                        active.update(addresses)
                        errors.extend(group_errors)
                        continue
                    try:
                        if "formula" in f:
                            value = evaluate(f["formula"], read, ir["conditions"])
                        else:
                            value = state["values"].get(f["id"])
                        if value is not None:
                            value = normalize(value, f)
                            if value is not None:
                                effective[f["id"]] = value
                        elif f["id"] in state["values"] and "formula" not in f:
                            raise EngineError("E-PAYLOAD-NULL", f["id"])
                    except EngineError as e:
                        errors.append({"code": e.code, "path": f["id"]})
            if key == state["current"]:
                past_current = True
        if step["kind"] == "complete":
            break
        key = None
        for t in step.get("transitions", []):
            if "default" in t:
                key = t["default"]
                break
            if evaluate(t["when"], read, ir["conditions"]) is True:
                key = t["to"]
                break
        if key is None:
            raise EngineError("E-GRAPH-NO-DEFAULT")
    return {"path": path, "active": active, "effective": effective, "errors": errors}


def cell_issues(f: IR, value: Cell | None, required: bool) -> list[IR]:
    if required and value is None:
        return [{"code": "required", "path": f["id"]}]
    if value is None:
        return []
    errors: list[IR] = []
    for v in f.get("validators", []):
        name, limit = v["use"], v.get("params", {}).get("value", 0)
        ok = True
        if name == "mustBeTrue":
            ok = value is True
        elif name in ("minLength", "maxLength"):
            ok = isinstance(value, str) and (
                len(value) >= limit if name == "minLength" else len(value) <= limit
            )
        elif name in ("min", "max"):
            ok = type(value) is int and (value >= limit if name == "min" else value <= limit)
        elif name in ("minItems", "maxItems"):
            ok = isinstance(value, list) and (
                len(value) >= limit if name == "minItems" else len(value) <= limit
            )
        elif name == "exclusiveOption":
            ok = (
                not isinstance(value, list)
                or len(value) <= 1
                or not any(o.get("exclusive") and o["value"] in value for o in f.get("options", []))
            )
        if not ok:
            errors.append({"code": name, "path": f["id"]})
    return errors


def validation(ir: IR, state: IR, whole_path: bool = False) -> list[IR]:
    view = snapshot(ir, state, whole_path)
    errors = list(view["errors"])
    step = next(s for s in ir["steps"] if s["id"] == state["current"])
    members = {field_id(c.get("field", c.get("group", ""))) for c in step.get("content", [])}
    for f in ir["nodes"]:
        if f["id"] not in view["active"] or (not whole_path and f["id"] not in members):
            continue
        value = view["effective"].get(f["id"])
        if f["type"] == "group":
            if value is not None:
                errors.extend(
                    group_issues(f, value, view["active"], view["effective"].get, ir["conditions"])
                )
            continue
        required = (
            f.get("required", False)
            or any(v["use"] == "required" for v in f.get("validators", []))
            or (
                "requiredWhen" in f
                and evaluate(f["requiredWhen"], view["effective"].get, ir["conditions"]) is True
            )
        )
        errors.extend(cell_issues(f, value, required))
    return errors


def preview(ir: IR, state: IR) -> IR:
    view = snapshot(ir, state)
    result: IR = {}
    for f in ir["nodes"]:
        if (
            f["id"] not in view["active"]
            or f.get("submit") == "displayOnly"
            or f["id"] not in view["effective"]
        ):
            continue
        v = view["effective"][f["id"]]
        if f["type"] == "group":
            if v["order"]:
                result[f["key"]] = [
                    {
                        "itemId": key,
                        **{
                            child["key"]: v["items"][key][child["id"]]
                            for child in f["fields"]
                            if child.get("submit") != "displayOnly"
                            and child["id"] in v["items"][key]
                        },
                    }
                    for key in v["order"]
                ]
        else:
            result[f["key"]] = v
    return result


def evaluate_case(ir: IR, case: IR) -> IR:
    fields = {f["id"]: f for f in ir["nodes"]}
    values: dict[str, Value] = {}
    try:
        for key, value in case.get("values", {}).items():
            if key not in fields:
                raise EngineError("E-REF-DANGLING", key)
            if "formula" in fields[key]:
                continue
            value = normalize(value, fields[key])
            if value is not None:
                values[key] = value
        state = {"current": case.get("current", ir["steps"][0]["id"]), "values": values}
        view = snapshot(ir, state)
        return {
            "path": view["path"],
            "active": sorted(view["active"]),
            "errors": validation(ir, state, True),
            "payload": preview(ir, state),
        }
    except EngineError as e:
        return {"error": {"code": e.code, "path": e.path}}


def normalize_group(value: Any, group: IR) -> GroupValue:
    if value is None:
        raise EngineError("E-PAYLOAD-NULL", group["id"])
    if (
        not isinstance(value, dict)
        or set(value) != {"order", "items"}
        or not isinstance(value["order"], list)
        or not isinstance(value["items"], dict)
    ):
        raise EngineError("E-TYPE", group["id"])
    order, items = value["order"], value["items"]
    if (
        len(order) > group.get("maxItems", 100)
        or not all(
            isinstance(key, str)
            and key.startswith("itm_")
            and key[4:]
            and all(c.isascii() and (c.isalnum() or c == "_") for c in key[4:])
            for key in order
        )
        or len(set(order)) != len(order)
        or set(order) != set(items)
    ):
        raise EngineError("E-ITEM-ID", group["id"])
    fields = {f["id"]: f for f in group["fields"]}
    result: GroupValue = {"order": list(order), "items": {}}
    for key in order:
        if not isinstance(items[key], dict):
            raise EngineError("E-TYPE", group["id"])
        row: dict[str, Cell] = {}
        for name, v in items[key].items():
            if name not in fields:
                raise EngineError("UNKNOWN_FIELD", f"{group['id']}[{key}]/{name}")
            if "formula" in fields[name]:
                continue
            normalized = normalize(v, fields[name])
            if normalized is not None:
                row[name] = cast(Cell, normalized)
        result["items"][key] = row
    return result


def item_order(group: IR) -> list[IR]:
    fields = {f["id"]: f for f in group["fields"]}
    result: list[IR] = []
    pending: set[str] = set()
    done: set[str] = set()

    def refs(e: IR) -> list[str]:
        return [e["item"]] if "item" in e else [r for arg in e.get("args", []) for r in refs(arg)]

    def visit(key: str) -> None:
        if key in done:
            return
        if key in pending:
            raise EngineError("E-DEPENDENCY-CYCLE", key)
        if key not in fields:
            raise EngineError("E-REF-DANGLING", key)
        pending.add(key)
        for prop in ("visibleWhen", "requiredWhen", "formula"):
            if prop in fields[key]:
                for dep in sorted(refs(fields[key][prop])):
                    visit(dep)
        pending.remove(key)
        done.add(key)
        result.append(fields[key])

    for key in sorted(fields):
        visit(key)
    return result


def effective_group(
    group: IR, raw: GroupValue, read: Callable[[str], Value | None], conditions: IR
) -> tuple[GroupValue, list[str], list[IR]]:
    result: GroupValue = {"order": list(raw["order"]), "items": {}}
    active: list[str] = []
    errors: list[IR] = []
    for key in raw["order"]:
        row: dict[str, Cell] = {}

        def item_read(name: str, row: dict[str, Cell] = row) -> Value | None:
            return row.get(name[6:]) if name.startswith("$item:") else read(name)

        for f in item_order(group):
            if "visibleWhen" in f and evaluate(f["visibleWhen"], item_read, conditions) is not True:
                continue
            address = f"{group['id']}[{key}]/{f['id']}"
            active.append(address)
            try:
                v = (
                    evaluate(f["formula"], item_read, conditions)
                    if "formula" in f
                    else raw["items"][key].get(f["id"])
                )
                if v is not None:
                    n = normalize(v, f)
                    if n is not None:
                        row[f["id"]] = cast(Cell, n)
            except EngineError as e:
                errors.append({"code": e.code, "path": address})
        result["items"][key] = row
    return result, active, errors


def group_issues(
    group: IR,
    value: GroupValue,
    active: set[str],
    read: Callable[[str], Value | None],
    conditions: IR,
) -> list[IR]:
    errors: list[IR] = []
    if len(value["order"]) < group.get("minItems", 0):
        errors.append({"code": "minItems", "path": group["id"]})
    for key in value["order"]:
        row = value["items"][key]

        def item_read(name: str, row: dict[str, Cell] = row) -> Value | None:
            return row.get(name[6:]) if name.startswith("$item:") else read(name)

        for f in group["fields"]:
            address = f"{group['id']}[{key}]/{f['id']}"
            if address not in active:
                continue
            required = (
                f.get("required", False)
                or any(v["use"] == "required" for v in f.get("validators", []))
                or (
                    "requiredWhen" in f
                    and evaluate(f["requiredWhen"], item_read, conditions) is True
                )
            )
            errors.extend(
                {**e, "path": address} for e in cell_issues(f, row.get(f["id"]), required)
            )
    return errors

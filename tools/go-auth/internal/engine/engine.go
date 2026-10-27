// Package engine ports the approved executable IR semantics. Untrusted definitions
// are validated/lowered by the retained TypeScript compiler before entering here.
package engine

import (
	"encoding/json"
	"fmt"
	"math"
	"reflect"
	"regexp"
	"sort"
	"strings"
	"unicode/utf8"

	"golang.org/x/text/unicode/norm"
)

type M = map[string]any
type Issue struct {
	Code string `json:"code"`
	Path string `json:"path"`
}

func (e Issue) Error() string { return e.Code + " at " + e.Path }
func fault(code, path string) { panic(Issue{code, path}) }
func obj(v any) M {
	m, _ := v.(map[string]any)
	if m == nil {
		return M{}
	}
	return m
}
func arr(v any) []any {
	a, _ := v.([]any)
	if a == nil {
		return []any{}
	}
	return a
}
func str(v any) string { s, _ := v.(string); return s }
func yes(v any) bool   { return v == true }
func id(f M) string    { return str(f["id"]) }
func keys(m M) []string {
	out := []string{}
	for k := range m {
		out = append(out, k)
	}
	sort.Strings(out)
	return out
}

const max = 9007199254740991.0

func checked(n float64) float64 {
	if math.IsNaN(n) || math.IsInf(n, 0) || math.Abs(n) > max {
		fault("E-NUM-RANGE", "")
	}
	return n
}
func number(v any) float64 {
	n, ok := v.(float64)
	if !ok || math.Trunc(n) != n {
		fault("E-TYPE-OPERATOR", "")
	}
	return checked(n)
}
func boolean(v any) bool {
	b, ok := v.(bool)
	if !ok {
		fault("E-TYPE-OPERATOR", "")
	}
	return b
}
func empty(v any) bool {
	if v == nil || v == "" {
		return true
	}
	if a, ok := v.([]any); ok {
		return len(a) == 0
	}
	if m, ok := v.(map[string]any); ok {
		return len(arr(m["order"])) == 0
	}
	return false
}
func field(ref any) string {
	s := str(ref)
	if !strings.HasPrefix(s, "$local:") {
		fault("E-REF-UNSUPPORTED", "")
	}
	return s[7:]
}

var itemID = regexp.MustCompile(`^itm_[a-zA-Z0-9_]+$`)
var kana = regexp.MustCompile(`[\x{ff61}-\x{ff9f}]+`)

const trim = "\u0009\u000a\u000b\u000c\u000d\u0020\u00a0\u1680\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u2028\u2029\u202f\u205f\u3000\ufeff"

func canonical(s, kind string) string {
	if strings.HasPrefix(kind, "choice.") || strings.HasPrefix(kind, "plugin:") {
		return s
	}
	s = strings.Trim(s, trim)
	if kind == "textarea" {
		s = strings.ReplaceAll(s, "\r\n", "\n")
	}
	if kind == "email" || kind == "tel" || kind == "postal" {
		s = strings.Map(func(r rune) rune {
			if (kind == "email" && r >= '\uff01' && r <= '\uff5e') || ((kind == "tel" || kind == "postal") && r >= '\uff10' && r <= '\uff19') {
				r -= 0xfee0
			}
			if (kind == "tel" || kind == "postal") && strings.ContainsRune(trim+"-\uff0d\u30fc\u2010", r) {
				return -1
			}
			return r
		}, s)
	}
	if kind == "katakana" {
		s = kana.ReplaceAllStringFunc(s, norm.NFKC.String)
	}
	return s
}
func Normalize(v any, f M) any {
	kind := str(f["type"])
	if kind == "group" {
		return normalizeGroup(v, f)
	}
	if v == nil {
		fault("E-PAYLOAD-NULL", id(f))
	}
	if s, ok := v.(string); ok {
		v = canonical(s, kind)
	}
	if v == "" {
		return nil
	}
	if a, ok := v.([]any); ok && len(a) == 0 {
		return nil
	}
	switch kind {
	case "number":
		n, ok := v.(float64)
		if !ok || math.IsNaN(n) || math.IsInf(n, 0) || math.Trunc(n) != n {
			fault("E-TYPE", id(f))
		}
		if math.Abs(n) > max {
			fault("E-NUM-RANGE", id(f))
		}
	case "boolean":
		if _, ok := v.(bool); !ok {
			fault("E-TYPE", id(f))
		}
	case "choice.checkboxes":
		a, ok := v.([]any)
		if !ok {
			fault("E-TYPE", id(f))
		}
		seen := map[string]bool{}
		for _, x := range a {
			s, ok := x.(string)
			if !ok || seen[s] {
				fault("E-TYPE", id(f))
			}
			seen[s] = true
		}
	case "calculated":
		switch x := v.(type) {
		case string, bool:
		case float64:
			checked(x)
		default:
			fault("E-TYPE", id(f))
		}
	default:
		if _, ok := v.(string); !ok {
			fault("E-TYPE", id(f))
		}
	}
	if options, ok := f["options"]; ok {
		values := arr(v)
		if _, isArray := v.([]any); !isArray {
			values = []any{v}
		}
		for _, x := range values {
			found := false
			for _, o := range arr(options) {
				if reflect.DeepEqual(obj(o)["value"], x) {
					found = true
				}
			}
			if !found {
				fault("E-OPTION", id(f))
			}
		}
	}
	return v
}

type Reader func(string) any

func Eval(e M, read Reader, conds M) any { return eval(e, read, conds, 0) }
func eval(e M, read Reader, conds M, depth int) any {
	if depth > 256 {
		fault("E-DEPENDENCY-CYCLE", "")
	}
	if v, ok := e["const"]; ok {
		return v
	}
	if v, ok := e["item"]; ok {
		return read("$item:" + str(v))
	}
	if v, ok := e["ref"]; ok {
		return read(field(v))
	}
	if v, ok := e["cond"]; ok {
		c, found := conds[str(v)]
		if !found {
			fault("E-REF-DANGLING", str(v))
		}
		return eval(obj(obj(c)["when"]), read, conds, depth+1)
	}
	op := str(e["op"])
	exprs := arr(e["args"])
	get := func(i int) any {
		if i >= len(exprs) {
			fault("E-ARITY", "")
		}
		return eval(obj(exprs[i]), read, conds, depth+1)
	}
	if op == "choose" {
		if boolean(get(0)) {
			return get(1)
		}
		return get(2)
	}
	if op == "sum" || op == "count" || op == "any" || op == "all" {
		if group, ok := get(0).(map[string]any); ok {
			if len(exprs) == 1 {
				if op != "count" {
					fault("E-ARITY", "")
				}
				return float64(len(arr(group["order"])))
			}
			values := []any{}
			for _, k := range arr(group["order"]) {
				row := obj(obj(group["items"])[str(k)])
				values = append(values, eval(obj(exprs[1]), func(key string) any {
					if strings.HasPrefix(key, "$item:") {
						return row[key[6:]]
					}
					return read(key)
				}, conds, depth+1))
			}
			if op == "sum" {
				n := 0.0
				for _, v := range values {
					if v != nil {
						n = checked(n + number(v))
					}
				}
				return n
			}
			n := 0.0
			all := true
			for _, v := range values {
				b := v != nil && boolean(v)
				if b {
					n++
				} else {
					all = false
				}
			}
			if op == "count" {
				return n
			}
			if op == "any" {
				return n > 0
			}
			return all
		}
	}
	args := []any{}
	for i := range exprs {
		args = append(args, get(i))
	}
	var x, y any
	if len(args) > 0 {
		x = args[0]
	}
	if len(args) > 1 {
		y = args[1]
	}
	contains := func(a []any, v any) bool {
		for _, c := range a {
			if reflect.DeepEqual(c, v) {
				return true
			}
		}
		return false
	}
	switch op {
	case "isEmpty":
		return empty(x)
	case "isNotEmpty":
		return !empty(x)
	case "and", "or":
		n := 0
		for _, v := range args {
			if boolean(v) {
				n++
			}
		}
		if op == "and" {
			return n == len(args)
		}
		return n > 0
	case "not":
		return !boolean(x)
	case "eq", "neq":
		same := reflect.DeepEqual(x, y)
		return !empty(x) && !empty(y) && ((op == "eq" && same) || (op == "neq" && !same))
	case "in", "notIn":
		a, ok := y.([]any)
		found := contains(a, x)
		return !empty(x) && ok && ((op == "in" && found) || (op == "notIn" && !found))
	case "includes":
		a, ok := x.([]any)
		return ok && !empty(y) && contains(a, y)
	case "includesAny":
		a, aok := x.([]any)
		b, bok := y.([]any)
		if !aok || !bok {
			return false
		}
		for _, v := range a {
			if contains(b, v) {
				return true
			}
		}
		return false
	case "lt", "lte", "gt", "gte":
		if empty(x) || empty(y) {
			return false
		}
		a, b := number(x), number(y)
		switch op {
		case "lt":
			return a < b
		case "lte":
			return a <= b
		case "gt":
			return a > b
		default:
			return a >= b
		}
	case "count":
		if empty(x) {
			return float64(0)
		}
		a, ok := x.([]any)
		if !ok {
			fault("E-TYPE-OPERATOR", "")
		}
		return float64(len(a))
	case "sum", "any", "all":
		if empty(x) {
			if op == "all" {
				return true
			}
			if op == "sum" {
				return float64(0)
			}
			return false
		}
		a, ok := x.([]any)
		if !ok {
			fault("E-TYPE-OPERATOR", "")
		}
		n := 0.0
		all := true
		for _, v := range a {
			if op == "sum" {
				n = checked(n + number(v))
			} else if boolean(v) {
				n++
			} else {
				all = false
			}
		}
		if op == "sum" {
			return n
		}
		if op == "any" {
			return n > 0
		}
		return all
	}
	for _, v := range args {
		if v == nil {
			return nil
		}
	}
	if op == "concat" {
		s := ""
		for _, v := range args {
			v, ok := v.(string)
			if !ok {
				fault("E-TYPE-OPERATOR", "")
			}
			s += v
		}
		return s
	}
	if len(args) == 0 {
		fault("E-ARITY", "")
	}
	n := number(args[0])
	for _, v := range args[1:] {
		b := number(v)
		switch op {
		case "add":
			n = checked(n + b)
		case "subtract":
			n = checked(n - b)
		case "multiply":
			n = checked(n * b)
		case "min":
			n = math.Min(n, b)
		case "max":
			n = math.Max(n, b)
		default:
			fault("E-OPERATOR", "")
		}
	}
	return n
}
func references(e, conds M, item bool, pending map[string]bool) []string {
	if r, ok := e["ref"]; ok && !item {
		return []string{field(r)}
	}
	if r, ok := e["item"]; ok && item {
		return []string{str(r)}
	}
	if k, ok := e["cond"]; ok && !item {
		s := str(k)
		if pending[s] {
			fault("E-DEPENDENCY-CYCLE", s)
		}
		v, found := conds[s]
		if !found {
			fault("E-REF-DANGLING", s)
		}
		pending[s] = true
		r := references(obj(obj(v)["when"]), conds, item, pending)
		delete(pending, s)
		return r
	}
	out := []string{}
	for _, arg := range arr(e["args"]) {
		out = append(out, references(obj(arg), conds, item, pending)...)
	}
	return out
}
func order(nodes []any, conds M, item bool) []M {
	fields := M{}
	for _, v := range nodes {
		f := obj(v)
		fields[id(f)] = f
	}
	done, pending := map[string]bool{}, map[string]bool{}
	result := []M{}
	var visit func(string)
	visit = func(key string) {
		if done[key] {
			return
		}
		if pending[key] {
			fault("E-DEPENDENCY-CYCLE", key)
		}
		raw, ok := fields[key]
		if !ok {
			fault("E-REF-DANGLING", key)
		}
		pending[key] = true
		f := obj(raw)
		expressions := []any{}
		gather := func(n M) {
			for _, p := range []string{"visibleWhen", "requiredWhen", "formula"} {
				if v, ok := n[p]; ok {
					expressions = append(expressions, v)
				}
			}
			for _, o := range arr(n["options"]) {
				if v, ok := obj(o)["availableWhen"]; ok {
					expressions = append(expressions, v)
				}
			}
		}
		gather(f)
		if f["type"] == "group" {
			for _, child := range arr(f["fields"]) {
				gather(obj(child))
			}
		}
		for _, e := range expressions {
			refs := references(obj(e), conds, item, map[string]bool{})
			sort.Strings(refs)
			for _, ref := range refs {
				visit(ref)
			}
		}
		delete(pending, key)
		done[key] = true
		result = append(result, f)
	}
	for _, k := range keys(fields) {
		visit(k)
	}
	return result
}
func normalizeGroup(v any, f M) M {
	if v == nil {
		fault("E-PAYLOAD-NULL", id(f))
	}
	g, ok := v.(map[string]any)
	_, aok := g["order"].([]any)
	items, iok := g["items"].(map[string]any)
	if !ok || len(g) != 2 || !aok || !iok {
		fault("E-TYPE", id(f))
	}
	rows := arr(g["order"])
	limit := 100.0
	if x, ok := f["maxItems"].(float64); ok {
		limit = x
	}
	seen := map[string]bool{}
	if float64(len(rows)) > limit || len(rows) != len(items) {
		fault("E-ITEM-ID", id(f))
	}
	fields := M{}
	for _, v := range arr(f["fields"]) {
		fields[id(obj(v))] = v
	}
	out := M{}
	for _, raw := range rows {
		k := str(raw)
		if !itemID.MatchString(k) || seen[k] {
			fault("E-ITEM-ID", id(f))
		}
		seen[k] = true
		row, ok := items[k].(map[string]any)
		if !ok {
			fault("E-TYPE", id(f))
		}
		cells := M{}
		for _, name := range keys(row) {
			v := row[name]
			field, found := fields[name]
			if !found {
				fault("UNKNOWN_FIELD", id(f)+"["+k+"]/"+name)
			}
			child := obj(field)
			if _, ok := child["formula"]; ok {
				continue
			}
			if value := Normalize(v, child); value != nil {
				cells[name] = value
			}
		}
		out[k] = cells
	}
	return M{"order": rows, "items": out}
}
func available(f M, v any, read Reader, c M) {
	values := arr(v)
	if _, ok := v.([]any); !ok {
		values = []any{v}
	}
	for _, o := range arr(f["options"]) {
		option := obj(o)
		for _, value := range values {
			if reflect.DeepEqual(value, option["value"]) {
				if e, ok := option["availableWhen"]; ok && !yes(Eval(obj(e), read, c)) {
					fault("E-OPTION-UNAVAILABLE", id(f))
				}
			}
		}
	}
}
func attempt(path string, fn func()) (issues []Issue) {
	defer func() {
		if p := recover(); p != nil {
			if e, ok := p.(Issue); ok {
				issues = append(issues, Issue{e.Code, path})
			} else {
				panic(p)
			}
		}
	}()
	fn()
	return
}

type view struct {
	path      []any
	active    map[string]bool
	effective M
	errors    []Issue
}

func snapshot(ir, state M, submit bool) view {
	v := view{[]any{}, map[string]bool{}, M{}, []Issue{}}
	conds := obj(ir["conditions"])
	ordered := order(arr(ir["nodes"]), conds, false)
	steps := M{}
	for _, s := range arr(ir["steps"]) {
		steps[id(obj(s))] = s
	}
	if len(arr(ir["steps"])) == 0 {
		fault("E-GRAPH-NO-DEFAULT", "")
	}
	key := id(obj(arr(ir["steps"])[0]))
	past := false
	seen := map[string]bool{}
	read := func(name string) any {
		if v.active[name] {
			return v.effective[name]
		}
		return nil
	}
	for key != "" {
		if seen[key] || len(seen) >= len(steps) {
			fault("E-GRAPH-CYCLE", "")
		}
		seen[key] = true
		raw, ok := steps[key]
		if !ok {
			fault("E-REF-DANGLING", key)
		}
		s := obj(raw)
		skipped := false
		if e, ok := s["skipWhen"]; ok {
			skipped = yes(Eval(obj(e), read, conds))
		}
		if !skipped {
			v.path = append(v.path, key)
			if s["kind"] != "complete" && (submit || !past) {
				members := map[string]bool{}
				for _, c := range arr(s["content"]) {
					m := obj(c)
					r := m["field"]
					if r == nil {
						r = m["group"]
					}
					members[field(r)] = true
				}
				for _, f := range ordered {
					fid := id(f)
					if !members[fid] {
						continue
					}
					if e, ok := f["visibleWhen"]; ok && !yes(Eval(obj(e), read, conds)) {
						continue
					}
					v.active[fid] = true
					if f["type"] == "group" {
						raw := obj(state["values"])[fid]
						if raw == nil {
							raw = M{"order": []any{}, "items": M{}}
						}
						g := normalizeGroup(raw, f)
						items := M{}
						for _, item := range arr(g["order"]) {
							k := str(item)
							row := M{}
							itemRead := func(n string) any {
								if strings.HasPrefix(n, "$item:") {
									return row[n[6:]]
								}
								return read(n)
							}
							for _, child := range order(arr(f["fields"]), conds, true) {
								if e, ok := child["visibleWhen"]; ok && !yes(Eval(obj(e), itemRead, conds)) {
									continue
								}
								address := fid + "[" + k + "]/" + id(child)
								v.active[address] = true
								v.errors = append(v.errors, attempt(address, func() {
									value := obj(obj(g["items"])[k])[id(child)]
									if e, ok := child["formula"]; ok {
										value = Eval(obj(e), itemRead, conds)
									}
									if value != nil {
										if n := Normalize(value, child); n != nil {
											available(child, n, itemRead, conds)
											row[id(child)] = n
										}
									}
								})...)
							}
							items[k] = row
						}
						v.effective[fid] = M{"order": g["order"], "items": items}
						continue
					}
					v.errors = append(v.errors, attempt(fid, func() {
						value, present := obj(state["values"])[fid]
						e, formula := f["formula"]
						if formula {
							value = Eval(obj(e), read, conds)
						}
						if value != nil {
							if n := Normalize(value, f); n != nil {
								available(f, n, read, conds)
								v.effective[fid] = n
							}
						} else if present && !formula {
							fault("E-PAYLOAD-NULL", fid)
						}
					})...)
				}
			}
			if key == state["current"] {
				past = true
			}
		}
		if s["kind"] == "complete" {
			break
		}
		key = ""
		for _, t := range arr(s["transitions"]) {
			tr := obj(t)
			if d, ok := tr["default"]; ok {
				key = str(d)
				break
			}
			if yes(Eval(obj(tr["when"]), read, conds)) {
				key = str(tr["to"])
				break
			}
		}
		if key == "" {
			fault("E-GRAPH-NO-DEFAULT", "")
		}
	}
	return v
}
func required(f M, read Reader, conds M) bool {
	if yes(f["required"]) {
		return true
	}
	for _, v := range arr(f["validators"]) {
		if obj(v)["use"] == "required" {
			return true
		}
	}
	if e, ok := f["requiredWhen"]; ok {
		return yes(Eval(obj(e), read, conds))
	}
	return false
}
func cellIssues(f M, value any, req bool) []Issue {
	out := []Issue{}
	if req && value == nil {
		return []Issue{{"required", id(f)}}
	}
	if value == nil {
		return out
	}
	for _, raw := range arr(f["validators"]) {
		v := obj(raw)
		name := str(v["use"])
		limit, _ := obj(v["params"])["value"].(float64)
		ok := true
		switch name {
		case "formatEmail", "formatPhoneJP", "formatPostalJP", "formatKatakana", "formatDate":
			ok = validFormat(name, value)
		case "mustBeTrue":
			ok = value == true
		case "minLength", "maxLength":
			s, is := value.(string)
			n := float64(utf8.RuneCountInString(s))
			ok = is && ((name == "minLength" && n >= limit) || (name == "maxLength" && n <= limit))
		case "min", "max":
			n, is := value.(float64)
			ok = is && ((name == "min" && n >= limit) || (name == "max" && n <= limit))
		case "minItems", "maxItems":
			a, is := value.([]any)
			ok = is && ((name == "minItems" && float64(len(a)) >= limit) || (name == "maxItems" && float64(len(a)) <= limit))
		case "exclusiveOption":
			if a, is := value.([]any); is && len(a) > 1 {
				for _, o := range arr(f["options"]) {
					if yes(obj(o)["exclusive"]) {
						for _, x := range a {
							if reflect.DeepEqual(x, obj(o)["value"]) {
								ok = false
							}
						}
					}
				}
			}
		}
		if !ok {
			out = append(out, Issue{name, id(f)})
		}
	}
	return out
}
func validation(ir, state M, whole bool) []Issue {
	v := snapshot(ir, state, whole)
	out := v.errors
	members := map[string]bool{}
	for _, raw := range arr(ir["steps"]) {
		s := obj(raw)
		if s["id"] == state["current"] {
			for _, c := range arr(s["content"]) {
				m := obj(c)
				r := m["field"]
				if r == nil {
					r = m["group"]
				}
				members[field(r)] = true
			}
		}
	}
	conds := obj(ir["conditions"])
	for _, raw := range arr(ir["nodes"]) {
		f := obj(raw)
		fid := id(f)
		if !v.active[fid] || (!whole && !members[fid]) {
			continue
		}
		value := v.effective[fid]
		if f["type"] != "group" {
			out = append(out, cellIssues(f, value, required(f, func(k string) any { return v.effective[k] }, conds))...)
			continue
		}
		g := obj(value)
		min, _ := f["minItems"].(float64)
		if float64(len(arr(g["order"]))) < min {
			out = append(out, Issue{"minItems", fid})
		}
		for _, item := range arr(g["order"]) {
			k := str(item)
			row := obj(obj(g["items"])[k])
			read := func(n string) any {
				if strings.HasPrefix(n, "$item:") {
					return row[n[6:]]
				}
				return v.effective[n]
			}
			for _, raw := range arr(f["fields"]) {
				child := obj(raw)
				address := fid + "[" + k + "]/" + id(child)
				if v.active[address] {
					for _, issue := range cellIssues(child, row[id(child)], required(child, read, conds)) {
						out = append(out, Issue{issue.Code, address})
					}
				}
			}
		}
	}
	return out
}
func projection(ir, state M) M {
	v := snapshot(ir, state, false)
	out := M{}
	for _, raw := range arr(ir["nodes"]) {
		f := obj(raw)
		fid := id(f)
		value, has := v.effective[fid]
		if !v.active[fid] || f["submit"] == "displayOnly" || !has {
			continue
		}
		if f["type"] == "group" {
			g := obj(value)
			if len(arr(g["order"])) == 0 {
				continue
			}
			rows := []any{}
			for _, item := range arr(g["order"]) {
				row := M{"itemId": item}
				cells := obj(obj(g["items"])[str(item)])
				for _, c := range arr(f["fields"]) {
					child := obj(c)
					if cell, ok := cells[id(child)]; ok && child["submit"] != "displayOnly" {
						row[str(child["key"])] = cell
					}
				}
				rows = append(rows, row)
			}
			out[str(f["key"])] = rows
		} else if p := arr(f["outputPath"]); len(p) == 2 {
			root := str(p[0])
			if out[root] == nil {
				out[root] = M{}
			}
			obj(out[root])[str(p[1])] = value
		} else {
			out[str(f["key"])] = value
		}
	}
	return out
}
func resultPanic(result *M, submission bool) {
	if p := recover(); p != nil {
		e, ok := p.(Issue)
		if !ok {
			e = Issue{"E-IR-INVALID", ""}
		}
		if submission {
			*result = M{"ok": false, "errors": []Issue{e}, "payload": M{}}
		} else {
			*result = M{"error": e}
		}
	}
}
func Case(ir, c M) (result M) {
	defer resultPanic(&result, false)
	fields := M{}
	for _, f := range arr(ir["nodes"]) {
		fields[id(obj(f))] = f
	}
	values := M{}
	for _, k := range keys(obj(c["values"])) {
		f, ok := fields[k]
		if !ok {
			fault("E-REF-DANGLING", k)
		}
		if _, formula := obj(f)["formula"]; formula {
			continue
		}
		if n := Normalize(obj(c["values"])[k], obj(f)); n != nil {
			values[k] = n
		}
	}
	current := c["current"]
	if current == nil {
		current = obj(arr(ir["steps"])[0])["id"]
	}
	state := M{"current": current, "values": values}
	v := snapshot(ir, state, false)
	active := []string{}
	for k := range v.active {
		active = append(active, k)
	}
	sort.Strings(active)
	return M{"path": v.path, "active": active, "errors": validation(ir, state, true), "payload": projection(ir, state)}
}
func Submission(ir M, payload any) (result M) {
	defer resultPanic(&result, true)
	input, ok := payload.(map[string]any)
	if !ok {
		fault("E-TYPE", "")
	}
	fields, locals, aliases, mapped := M{}, map[string]bool{}, map[string]bool{}, map[string]string{}
	for _, raw := range arr(ir["nodes"]) {
		f := obj(raw)
		fields[str(f["key"])] = f
		if p := arr(f["outputPath"]); len(p) == 2 {
			aliases[str(p[0])] = true
			mapped[str(p[0])+"\x00"+str(p[1])] = str(f["key"])
		} else {
			locals[str(f["key"])] = true
		}
	}
	if len(aliases) > 0 {
		flat := M{}
		for _, root := range keys(input) {
			value := input[root]
			if locals[root] {
				flat[root] = value
			} else if aliases[root] {
				m, ok := value.(map[string]any)
				if !ok {
					fault("E-TYPE", root)
				}
				for _, k := range keys(m) {
					target, found := mapped[root+"\x00"+k]
					if !found {
						fault("UNKNOWN_FIELD", root)
					}
					flat[target] = m[k]
				}
			} else {
				fault("UNKNOWN_FIELD", root)
			}
		}
		input = flat
	}
	values := M{}
	for _, key := range keys(input) {
		value := input[key]
		raw, found := fields[key]
		if !found {
			fault("UNKNOWN_FIELD", "")
		}
		f := obj(raw)
		if value == nil {
			fault("E-PAYLOAD-NULL", id(f))
		}
		if f["submit"] == "displayOnly" {
			fault("E-DISPLAY-ONLY-DATA", id(f))
		}
		if f["type"] == "calculated" {
			continue
		}
		if f["type"] != "group" {
			if n := Normalize(value, f); n != nil {
				values[id(f)] = n
			}
			continue
		}
		rows, ok := value.([]any)
		if !ok {
			fault("E-TYPE", id(f))
		}
		children := M{}
		for _, c := range arr(f["fields"]) {
			children[str(obj(c)["key"])] = c
		}
		group := M{"order": []any{}, "items": M{}}
		for _, raw := range rows {
			row, ok := raw.(map[string]any)
			if !ok {
				fault("E-TYPE", id(f))
			}
			k, ok := row["itemId"].(string)
			if !ok {
				fault("E-TYPE", id(f))
			}
			if !itemID.MatchString(k) {
				fault("E-ITEM-ID", id(f))
			}
			group["order"] = append(arr(group["order"]), k)
			cells := M{}
			for _, ck := range keys(row) {
				if ck == "itemId" {
					continue
				}
				address := id(f) + "[" + k + "]"
				raw, found := children[ck]
				if !found {
					fault("UNKNOWN_FIELD", address)
				}
				child := obj(raw)
				address += "/" + id(child)
				if row[ck] == nil {
					fault("E-PAYLOAD-NULL", address)
				}
				if child["submit"] == "displayOnly" {
					fault("E-DISPLAY-ONLY-DATA", address)
				}
				if child["type"] != "calculated" {
					issues := attempt(address, func() {
						if n := Normalize(row[ck], child); n != nil {
							cells[id(child)] = n
						}
					})
					if len(issues) > 0 {
						panic(issues[0])
					}
				}
			}
			obj(group["items"])[k] = cells
		}
		values[id(f)] = normalizeGroup(group, f)
	}
	state := M{"current": obj(arr(ir["steps"])[0])["id"], "values": values}
	v := snapshot(ir, state, true)
	var review any
	for _, raw := range arr(ir["steps"]) {
		s := obj(raw)
		if s["kind"] == "review" {
			for _, p := range v.path {
				if p == s["id"] {
					review = s["id"]
					break
				}
			}
			if review != nil {
				break
			}
		}
	}
	if review == nil {
		fault("E-GRAPH-NO-DEFAULT", "")
	}
	state["current"] = review
	for _, key := range keys(input) {
		f := obj(fields[key])
		if !v.active[id(f)] {
			fault("E-INACTIVE-DATA-PRESENT", id(f))
		}
		if f["type"] == "group" {
			for _, raw := range arr(input[key]) {
				row := obj(raw)
				for _, c := range arr(f["fields"]) {
					child := obj(c)
					address := id(f) + "[" + str(row["itemId"]) + "]/" + id(child)
					if _, has := row[str(child["key"])]; has && !v.active[address] {
						fault("E-INACTIVE-DATA-PRESENT", address)
					}
				}
			}
		}
	}
	issues := validation(ir, state, true)
	projected := M{}
	if len(issues) == 0 {
		projected = projection(ir, state)
	}
	return M{"ok": len(issues) == 0, "errors": issues, "payload": projected}
}
func Decode(raw []byte) (M, error) {
	var m M
	err := json.Unmarshal(raw, &m)
	if m == nil && err == nil {
		err = fmt.Errorf("expected object")
	}
	return m, err
}

package main

import (
	"encoding/json"
	"flag"
	"forms-master/go-auth/internal/engine"
	"os"
)

func main() {
	path := flag.String("ir", "", "trusted IR path")
	submission := flag.Bool("submission", false, "submission mode")
	flag.Parse()
	raw, err := os.ReadFile(*path)
	if err != nil {
		os.Exit(1)
	}
	ir, err := engine.Decode(raw)
	if err != nil {
		os.Exit(1)
	}
	dec := json.NewDecoder(os.Stdin)
	enc := json.NewEncoder(os.Stdout)
	if *submission {
		var v any
		if dec.Decode(&v) != nil {
			os.Exit(1)
		}
		_ = enc.Encode(engine.Submission(ir, v))
		return
	}
	var cases []engine.M
	if dec.Decode(&cases) != nil {
		os.Exit(1)
	}
	out := []engine.M{}
	for _, c := range cases {
		out = append(out, engine.Case(ir, c))
	}
	_ = enc.Encode(out)
}

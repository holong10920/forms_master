package main

import (
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"forms-master/go-auth/internal/studio"
	"os"
	"path/filepath"
)

func main() {
	root := flag.String("root", "../..", "repository root")
	data := flag.String("data", "", "isolated business data")
	flag.Parse()
	r, _ := filepath.Abs(*root)
	d := *data
	if d == "" {
		d = filepath.Join(r, "var/master")
	}
	result, err := studio.Inspect(context.Background(), r, d)
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
	enc := json.NewEncoder(os.Stdout)
	enc.SetIndent("", "  ")
	_ = enc.Encode(result)
}

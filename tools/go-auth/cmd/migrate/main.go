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
	initialize := flag.Bool("initialize", false, "initialize fresh synthetic data with Go")
	source := flag.String("source", "", "source data")
	dest := flag.String("destination", "", "new isolated data root")
	flag.Parse()
	r, _ := filepath.Abs(*root)
	src := *source
	if src == "" {
		src = filepath.Join(r, "var/s2-publication")
	}
	dst := *dest
	if dst == "" {
		dst = filepath.Join(r, "var/master")
	}
	var report map[string]any
	var e error
	_, sourceError := os.Stat(filepath.Join(src, "active.sqlite3"))
	if *initialize || (*source == "" && os.IsNotExist(sourceError)) {
		report, e = studio.Bootstrap(context.Background(), r, dst)
	} else {
		report, e = studio.Snapshot(context.Background(), r, src, dst)
	}
	if e != nil {
		fmt.Fprintln(os.Stderr, "Migration refused:", e)
		if report != nil {
			_ = json.NewEncoder(os.Stdout).Encode(report)
		}
		os.Exit(1)
	}
	_ = json.NewEncoder(os.Stdout).Encode(report)
}

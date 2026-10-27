package main

import (
	"encoding/json"
	"flag"
	"forms-master/go-auth/internal/studio"
	"os"
)

func main() {
	path := flag.String("candidate", "", "trusted artifact directory")
	flag.Parse()
	m, e := studio.VerifyArtifact(*path)
	if e != nil {
		os.Exit(1)
	}
	_ = json.NewEncoder(os.Stdout).Encode(m)
}

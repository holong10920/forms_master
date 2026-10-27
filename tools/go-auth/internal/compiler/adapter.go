package compiler

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"syscall"
	"time"
)

type Adapter struct{ Root string }
type Failure struct{ Diagnostics []string }

func (f Failure) Error() string { return "DEFINITION_INVALID" }

type limitWriter struct {
	b bytes.Buffer
	n int
}

func (w *limitWriter) Write(b []byte) (int, error) {
	if w.b.Len()+len(b) > w.n {
		return 0, errors.New("compiler output limit")
	}
	return w.b.Write(b)
}
func (a Adapter) Call(ctx context.Context, action string, definition any, partial, blocked bool) (map[string]any, error) {
	switch action {
	case "catalog", "schema", "lower", "compile", "release":
	default:
		return nil, errors.New("compiler action refused")
	}
	ctx, cancel := context.WithTimeout(ctx, 90*time.Second)
	defer cancel()
	raw, err := json.Marshal(map[string]any{"action": action, "definition": definition, "partial": partial, "blocked": blocked})
	if err != nil || len(raw) > 2100000 {
		return nil, errors.New("compiler input invalid")
	}
	cmd := exec.CommandContext(ctx, "node", filepath.Join(a.Root, "tools/go-auth/compiler.ts"))
	cmd.Dir = a.Root
	cmd.Stdin = bytes.NewReader(raw)
	cmd.Env = []string{"PATH=" + os.Getenv("PATH"), "HOME=" + os.Getenv("HOME"), "TMPDIR=" + os.TempDir(), "LANG=en_US.UTF-8", "FB_SEMANTIC_AUTHORITY=go", "FB_DATA_MODE=synthetic"}
	cmd.SysProcAttr = &syscall.SysProcAttr{Setpgid: true}
	cmd.Cancel = func() error {
		if cmd.Process == nil {
			return nil
		}
		return syscall.Kill(-cmd.Process.Pid, syscall.SIGKILL)
	}
	cmd.WaitDelay = 2 * time.Second
	output := &limitWriter{n: 4 * 1024 * 1024}
	cmd.Stdout = output
	cmd.Stderr = io.Discard
	runErr := cmd.Run()
	var result struct {
		OK          bool           `json:"ok"`
		Result      map[string]any `json:"result"`
		Diagnostics []string       `json:"diagnostics"`
	}
	if json.Unmarshal(output.b.Bytes(), &result) != nil {
		return nil, errors.New("E-COMPILER-UNAVAILABLE")
	}
	if runErr != nil || !result.OK {
		safe := []string{}
		pattern := regexp.MustCompile(`^E-[A-Z0-9-]+(?: at [a-zA-Z0-9_:$./\[\]-]+)?`)
		for _, message := range result.Diagnostics {
			if v := pattern.FindString(message); v != "" {
				safe = append(safe, v)
			}
		}
		return nil, Failure{Diagnostics: safe}
	}
	return result.Result, nil
}

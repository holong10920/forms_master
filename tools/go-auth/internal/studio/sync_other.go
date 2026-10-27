//go:build !darwin

package studio

import "os"

// writeOnce already calls File.Sync on every supported platform.
func fullSync(_ *os.File) error { return nil }

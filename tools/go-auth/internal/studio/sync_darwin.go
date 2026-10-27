//go:build darwin

package studio

import (
	"golang.org/x/sys/unix"
	"os"
)

func fullSync(f *os.File) error {
	_, err := unix.FcntlInt(f.Fd(), unix.F_FULLFSYNC, 0)
	if err == unix.EINVAL || err == unix.ENOTSUP {
		return nil
	}
	return err
}

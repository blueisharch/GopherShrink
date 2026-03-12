package ziputil

import (
	"archive/zip"
	"bytes"
	"fmt"
	"io"
	"os"
)

// CreateZip bundles a map of filename -> data into a ZIP archive.
func CreateZip(files map[string][]byte) ([]byte, error) {
	var buf bytes.Buffer
	w := zip.NewWriter(&buf)

	for name, data := range files {
		fw, err := w.Create(name)
		if err != nil {
			return nil, fmt.Errorf("creating zip entry %s: %w", name, err)
		}
		if _, err := fw.Write(data); err != nil {
			return nil, fmt.Errorf("writing zip entry %s: %w", name, err)
		}
	}

	if err := w.Close(); err != nil {
		return nil, fmt.Errorf("closing zip writer: %w", err)
	}
	return buf.Bytes(), nil
}

// CreateZipFromDir archives all files in a directory.
func CreateZipFromDir(dir string) ([]byte, error) {
	var buf bytes.Buffer
	w := zip.NewWriter(&buf)

	entries, err := os.ReadDir(dir)
	if err != nil {
		return nil, fmt.Errorf("reading dir: %w", err)
	}

	for _, e := range entries {
		if e.IsDir() {
			continue
		}
		path := dir + "/" + e.Name()
		f, err := os.Open(path)
		if err != nil {
			continue
		}
		fw, err := w.Create(e.Name())
		if err != nil {
			f.Close()
			continue
		}
		_, _ = io.Copy(fw, f)
		f.Close()
	}

	if err := w.Close(); err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}

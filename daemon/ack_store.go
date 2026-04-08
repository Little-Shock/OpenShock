package daemon

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sync"
)

type DurableAckStore struct {
	path  string
	mu    sync.Mutex
	acked map[string]uint64
}

func OpenDurableAckStore(path string) (*DurableAckStore, error) {
	if path == "" {
		return nil, fmt.Errorf("ack path is required")
	}
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		return nil, fmt.Errorf("create ack dir: %w", err)
	}

	store := &DurableAckStore{path: path, acked: map[string]uint64{}}
	if err := store.load(); err != nil {
		return nil, err
	}
	return store, nil
}

func (s *DurableAckStore) load() error {
	data, err := os.ReadFile(s.path)
	if err != nil {
		if os.IsNotExist(err) {
			return nil
		}
		return fmt.Errorf("read ack file: %w", err)
	}
	if len(data) == 0 {
		return nil
	}
	if err := json.Unmarshal(data, &s.acked); err != nil {
		return fmt.Errorf("decode ack file: %w", err)
	}
	if s.acked == nil {
		s.acked = map[string]uint64{}
	}
	return nil
}

func (s *DurableAckStore) Ack(runID string, sequence uint64) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if current, ok := s.acked[runID]; ok && sequence < current {
		return fmt.Errorf("ack sequence regression for run %s: %d < %d", runID, sequence, current)
	}
	s.acked[runID] = sequence
	return s.persistLocked()
}

func (s *DurableAckStore) Snapshot() map[string]uint64 {
	s.mu.Lock()
	defer s.mu.Unlock()

	cloned := make(map[string]uint64, len(s.acked))
	for runID, sequence := range s.acked {
		cloned[runID] = sequence
	}
	return cloned
}

func (s *DurableAckStore) persistLocked() error {
	data, err := json.MarshalIndent(s.acked, "", "  ")
	if err != nil {
		return fmt.Errorf("encode ack file: %w", err)
	}

	tmpPath := s.path + ".tmp"
	if err := os.WriteFile(tmpPath, data, 0o644); err != nil {
		return fmt.Errorf("write temp ack file: %w", err)
	}
	if err := os.Rename(tmpPath, s.path); err != nil {
		return fmt.Errorf("replace ack file: %w", err)
	}
	return nil
}

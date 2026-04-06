package daemon

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sync"
)

type PersistentStore struct {
	path     string
	mu       sync.Mutex
	snapshot Snapshot
}

func OpenStore(path string) (*PersistentStore, error) {
	if path == "" {
		return nil, fmt.Errorf("state path is required")
	}

	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		return nil, fmt.Errorf("create state dir: %w", err)
	}

	store := &PersistentStore{path: path, snapshot: NewSnapshot()}
	if err := store.load(); err != nil {
		return nil, err
	}
	return store, nil
}

func (s *PersistentStore) load() error {
	data, err := os.ReadFile(s.path)
	if err != nil {
		if os.IsNotExist(err) {
			return nil
		}
		return fmt.Errorf("read state: %w", err)
	}

	if len(data) == 0 {
		return nil
	}

	var snapshot Snapshot
	if err := json.Unmarshal(data, &snapshot); err != nil {
		return fmt.Errorf("decode state: %w", err)
	}
	if snapshot.Lanes == nil {
		snapshot.Lanes = map[string]Lane{}
	}
	if snapshot.Runs == nil {
		snapshot.Runs = map[string]Run{}
	}
	if snapshot.Events == nil {
		snapshot.Events = map[string][]RunEvent{}
	}
	if snapshot.Feedbacks == nil {
		snapshot.Feedbacks = map[string][]ExecutionFeedback{}
	}
	if snapshot.Holds == nil {
		snapshot.Holds = map[string][]ExecutionApprovalHold{}
	}

	s.snapshot = snapshot
	return nil
}

func (s *PersistentStore) Snapshot() Snapshot {
	s.mu.Lock()
	defer s.mu.Unlock()
	return s.snapshot.clone()
}

func (s *PersistentStore) Transaction(fn func(*Snapshot) error) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	working := s.snapshot.clone()
	if err := fn(&working); err != nil {
		return err
	}
	if err := persistAtomic(s.path, working); err != nil {
		return err
	}
	s.snapshot = working
	return nil
}

func persistAtomic(path string, snapshot Snapshot) error {
	data, err := json.MarshalIndent(snapshot, "", "  ")
	if err != nil {
		return fmt.Errorf("encode state: %w", err)
	}

	tmpPath := path + ".tmp"
	if err := os.WriteFile(tmpPath, data, 0o644); err != nil {
		return fmt.Errorf("write temp state: %w", err)
	}
	if err := os.Rename(tmpPath, path); err != nil {
		return fmt.Errorf("replace state: %w", err)
	}
	return nil
}

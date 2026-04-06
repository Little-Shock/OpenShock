package daemon

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sync"
)

type PublishCursor struct {
	RunEventSequence map[string]uint64 `json:"run_event_sequence"`
	FeedbackSeen     map[string]bool   `json:"feedback_seen"`
	HoldState        map[string]string `json:"hold_state"`
}

func newPublishCursor() PublishCursor {
	return PublishCursor{
		RunEventSequence: map[string]uint64{},
		FeedbackSeen:     map[string]bool{},
		HoldState:        map[string]string{},
	}
}

type PublishCursorStore struct {
	path   string
	mu     sync.Mutex
	cursor PublishCursor
}

func OpenPublishCursorStore(path string) (*PublishCursorStore, error) {
	if path == "" {
		return nil, fmt.Errorf("publish cursor path is required")
	}
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		return nil, fmt.Errorf("create publish cursor dir: %w", err)
	}

	store := &PublishCursorStore{path: path, cursor: newPublishCursor()}
	if err := store.load(); err != nil {
		return nil, err
	}
	return store, nil
}

func (s *PublishCursorStore) load() error {
	data, err := os.ReadFile(s.path)
	if err != nil {
		if os.IsNotExist(err) {
			return nil
		}
		return fmt.Errorf("read publish cursor: %w", err)
	}
	if len(data) == 0 {
		return nil
	}

	var cursor PublishCursor
	if err := json.Unmarshal(data, &cursor); err != nil {
		return fmt.Errorf("decode publish cursor: %w", err)
	}
	if cursor.RunEventSequence == nil {
		cursor.RunEventSequence = map[string]uint64{}
	}
	if cursor.FeedbackSeen == nil {
		cursor.FeedbackSeen = map[string]bool{}
	}
	if cursor.HoldState == nil {
		cursor.HoldState = map[string]string{}
	}
	s.cursor = cursor
	return nil
}

func (s *PublishCursorStore) Snapshot() PublishCursor {
	s.mu.Lock()
	defer s.mu.Unlock()
	return cloneCursor(s.cursor)
}

func (s *PublishCursorStore) Save(cursor PublishCursor) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if err := persistCursor(s.path, cursor); err != nil {
		return err
	}
	s.cursor = cloneCursor(cursor)
	return nil
}

func cloneCursor(cursor PublishCursor) PublishCursor {
	cloned := newPublishCursor()
	for runID, seq := range cursor.RunEventSequence {
		cloned.RunEventSequence[runID] = seq
	}
	for feedbackID, seen := range cursor.FeedbackSeen {
		cloned.FeedbackSeen[feedbackID] = seen
	}
	for holdID, state := range cursor.HoldState {
		cloned.HoldState[holdID] = state
	}
	return cloned
}

func persistCursor(path string, cursor PublishCursor) error {
	payload, err := json.MarshalIndent(cursor, "", "  ")
	if err != nil {
		return fmt.Errorf("encode publish cursor: %w", err)
	}

	tmp := path + ".tmp"
	if err := os.WriteFile(tmp, payload, 0o644); err != nil {
		return fmt.Errorf("write temp publish cursor: %w", err)
	}
	if err := os.Rename(tmp, path); err != nil {
		return fmt.Errorf("replace publish cursor: %w", err)
	}
	return nil
}

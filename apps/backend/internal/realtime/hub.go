package realtime

import (
	"slices"
	"strconv"
	"strings"
	"sync"
	"time"
)

type Event struct {
	ID         string         `json:"eventId"`
	Sequence   int64          `json:"sequence"`
	Type       string         `json:"type"`
	Scopes     []string       `json:"scopes"`
	OccurredAt string         `json:"occurredAt"`
	Payload    map[string]any `json:"payload,omitempty"`
}

type subscriber struct {
	id     int64
	scopes []string
	ch     chan Event
}

type Subscription struct {
	Events  <-chan Event
	Replay  []Event
	Current int64
	Resync  bool
	cancel  func()
}

func (s Subscription) Close() {
	if s.cancel != nil {
		s.cancel()
	}
}

type Hub struct {
	mu         sync.Mutex
	nextSeq    int64
	nextSubID  int64
	historyCap int
	history    []Event
	subs       map[int64]*subscriber
}

func NewHub(historyCap int) *Hub {
	if historyCap <= 0 {
		historyCap = 256
	}
	return &Hub{
		historyCap: historyCap,
		history:    make([]Event, 0, historyCap),
		subs:       map[int64]*subscriber{},
	}
}

func (h *Hub) CurrentSequence() int64 {
	h.mu.Lock()
	defer h.mu.Unlock()
	return h.nextSeq
}

func (h *Hub) Subscribe(scopes []string, lastSequence int64) Subscription {
	normalizedScopes := normalizeScopes(scopes)

	h.mu.Lock()
	defer h.mu.Unlock()

	h.nextSubID++
	sub := &subscriber{
		id:     h.nextSubID,
		scopes: normalizedScopes,
		ch:     make(chan Event, 32),
	}
	h.subs[sub.id] = sub

	replay, resync := h.replayLocked(normalizedScopes, lastSequence)

	return Subscription{
		Events:  sub.ch,
		Replay:  replay,
		Current: h.nextSeq,
		Resync:  resync,
		cancel: func() {
			h.unsubscribe(sub.id)
		},
	}
}

func (h *Hub) Publish(eventType string, scopes []string, payload map[string]any) Event {
	h.mu.Lock()
	defer h.mu.Unlock()

	h.nextSeq++
	event := Event{
		ID:         strconv.FormatInt(h.nextSeq, 10),
		Sequence:   h.nextSeq,
		Type:       strings.TrimSpace(eventType),
		Scopes:     normalizeScopes(scopes),
		OccurredAt: time.Now().UTC().Format(time.RFC3339),
		Payload:    payload,
	}

	h.history = append(h.history, event)
	if len(h.history) > h.historyCap {
		h.history = slices.Clone(h.history[len(h.history)-h.historyCap:])
	}

	for id, sub := range h.subs {
		if !matchesScope(sub.scopes, event.Scopes) {
			continue
		}
		select {
		case sub.ch <- event:
		default:
			close(sub.ch)
			delete(h.subs, id)
		}
	}

	return event
}

func (h *Hub) unsubscribe(id int64) {
	h.mu.Lock()
	defer h.mu.Unlock()

	sub, ok := h.subs[id]
	if !ok {
		return
	}
	delete(h.subs, id)
	close(sub.ch)
}

func (h *Hub) replayLocked(scopes []string, lastSequence int64) ([]Event, bool) {
	if lastSequence <= 0 || len(h.history) == 0 {
		return nil, false
	}

	oldestSequence := h.history[0].Sequence
	if lastSequence < oldestSequence-1 {
		return nil, true
	}

	replay := make([]Event, 0)
	for _, event := range h.history {
		if event.Sequence <= lastSequence {
			continue
		}
		if matchesScope(scopes, event.Scopes) {
			replay = append(replay, event)
		}
	}
	return replay, false
}

func normalizeScopes(scopes []string) []string {
	seen := map[string]struct{}{}
	result := make([]string, 0, len(scopes))
	for _, scope := range scopes {
		value := strings.TrimSpace(scope)
		if value == "" {
			continue
		}
		if _, ok := seen[value]; ok {
			continue
		}
		seen[value] = struct{}{}
		result = append(result, value)
	}
	if len(result) == 0 {
		return []string{"workspace:ws_01"}
	}
	return result
}

func matchesScope(subscribed []string, eventScopes []string) bool {
	if len(subscribed) == 0 {
		return true
	}
	set := map[string]struct{}{}
	for _, scope := range eventScopes {
		set[scope] = struct{}{}
	}
	for _, scope := range subscribed {
		if _, ok := set[scope]; ok {
			return true
		}
	}
	return false
}

package api

import (
	"bufio"
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"openshock/backend/internal/realtime"
	"openshock/backend/internal/store"
)

type sseEvent struct {
	ID    string
	Event string
	Data  string
}

func TestRealtimeEndpointStreamsActionUpdates(t *testing.T) {
	server := httptest.NewServer(New(store.NewMemoryStore()).Handler())
	defer server.Close()

	client := server.Client()
	stream := openRealtimeStream(t, client, server.URL+"/api/v1/realtime/events?scope=workspace:ws_01", "")
	defer stream.Body.Close()

	reader := bufio.NewReader(stream.Body)
	ready := mustReadSSEEvent(t, reader)
	if ready.Event != "ready" {
		t.Fatalf("expected ready event, got %#v", ready)
	}

	eventCh := make(chan sseEvent, 1)
	errCh := make(chan error, 1)
	go func() {
		event, err := readSSEEvent(reader)
		if err != nil {
			errCh <- err
			return
		}
		eventCh <- event
	}()

	postAction(t, client, server.URL, []byte(`{"actorType":"agent","actorId":"agent_lead","actionType":"RoomMessage.post","targetType":"issue","targetId":"issue_101","idempotencyKey":"realtime-message-1","payload":{"body":"Realtime pipeline online."}}`))

	select {
	case err := <-errCh:
		t.Fatalf("failed while reading realtime update: %v", err)
	case event := <-eventCh:
		if event.Event != "update" {
			t.Fatalf("expected update event, got %#v", event)
		}

		var payload struct {
			Type    string         `json:"type"`
			Scopes  []string       `json:"scopes"`
			Payload map[string]any `json:"payload"`
		}
		if err := json.Unmarshal([]byte(event.Data), &payload); err != nil {
			t.Fatalf("failed to decode realtime payload: %v", err)
		}
		if payload.Type != "action.applied" {
			t.Fatalf("expected action.applied event, got %q", payload.Type)
		}
		if payload.Payload["actionType"] != "RoomMessage.post" {
			t.Fatalf("expected RoomMessage.post payload, got %#v", payload.Payload)
		}
		if !containsScope(payload.Scopes, "issue:issue_101") {
			t.Fatalf("expected issue scope, got %#v", payload.Scopes)
		}
		if !containsScope(payload.Scopes, "room:room_101") {
			t.Fatalf("expected room scope, got %#v", payload.Scopes)
		}
	case <-time.After(2 * time.Second):
		t.Fatal("timed out waiting for realtime update")
	}
}

func TestRealtimeEndpointReplaysBufferedEvents(t *testing.T) {
	api := newAPI(store.NewMemoryStore(), realtime.NewHub(8))
	server := httptest.NewServer(api.Handler())
	defer server.Close()

	client := server.Client()
	postAction(t, client, server.URL, []byte(`{"actorType":"agent","actorId":"agent_lead","actionType":"RoomMessage.post","targetType":"issue","targetId":"issue_101","idempotencyKey":"replay-message-1","payload":{"body":"First event."}}`))
	postAction(t, client, server.URL, []byte(`{"actorType":"agent","actorId":"agent_lead","actionType":"RoomMessage.post","targetType":"issue","targetId":"issue_101","idempotencyKey":"replay-message-2","payload":{"body":"Second event."}}`))

	stream := openRealtimeStream(t, client, server.URL+"/api/v1/realtime/events?scope=workspace:ws_01", "1")
	defer stream.Body.Close()

	reader := bufio.NewReader(stream.Body)
	replayed := mustReadSSEEvent(t, reader)
	if replayed.Event != "update" || replayed.ID != "2" {
		t.Fatalf("expected replayed update with id 2, got %#v", replayed)
	}

	ready := mustReadSSEEvent(t, reader)
	if ready.Event != "ready" {
		t.Fatalf("expected ready event after replay, got %#v", ready)
	}
}

func TestRealtimeEndpointSignalsResyncWhenHistoryGapExceeded(t *testing.T) {
	api := newAPI(store.NewMemoryStore(), realtime.NewHub(2))
	server := httptest.NewServer(api.Handler())
	defer server.Close()

	client := server.Client()
	postAction(t, client, server.URL, []byte(`{"actorType":"agent","actorId":"agent_lead","actionType":"RoomMessage.post","targetType":"issue","targetId":"issue_101","idempotencyKey":"gap-message-1","payload":{"body":"First event."}}`))
	postAction(t, client, server.URL, []byte(`{"actorType":"agent","actorId":"agent_lead","actionType":"RoomMessage.post","targetType":"issue","targetId":"issue_101","idempotencyKey":"gap-message-2","payload":{"body":"Second event."}}`))
	postAction(t, client, server.URL, []byte(`{"actorType":"agent","actorId":"agent_lead","actionType":"RoomMessage.post","targetType":"issue","targetId":"issue_101","idempotencyKey":"gap-message-3","payload":{"body":"Third event."}}`))
	postAction(t, client, server.URL, []byte(`{"actorType":"agent","actorId":"agent_lead","actionType":"RoomMessage.post","targetType":"issue","targetId":"issue_101","idempotencyKey":"gap-message-4","payload":{"body":"Fourth event."}}`))

	stream := openRealtimeStream(t, client, server.URL+"/api/v1/realtime/events?scope=workspace:ws_01", "1")
	defer stream.Body.Close()

	reader := bufio.NewReader(stream.Body)
	first := mustReadSSEEvent(t, reader)
	if first.Event != "resync_required" {
		t.Fatalf("expected resync_required event, got %#v", first)
	}
}

func openRealtimeStream(t *testing.T, client *http.Client, url string, lastEventID string) *http.Response {
	t.Helper()

	req, err := http.NewRequest(http.MethodGet, url, nil)
	if err != nil {
		t.Fatalf("failed to create realtime request: %v", err)
	}
	if strings.TrimSpace(lastEventID) != "" {
		req.Header.Set("Last-Event-ID", lastEventID)
	}

	resp, err := client.Do(req)
	if err != nil {
		t.Fatalf("failed to connect realtime stream: %v", err)
	}
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected realtime stream 200, got %d", resp.StatusCode)
	}
	return resp
}

func postAction(t *testing.T, client *http.Client, baseURL string, body []byte) {
	t.Helper()

	req, err := http.NewRequest(http.MethodPost, baseURL+"/api/v1/actions", bytes.NewReader(body))
	if err != nil {
		t.Fatalf("failed to create action request: %v", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		t.Fatalf("failed to submit action: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		payload, _ := io.ReadAll(resp.Body)
		t.Fatalf("expected action 200, got %d with body %s", resp.StatusCode, string(payload))
	}
}

func mustReadSSEEvent(t *testing.T, reader *bufio.Reader) sseEvent {
	t.Helper()

	event, err := readSSEEvent(reader)
	if err != nil {
		t.Fatalf("failed to read SSE event: %v", err)
	}
	return event
}

func readSSEEvent(reader *bufio.Reader) (sseEvent, error) {
	var event sseEvent

	for {
		line, err := reader.ReadString('\n')
		if err != nil {
			return sseEvent{}, err
		}

		line = strings.TrimRight(line, "\n")
		line = strings.TrimRight(line, "\r")

		if line == "" {
			if event.Event != "" || event.Data != "" || event.ID != "" {
				return event, nil
			}
			continue
		}
		if strings.HasPrefix(line, ":") {
			continue
		}
		switch {
		case strings.HasPrefix(line, "id: "):
			event.ID = strings.TrimPrefix(line, "id: ")
		case strings.HasPrefix(line, "event: "):
			event.Event = strings.TrimPrefix(line, "event: ")
		case strings.HasPrefix(line, "data: "):
			if event.Data != "" {
				event.Data += "\n"
			}
			event.Data += strings.TrimPrefix(line, "data: ")
		}
	}
}

func containsScope(scopes []string, expected string) bool {
	for _, scope := range scopes {
		if scope == expected {
			return true
		}
	}
	return false
}

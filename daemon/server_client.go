package daemon

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

type RuntimeConfigResponse struct {
	RuntimeName   string            `json:"runtimeName,omitempty"`
	ServerPort    int               `json:"serverPort,omitempty"`
	SampleFixture SampleFixtureInfo `json:"sampleFixture"`
	Endpoints     map[string]string `json:"endpoints,omitempty"`
}

type SampleFixtureInfo struct {
	TopicID string `json:"topicId,omitempty"`
}

type RuntimeSeedResponse struct {
	TopicCreated bool `json:"topicCreated,omitempty"`
	AgentCount   int  `json:"agentCount,omitempty"`
}

type RuntimeSmokeResponse struct {
	SampleTopicReady      bool `json:"sampleTopicReady,omitempty"`
	SampleTopicAgentCount int  `json:"sampleTopicAgentCount,omitempty"`
}

type DaemonEventType string

const (
	DaemonEventStatusReport      DaemonEventType = "status_report"
	DaemonEventFeedbackIngest    DaemonEventType = "feedback_ingest"
	DaemonEventBlockerEscalation DaemonEventType = "blocker_escalation"
)

type RuntimeDaemonEventRequest struct {
	TopicID string          `json:"topicId"`
	Type    DaemonEventType `json:"type"`
	Payload any             `json:"payload,omitempty"`
}

type ServerClient struct {
	cfg        ServerConfig
	httpClient *http.Client
}

func NewServerClient(cfg ServerConfig, httpClient *http.Client) *ServerClient {
	if httpClient == nil {
		httpClient = &http.Client{Timeout: 15 * time.Second}
	}
	return &ServerClient{cfg: cfg, httpClient: httpClient}
}

func (c *ServerClient) FetchRuntimeConfig(ctx context.Context) (RuntimeConfigResponse, error) {
	var config RuntimeConfigResponse
	if err := c.getJSON(ctx, c.cfg.RuntimeConfigPath, &config); err != nil {
		return RuntimeConfigResponse{}, err
	}
	return config, nil
}

func (c *ServerClient) SeedFixtures(ctx context.Context) (RuntimeSeedResponse, error) {
	var response RuntimeSeedResponse
	if err := c.postJSON(ctx, c.cfg.FixtureSeedPath, map[string]any{}, &response); err != nil {
		return RuntimeSeedResponse{}, err
	}
	return response, nil
}

func (c *ServerClient) CheckSmoke(ctx context.Context) (RuntimeSmokeResponse, error) {
	var smoke RuntimeSmokeResponse
	if err := c.getJSON(ctx, c.cfg.RuntimeSmokePath, &smoke); err != nil {
		return RuntimeSmokeResponse{}, err
	}
	return smoke, nil
}

func (c *ServerClient) PublishDaemonEvent(ctx context.Context, request RuntimeDaemonEventRequest) error {
	if strings.TrimSpace(request.TopicID) == "" {
		return fmt.Errorf("topic id is required for daemon event")
	}
	if strings.TrimSpace(string(request.Type)) == "" {
		return fmt.Errorf("event type is required for daemon event")
	}
	return c.postJSON(ctx, c.cfg.DaemonEventsPath, request, nil)
}

func (c *ServerClient) getJSON(ctx context.Context, path string, out any) error {
	if strings.TrimSpace(c.cfg.BaseURL) == "" {
		return fmt.Errorf("server base url is required")
	}
	url := c.cfg.BaseURL + path
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return fmt.Errorf("build request: %w", err)
	}
	if token := strings.TrimSpace(c.cfg.APIToken); token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("get %s: %w", url, err)
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 300 {
		payload, _ := io.ReadAll(io.LimitReader(resp.Body, 2048))
		return fmt.Errorf("get %s failed: status=%d body=%s", url, resp.StatusCode, strings.TrimSpace(string(payload)))
	}
	if out == nil {
		return nil
	}
	if err := json.NewDecoder(resp.Body).Decode(out); err != nil && err != io.EOF {
		return fmt.Errorf("decode %s response: %w", url, err)
	}
	return nil
}

func (c *ServerClient) postJSON(ctx context.Context, path string, payload any, out any) error {
	if strings.TrimSpace(c.cfg.BaseURL) == "" {
		return fmt.Errorf("server base url is required")
	}

	url := c.cfg.BaseURL + path
	body, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("encode request payload: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("build request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	if token := strings.TrimSpace(c.cfg.APIToken); token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("post %s: %w", url, err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 300 {
		responsePayload, _ := io.ReadAll(io.LimitReader(resp.Body, 2048))
		return fmt.Errorf("post %s failed: status=%d body=%s", url, resp.StatusCode, strings.TrimSpace(string(responsePayload)))
	}
	if out == nil {
		return nil
	}
	if err := json.NewDecoder(resp.Body).Decode(out); err != nil && err != io.EOF {
		return fmt.Errorf("decode %s response: %w", url, err)
	}
	return nil
}

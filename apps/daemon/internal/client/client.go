package client

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"
)

type HTTPStatusError struct {
	StatusCode int
	Status     string
}

func (e *HTTPStatusError) Error() string {
	return fmt.Sprintf("request failed: %s", e.Status)
}

func IsHTTPStatus(err error, code int) bool {
	statusErr, ok := err.(*HTTPStatusError)
	return ok && statusErr.StatusCode == code
}

type Client struct {
	baseURL    string
	httpClient *http.Client
}

func New(baseURL string) *Client {
	return &Client{
		baseURL: strings.TrimRight(baseURL, "/"),
		httpClient: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

func (c *Client) RegisterRuntime(ctx context.Context, req RegisterRuntimeRequest) (RegisterRuntimeResponse, error) {
	var resp RegisterRuntimeResponse
	err := c.doJSON(ctx, http.MethodPost, "/api/v1/runtimes/register", req, &resp)
	return resp, err
}

func (c *Client) SubmitAction(ctx context.Context, req ActionRequest) (ActionResponse, error) {
	var resp ActionResponse
	err := c.doJSON(ctx, http.MethodPost, "/api/v1/actions", req, &resp)
	return resp, err
}

func (c *Client) HeartbeatRuntime(ctx context.Context, runtimeID string, req RuntimeHeartbeatRequest) (RuntimeHeartbeatResponse, error) {
	var resp RuntimeHeartbeatResponse
	err := c.doJSON(ctx, http.MethodPost, fmt.Sprintf("/api/v1/runtimes/%s/heartbeat", runtimeID), req, &resp)
	return resp, err
}

func (c *Client) ClaimAgentTurn(ctx context.Context, runtimeID string) (AgentTurnClaimResponse, error) {
	var resp AgentTurnClaimResponse
	err := c.doJSON(ctx, http.MethodPost, "/api/v1/agent-turns/claim", AgentTurnClaimRequest{RuntimeID: runtimeID}, &resp)
	return resp, err
}

func (c *Client) CompleteAgentTurn(ctx context.Context, turnID string, req AgentTurnCompleteRequest) (AgentTurnCompleteResponse, error) {
	var resp AgentTurnCompleteResponse
	err := c.doJSON(ctx, http.MethodPost, fmt.Sprintf("/api/v1/agent-turns/%s/complete", turnID), req, &resp)
	return resp, err
}

func (c *Client) ClaimRun(ctx context.Context, runtimeID string) (RunClaimResponse, error) {
	var resp RunClaimResponse
	err := c.doJSON(ctx, http.MethodPost, "/api/v1/runs/claim", RunClaimRequest{RuntimeID: runtimeID}, &resp)
	return resp, err
}

func (c *Client) PostRunEvent(ctx context.Context, runID string, req RunEventRequest) (RunEventResponse, error) {
	var resp RunEventResponse
	err := c.doJSON(ctx, http.MethodPost, fmt.Sprintf("/api/v1/runs/%s/events", runID), req, &resp)
	return resp, err
}

func (c *Client) ClaimMerge(ctx context.Context, runtimeID string) (MergeClaimResponse, error) {
	var resp MergeClaimResponse
	err := c.doJSON(ctx, http.MethodPost, "/api/v1/merges/claim", MergeClaimRequest{RuntimeID: runtimeID}, &resp)
	return resp, err
}

func (c *Client) PostMergeEvent(ctx context.Context, mergeAttemptID string, req MergeEventRequest) (MergeEventResponse, error) {
	var resp MergeEventResponse
	err := c.doJSON(ctx, http.MethodPost, fmt.Sprintf("/api/v1/merges/%s/events", mergeAttemptID), req, &resp)
	return resp, err
}

func (c *Client) doJSON(ctx context.Context, method, path string, payload any, out any) error {
	var body bytes.Buffer
	if err := json.NewEncoder(&body).Encode(payload); err != nil {
		return err
	}

	req, err := http.NewRequestWithContext(ctx, method, c.baseURL+path, &body)
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		return &HTTPStatusError{
			StatusCode: resp.StatusCode,
			Status:     resp.Status,
		}
	}

	return json.NewDecoder(resp.Body).Decode(out)
}

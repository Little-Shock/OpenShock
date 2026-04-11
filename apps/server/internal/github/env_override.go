package github

import (
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"strconv"
	"strings"
)

const (
	envFakeGitHubSyncResponses  = "OPENSHOCK_FAKE_GITHUB_SYNC_RESPONSES"
	envFakeGitHubMergeResponses = "OPENSHOCK_FAKE_GITHUB_MERGE_RESPONSES"
	envFakeGitHubSyncError      = "OPENSHOCK_FAKE_GITHUB_SYNC_ERROR"
	envFakeGitHubMergeError     = "OPENSHOCK_FAKE_GITHUB_MERGE_ERROR"
)

type envOverrideClient struct {
	base     Client
	syncPRs  map[int]PullRequest
	mergePRs map[int]PullRequest
	syncErr  string
	mergeErr string
	useSync  bool
	useMerge bool
}

func NewEnvOverrideClient(base Client) (Client, error) {
	if base == nil {
		base = NewService(nil)
	}

	syncPRs, useSync, err := parseFakePullRequestResponses(os.Getenv(envFakeGitHubSyncResponses))
	if err != nil {
		return nil, fmt.Errorf("parse %s: %w", envFakeGitHubSyncResponses, err)
	}
	mergePRs, useMerge, err := parseFakePullRequestResponses(os.Getenv(envFakeGitHubMergeResponses))
	if err != nil {
		return nil, fmt.Errorf("parse %s: %w", envFakeGitHubMergeResponses, err)
	}

	syncErr := strings.TrimSpace(os.Getenv(envFakeGitHubSyncError))
	mergeErr := strings.TrimSpace(os.Getenv(envFakeGitHubMergeError))
	if !useSync && !useMerge && syncErr == "" && mergeErr == "" {
		return base, nil
	}

	return &envOverrideClient{
		base:     base,
		syncPRs:  syncPRs,
		mergePRs: mergePRs,
		syncErr:  syncErr,
		mergeErr: mergeErr,
		useSync:  useSync || syncErr != "",
		useMerge: useMerge || mergeErr != "",
	}, nil
}

func parseFakePullRequestResponses(raw string) (map[int]PullRequest, bool, error) {
	trimmed := strings.TrimSpace(raw)
	if trimmed == "" {
		return nil, false, nil
	}

	var decoded map[string]PullRequest
	if err := json.Unmarshal([]byte(trimmed), &decoded); err != nil {
		return nil, true, err
	}

	responses := make(map[int]PullRequest, len(decoded))
	for key, value := range decoded {
		number, err := strconv.Atoi(strings.TrimSpace(key))
		if err != nil {
			return nil, true, fmt.Errorf("invalid pull request number %q", key)
		}
		if value.Number == 0 {
			value.Number = number
		}
		responses[number] = value
	}
	return responses, true, nil
}

func (c *envOverrideClient) Probe(workspaceRoot string) (Status, error) {
	return c.base.Probe(workspaceRoot)
}

func (c *envOverrideClient) CreatePullRequest(workspaceRoot string, input CreatePullRequestInput) (PullRequest, error) {
	return c.base.CreatePullRequest(workspaceRoot, input)
}

func (c *envOverrideClient) SyncPullRequest(workspaceRoot string, input SyncPullRequestInput) (PullRequest, error) {
	if c.useSync {
		if c.syncErr != "" {
			return PullRequest{}, errors.New(c.syncErr)
		}
		if value, ok := c.syncPRs[input.Number]; ok {
			return value, nil
		}
	}
	return c.base.SyncPullRequest(workspaceRoot, input)
}

func (c *envOverrideClient) MergePullRequest(workspaceRoot string, input MergePullRequestInput) (PullRequest, error) {
	if c.useMerge {
		if c.mergeErr != "" {
			return PullRequest{}, errors.New(c.mergeErr)
		}
		if value, ok := c.mergePRs[input.Number]; ok {
			return value, nil
		}
	}
	return c.base.MergePullRequest(workspaceRoot, input)
}

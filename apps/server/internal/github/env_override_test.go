package github

import "testing"

type envOverrideTestClient struct {
	syncCalls   []SyncPullRequestInput
	mergeCalls  []MergePullRequestInput
	syncResult  PullRequest
	mergeResult PullRequest
}

func (c *envOverrideTestClient) Probe(string) (Status, error) {
	return Status{}, nil
}

func (c *envOverrideTestClient) CreatePullRequest(string, CreatePullRequestInput) (PullRequest, error) {
	return PullRequest{}, nil
}

func (c *envOverrideTestClient) SyncPullRequest(_ string, input SyncPullRequestInput) (PullRequest, error) {
	c.syncCalls = append(c.syncCalls, input)
	return c.syncResult, nil
}

func (c *envOverrideTestClient) MergePullRequest(_ string, input MergePullRequestInput) (PullRequest, error) {
	c.mergeCalls = append(c.mergeCalls, input)
	return c.mergeResult, nil
}

func TestNewEnvOverrideClientReturnsConfiguredSyncResponse(t *testing.T) {
	t.Setenv(envFakeGitHubSyncResponses, `{"22":{"url":"https://github.com/example/repo/pull/22","title":"Inbox review","state":"MERGED","merged":true}}`)

	base := &envOverrideTestClient{
		syncResult: PullRequest{Number: 99, Title: "fallback"},
	}
	client, err := NewEnvOverrideClient(base)
	if err != nil {
		t.Fatalf("NewEnvOverrideClient() error = %v", err)
	}

	pullRequest, err := client.SyncPullRequest("", SyncPullRequestInput{Repo: "example/repo", Number: 22})
	if err != nil {
		t.Fatalf("SyncPullRequest() error = %v", err)
	}
	if pullRequest.Number != 22 || !pullRequest.Merged || pullRequest.State != "MERGED" {
		t.Fatalf("SyncPullRequest() = %#v, want env-backed merged response", pullRequest)
	}
	if len(base.syncCalls) != 0 {
		t.Fatalf("base client should not be called for overridden sync response: %#v", base.syncCalls)
	}

	fallback, err := client.SyncPullRequest("", SyncPullRequestInput{Repo: "example/repo", Number: 99})
	if err != nil {
		t.Fatalf("fallback SyncPullRequest() error = %v", err)
	}
	if fallback.Number != 99 || fallback.Title != "fallback" {
		t.Fatalf("fallback SyncPullRequest() = %#v, want base response", fallback)
	}
	if len(base.syncCalls) != 1 || base.syncCalls[0].Number != 99 {
		t.Fatalf("base sync calls = %#v, want one fallback call for PR 99", base.syncCalls)
	}
}

func TestNewEnvOverrideClientRejectsInvalidJSON(t *testing.T) {
	t.Setenv(envFakeGitHubSyncResponses, `{"22":`)

	if _, err := NewEnvOverrideClient(&envOverrideTestClient{}); err == nil {
		t.Fatal("NewEnvOverrideClient() error = nil, want invalid JSON rejection")
	}
}

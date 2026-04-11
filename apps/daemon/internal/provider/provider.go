package provider

import (
	"context"

	"openshock/daemon/internal/acp"
)

type ExecuteRequest struct {
	RepoPath       string
	Instruction    string
	CodexBinPath   string
	SandboxMode    string
	CodexHome      string
	ExecutionKind  string
	SessionKey     string
	ResumeThreadID string
}

type ExecuteResult struct {
	LastMessage      string
	RawOutput        string
	ProviderThreadID string
	ProviderTurnID   string
}

type Executor interface {
	Execute(ctx context.Context, req ExecuteRequest, handle func(acp.Event) error) (ExecuteResult, error)
	Close() error
}

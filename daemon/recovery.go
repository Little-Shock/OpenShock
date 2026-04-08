package daemon

import (
	"context"
)

type RecoveryHooks interface {
	OnRunRecoveryCandidate(ctx context.Context, run Run) error
	OnRunRecoveryFailed(ctx context.Context, run Run, cause error)
}

type NoopRecoveryHooks struct{}

func (NoopRecoveryHooks) OnRunRecoveryCandidate(context.Context, Run) error {
	return nil
}

func (NoopRecoveryHooks) OnRunRecoveryFailed(context.Context, Run, error) {}

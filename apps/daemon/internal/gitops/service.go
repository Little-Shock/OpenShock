package gitops

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"os/exec"
	"strings"
)

const (
	MergeStatusSucceeded  = "succeeded"
	MergeStatusConflicted = "conflicted"
)

type MergeResult struct {
	Status       string
	SourceBranch string
	TargetBranch string
	Output       string
}

type Service struct{}

func New() *Service {
	return &Service{}
}

func (s *Service) CreateBranch(ctx context.Context, repoPath, baseRef, branchName string) error {
	if strings.TrimSpace(repoPath) == "" || strings.TrimSpace(baseRef) == "" || strings.TrimSpace(branchName) == "" {
		return errors.New("repoPath, baseRef, and branchName are required")
	}

	_, err := runGit(ctx, repoPath, "branch", "-f", branchName, baseRef)
	return err
}

func (s *Service) EnsureBranch(ctx context.Context, repoPath, baseRef, branchName string) error {
	if strings.TrimSpace(repoPath) == "" || strings.TrimSpace(baseRef) == "" || strings.TrimSpace(branchName) == "" {
		return errors.New("repoPath, baseRef, and branchName are required")
	}

	if _, err := runGit(ctx, repoPath, "rev-parse", "--verify", baseRef); err != nil {
		if baseRef != "main" {
			if err := s.CreateBranch(ctx, repoPath, "main", baseRef); err != nil {
				return err
			}
		} else {
			return err
		}
	}

	if _, err := runGit(ctx, repoPath, "rev-parse", "--verify", branchName); err != nil {
		if err := s.CreateBranch(ctx, repoPath, baseRef, branchName); err != nil {
			return err
		}
	}

	_, err := runGit(ctx, repoPath, "checkout", branchName)
	return err
}

func (s *Service) CommitAll(ctx context.Context, repoPath, message string) (bool, error) {
	if strings.TrimSpace(repoPath) == "" || strings.TrimSpace(message) == "" {
		return false, errors.New("repoPath and message are required")
	}

	statusOutput, err := runGit(ctx, repoPath, "status", "--short")
	if err != nil {
		return false, err
	}
	if strings.TrimSpace(statusOutput) == "" {
		return false, nil
	}

	if _, err := runGit(ctx, repoPath, "add", "-A"); err != nil {
		return false, err
	}
	if _, err := runGit(ctx, repoPath, "commit", "-m", message); err != nil {
		return false, err
	}
	return true, nil
}

func (s *Service) MergeBranch(ctx context.Context, repoPath, sourceBranch, targetBranch string) (MergeResult, error) {
	if strings.TrimSpace(repoPath) == "" || strings.TrimSpace(sourceBranch) == "" || strings.TrimSpace(targetBranch) == "" {
		return MergeResult{}, errors.New("repoPath, sourceBranch, and targetBranch are required")
	}

	if _, err := runGit(ctx, repoPath, "checkout", targetBranch); err != nil {
		return MergeResult{}, err
	}

	output, err := runGit(ctx, repoPath, "merge", "--no-ff", "--no-edit", sourceBranch)
	result := MergeResult{
		SourceBranch: sourceBranch,
		TargetBranch: targetBranch,
		Output:       output,
	}
	if err == nil {
		result.Status = MergeStatusSucceeded
		return result, nil
	}

	if isMergeConflict(output) {
		result.Status = MergeStatusConflicted
		_, abortErr := runGit(ctx, repoPath, "merge", "--abort")
		if abortErr != nil {
			return result, fmt.Errorf("merge conflicted and abort failed: %w", abortErr)
		}
		return result, nil
	}

	return result, err
}

func runGit(ctx context.Context, repoPath string, args ...string) (string, error) {
	cmd := exec.CommandContext(ctx, "git", args...)
	cmd.Dir = repoPath

	var output bytes.Buffer
	cmd.Stdout = &output
	cmd.Stderr = &output

	err := cmd.Run()
	return output.String(), err
}

func isMergeConflict(output string) bool {
	return strings.Contains(output, "CONFLICT") || strings.Contains(output, "Automatic merge failed")
}

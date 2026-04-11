package main

import (
	"fmt"
	"strings"

	"openshock/daemon/internal/provider"
	"openshock/daemon/internal/provider/codex"
	"openshock/daemon/internal/provider/codexapp"
)

const (
	codexModeExec      = "exec"
	codexModeAppServer = "app-server"
	codexModeAuto      = "auto"
)

type providerFactoryOptions struct {
	CodexBinPath string
	CodexHome    string
}

func newExecutionProvider(mode string, options providerFactoryOptions) (provider.Executor, string, error) {
	switch normalizedCodexMode(mode) {
	case codexModeExec:
		return codex.NewExecutor(), codexModeExec, nil
	case codexModeAppServer:
		executor, err := codexapp.NewExecutor(codexapp.Options{
			CodexBinPath: options.CodexBinPath,
			CodexHome:    options.CodexHome,
		})
		if err != nil {
			return nil, "", err
		}
		return executor, codexModeAppServer, nil
	case codexModeAuto:
		executor, err := codexapp.NewExecutor(codexapp.Options{
			CodexBinPath: options.CodexBinPath,
			CodexHome:    options.CodexHome,
		})
		if err == nil {
			return executor, codexModeAppServer, nil
		}
		return codex.NewExecutor(), codexModeExec, nil
	default:
		return nil, "", fmt.Errorf("unsupported codex mode %q", mode)
	}
}

func normalizedCodexMode(mode string) string {
	switch strings.TrimSpace(mode) {
	case "", codexModeAuto:
		return codexModeAuto
	case codexModeExec:
		return codexModeExec
	case codexModeAppServer:
		return codexModeAppServer
	default:
		return strings.TrimSpace(mode)
	}
}

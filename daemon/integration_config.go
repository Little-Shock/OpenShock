package daemon

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

type SharedRuntimeConfig struct {
	WorkspaceID   string              `json:"workspace_id"`
	RuntimeID     string              `json:"runtime_id"`
	ShellStateURL string              `json:"shell_state_url"`
	Server        ServerConfig        `json:"server"`
	Daemon        DaemonRuntimeConfig `json:"daemon"`
}

type ServerConfig struct {
	BaseURL           string `json:"base_url"`
	APIToken          string `json:"api_token"`
	RuntimeConfigPath string `json:"runtime_config_path"`
	FixtureSeedPath   string `json:"fixture_seed_path"`
	DaemonEventsPath  string `json:"daemon_events_path"`
	RuntimeSmokePath  string `json:"runtime_smoke_path"`
}

type DaemonRuntimeConfig struct {
	StatePath         string `json:"state_path"`
	AckPath           string `json:"ack_path"`
	WorktreeRoot      string `json:"worktree_root"`
	PublishCursorPath string `json:"publish_cursor_path"`
}

func LoadSharedRuntimeConfig(path string) (SharedRuntimeConfig, error) {
	if strings.TrimSpace(path) == "" {
		return SharedRuntimeConfig{}, fmt.Errorf("shared runtime config path is required")
	}
	data, err := os.ReadFile(path)
	if err != nil {
		return SharedRuntimeConfig{}, fmt.Errorf("read shared runtime config: %w", err)
	}

	var cfg SharedRuntimeConfig
	if err := json.Unmarshal(data, &cfg); err != nil {
		return SharedRuntimeConfig{}, fmt.Errorf("decode shared runtime config: %w", err)
	}

	if err := cfg.normalize(path); err != nil {
		return SharedRuntimeConfig{}, err
	}
	return cfg, nil
}

func (cfg *SharedRuntimeConfig) normalize(sourcePath string) error {
	if strings.TrimSpace(cfg.WorkspaceID) == "" {
		return fmt.Errorf("workspace_id is required")
	}
	if strings.TrimSpace(cfg.RuntimeID) == "" {
		return fmt.Errorf("runtime_id is required")
	}
	if strings.TrimSpace(cfg.Server.BaseURL) == "" {
		return fmt.Errorf("server.base_url is required")
	}

	cfg.Server.BaseURL = strings.TrimRight(strings.TrimSpace(cfg.Server.BaseURL), "/")
	cfg.ShellStateURL = strings.TrimSpace(cfg.ShellStateURL)
	cfg.Server.RuntimeConfigPath = defaultPath(cfg.Server.RuntimeConfigPath, "/runtime/config")
	cfg.Server.FixtureSeedPath = defaultPath(cfg.Server.FixtureSeedPath, "/runtime/fixtures/seed")
	cfg.Server.DaemonEventsPath = defaultPath(cfg.Server.DaemonEventsPath, "/runtime/daemon/events")
	cfg.Server.RuntimeSmokePath = defaultPath(cfg.Server.RuntimeSmokePath, "/runtime/smoke")

	baseDir := filepath.Dir(sourcePath)
	cfg.Daemon.StatePath = resolvePath(baseDir, cfg.Daemon.StatePath, ".openshock-daemon/state.json")
	cfg.Daemon.AckPath = resolvePath(baseDir, cfg.Daemon.AckPath, ".openshock-daemon/ack.json")
	cfg.Daemon.WorktreeRoot = resolvePath(baseDir, cfg.Daemon.WorktreeRoot, ".openshock-daemon/worktrees")
	cfg.Daemon.PublishCursorPath = resolvePath(baseDir, cfg.Daemon.PublishCursorPath, ".openshock-daemon/publish-cursor.json")
	return nil
}

func defaultPath(pathValue, fallback string) string {
	value := strings.TrimSpace(pathValue)
	if value == "" {
		return fallback
	}
	if !strings.HasPrefix(value, "/") {
		return "/" + value
	}
	return value
}

func resolvePath(baseDir, configured, fallback string) string {
	candidate := strings.TrimSpace(configured)
	if candidate == "" {
		candidate = fallback
	}
	if filepath.IsAbs(candidate) {
		return candidate
	}
	return filepath.Clean(filepath.Join(baseDir, candidate))
}

package main

import (
	"context"
	"flag"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"

	"github.com/Little-Shock/OpenShockSwarm/daemon"
)

func main() {
	if len(os.Args) > 1 {
		switch os.Args[1] {
		case "integrated-up":
			runIntegratedUp(os.Args[2:])
			return
		case "integrated-publish":
			runIntegratedPublish(os.Args[2:])
			return
		case "integrated-demo":
			runIntegratedDemo(os.Args[2:])
			return
		}
	}

	runStandalone(os.Args[1:])
}

func runStandalone(args []string) {
	flags := flag.NewFlagSet("openshock-daemon", flag.ExitOnError)
	statePath := flags.String("state", defaultInDataDir("state.json"), "path to daemon state file")
	ackPath := flags.String("ack", defaultInDataDir("ack.json"), "path to durable ack file")
	worktreeRoot := flags.String("worktrees", defaultInDataDir("worktrees"), "path to daemon worktree root")
	recoverRuns := flags.Bool("recover", true, "recover in-flight runs on startup")
	flags.Parse(args)

	svc, err := daemon.NewService(daemon.Config{
		StatePath:    *statePath,
		AckPath:      *ackPath,
		WorktreeRoot: *worktreeRoot,
	})
	if err != nil {
		log.Fatalf("init daemon service: %v", err)
	}
	if *recoverRuns {
		if err := svc.RecoverInterruptedRuns(context.Background()); err != nil {
			log.Fatalf("recover interrupted runs: %v", err)
		}
	}

	fmt.Printf("openshock-daemon skeleton ready\nstate=%s\nack=%s\nworktrees=%s\n", *statePath, *ackPath, *worktreeRoot)
}

func runIntegratedUp(args []string) {
	flags := flag.NewFlagSet("integrated-up", flag.ExitOnError)
	configPath := flags.String("config", "runtime/shared-runtime-config.json", "path to shared runtime config")
	flags.Parse(args)

	cfg := loadSharedConfig(*configPath)
	integrated, err := daemon.NewIntegratedDaemon(cfg)
	if err != nil {
		log.Fatalf("init integrated daemon: %v", err)
	}
	runtimeCfg, err := integrated.EnsureRuntimeReady(context.Background())
	if err != nil {
		log.Fatalf("ensure runtime ready: %v", err)
	}
	sampleTopic := strings.TrimSpace(runtimeCfg.SampleFixture.TopicID)
	if sampleTopic == "" {
		sampleTopic = "<none>"
	}
	fmt.Printf("integrated runtime ready\nworkspace=%s\nruntime=%s\nserver=%s\nsample_topic=%s\n", cfg.WorkspaceID, cfg.RuntimeID, cfg.Server.BaseURL, sampleTopic)
}

func runIntegratedPublish(args []string) {
	flags := flag.NewFlagSet("integrated-publish", flag.ExitOnError)
	configPath := flags.String("config", "runtime/shared-runtime-config.json", "path to shared runtime config")
	runID := flags.String("run-id", "", "run id to publish")
	flags.Parse(args)

	if *runID == "" {
		log.Fatalf("--run-id is required")
	}

	cfg := loadSharedConfig(*configPath)
	integrated, err := daemon.NewIntegratedDaemon(cfg)
	if err != nil {
		log.Fatalf("init integrated daemon: %v", err)
	}
	published, err := integrated.PublishRun(context.Background(), *runID)
	if err != nil {
		log.Fatalf("publish run: %v", err)
	}
	fmt.Printf("published integration events\nrun=%s\nevents=%d\n", *runID, published)
}

func runIntegratedDemo(args []string) {
	flags := flag.NewFlagSet("integrated-demo", flag.ExitOnError)
	configPath := flags.String("config", "runtime/shared-runtime-config.json", "path to shared runtime config")
	issueID := flags.String("issue", "INTEGRATED-ISSUE", "issue id for demo lane")
	topicID := flags.String("topic", "", "topic id for demo lane (optional; default uses runtime sample fixture topic)")
	flags.Parse(args)

	cfg := loadSharedConfig(*configPath)
	integrated, err := daemon.NewIntegratedDaemon(cfg)
	if err != nil {
		log.Fatalf("init integrated daemon: %v", err)
	}

	lane, run, published, err := integrated.IntegratedDemo(context.Background(), *issueID, *topicID)
	if err != nil {
		log.Fatalf("integrated demo failed: %v", err)
	}

	fmt.Printf("integrated demo completed\nlane=%s\nrun=%s\npublished_events=%d\n", lane.ID, run.ID, published)
}

func loadSharedConfig(path string) daemon.SharedRuntimeConfig {
	cfg, err := daemon.LoadSharedRuntimeConfig(path)
	if err != nil {
		log.Fatalf("load shared runtime config: %v", err)
	}
	return cfg
}

func defaultInDataDir(child string) string {
	base := os.Getenv("OPENSHOCK_DAEMON_DATA_DIR")
	if base == "" {
		base = ".openshock-daemon"
	}
	return filepath.Join(base, child)
}

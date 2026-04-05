package main

import (
	"encoding/json"
	"flag"
	"log"
	"os/exec"
	"time"
)

type heartbeat struct {
	Machine       string   `json:"machine"`
	DetectedCLI   []string `json:"detectedCli"`
	State         string   `json:"state"`
	WorkspaceRoot string   `json:"workspaceRoot"`
	ReportedAt    string   `json:"reportedAt"`
}

func main() {
	once := flag.Bool("once", false, "print one heartbeat and exit")
	machine := flag.String("machine-name", "shock-main", "machine name reported to OpenShock")
	workspaceRoot := flag.String("workspace-root", ".", "workspace root for local runtime discovery")
	flag.Parse()

	if *once {
		printHeartbeat(*machine, *workspaceRoot)
		return
	}

	log.Printf("openshock-daemon watching %s from %s", *machine, *workspaceRoot)
	ticker := time.NewTicker(15 * time.Second)
	defer ticker.Stop()

	printHeartbeat(*machine, *workspaceRoot)
	for range ticker.C {
		printHeartbeat(*machine, *workspaceRoot)
	}
}

func printHeartbeat(machine, workspaceRoot string) {
	payload := heartbeat{
		Machine:       machine,
		DetectedCLI:   detectCLI(),
		State:         "online",
		WorkspaceRoot: workspaceRoot,
		ReportedAt:    time.Now().UTC().Format(time.RFC3339),
	}

	bytes, err := json.Marshal(payload)
	if err != nil {
		log.Printf("failed to marshal heartbeat: %v", err)
		return
	}

	log.Println(string(bytes))
}

func detectCLI() []string {
	candidates := []string{"codex", "claude", "claude-code"}
	detected := make([]string, 0, len(candidates))

	for _, candidate := range candidates {
		if _, err := exec.LookPath(candidate); err == nil {
			detected = append(detected, candidate)
		}
	}

	if len(detected) == 0 {
		return []string{"none-detected"}
	}

	return detected
}

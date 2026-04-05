package main

import (
	"encoding/json"
	"flag"
	"log"
	"net/http"
	"os"
	"path/filepath"

	"github.com/Larkspur-Wang/OpenShock/apps/daemon/internal/api"
	"github.com/Larkspur-Wang/OpenShock/apps/daemon/internal/runtime"
)

func main() {
	once := flag.Bool("once", false, "print one heartbeat and exit")
	machine := flag.String("machine-name", "shock-main", "machine name reported to OpenShock")
	workspaceRoot := flag.String("workspace-root", ".", "workspace root for local runtime discovery")
	addr := flag.String("addr", envOr("OPENSHOCK_DAEMON_ADDR", ":8090"), "http listen address")
	flag.Parse()

	root, err := filepath.Abs(*workspaceRoot)
	if err != nil {
		log.Fatal(err)
	}

	service := runtime.NewService(*machine, root)
	if *once {
		printHeartbeat(service)
		return
	}

	server := api.New(service, root)
	log.Printf("openshock-daemon listening on %s for %s", *addr, root)
	if err := http.ListenAndServe(*addr, server.Handler()); err != nil {
		log.Fatal(err)
	}
}

func printHeartbeat(service *runtime.Service) {
	body, err := json.Marshal(service.Snapshot())
	if err != nil {
		log.Printf("failed to marshal heartbeat: %v", err)
		return
	}
	log.Println(string(body))
}

func envOr(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

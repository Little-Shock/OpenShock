package main

import (
	"log"
	"net/http"
	"os"

	"openshock/backend/internal/api"
	"openshock/backend/internal/store"
)

func main() {
	addr := os.Getenv("OPENSHOCK_API_ADDR")
	if addr == "" {
		addr = ":8080"
	}

	srv := api.New(store.NewMemoryStore())
	log.Printf("OpenShock backend listening on %s", addr)
	if err := http.ListenAndServe(addr, srv.Handler()); err != nil {
		log.Fatal(err)
	}
}

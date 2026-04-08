package main

import (
	"context"
	"os"

	"openshock/daemon/internal/oshcli"
)

func main() {
	app := oshcli.NewApp()
	os.Exit(app.Run(context.Background(), os.Args[1:], os.Stdout, os.Stderr))
}

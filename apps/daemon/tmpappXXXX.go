package main

import (
  "fmt"
  "openshock/daemon/internal/provider/codexapp"
)

func main() {
  ex, err := codexapp.NewExecutor(codexapp.Options{CodexHome: "/Users/feifantong/.openshock-codex-home"})
  fmt.Printf("executor=%T err=%v\n", ex, err)
  if ex != nil {
    _ = ex.Close()
  }
}

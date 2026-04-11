#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="${ROOT_DIR}/.dev-logs"

WITH_DAEMON=1
SKIP_INSTALL=0
FRONTEND_PORT="${FRONTEND_PORT:-3000}"
OPENSHOCK_API_ADDR="${OPENSHOCK_API_ADDR:-:8080}"
OPENSHOCK_API_BASE_URL="${OPENSHOCK_API_BASE_URL:-http://localhost:8080}"

PIDS=()

usage() {
  cat <<'EOF'
Usage: ./dev.sh [options]

Start the local OpenShockSwarm development stack from the repository root.

Options:
  --with-daemon   Start the daemon in continuous mode. This is now the default.
  --no-daemon     Start only backend and frontend.
  --skip-install  Skip frontend dependency installation when node_modules is missing.
  -h, --help      Show this help message.

Environment:
  FRONTEND_PORT             Frontend dev server port. Default: 3000
  OPENSHOCK_API_ADDR        Backend listen address. Default: :8080
  OPENSHOCK_API_BASE_URL    Frontend/daemon API base URL. Default: http://localhost:8080
  OPENSHOCK_RUNTIME_NAME    Daemon runtime name when --with-daemon is used.
  OPENSHOCK_PROVIDER        Daemon provider when --with-daemon is used.
  OPENSHOCK_CODEX_MODE      Daemon Codex mode: auto, app-server, exec. Default: auto
  OPENSHOCK_CODEX_BIN       Codex binary path when --with-daemon is used.
  OPENSHOCK_CODEX_HOME      Dedicated CODEX_HOME for daemon app-server/exec sessions.
EOF
}

extract_port() {
  local value="$1"
  if [[ "$value" =~ :([0-9]+)$ ]]; then
    echo "${BASH_REMATCH[1]}"
    return 0
  fi
  return 1
}

require_cmd() {
  local cmd="$1"
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "Missing required command: ${cmd}" >&2
    exit 1
  fi
}

ensure_port_free() {
  local port="$1"
  local label="$2"

  if lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; then
    echo "${label} port ${port} is already in use:" >&2
    lsof -nP -iTCP:"$port" -sTCP:LISTEN >&2 || true
    exit 1
  fi
}

start_service() {
  local name="$1"
  local workdir="$2"
  shift 2

  local log_file="${LOG_DIR}/${name}.log"
  echo "[$(date '+%H:%M:%S')] starting ${name}..."
  (
    cd "$workdir"
    exec "$@"
  ) >"$log_file" 2>&1 &
  local pid=$!
  PIDS+=("$pid")
  echo "[$(date '+%H:%M:%S')] ${name} pid=${pid} log=${log_file}"
}

terminate_tree() {
  local pid="$1"
  local child

  while IFS= read -r child; do
    [[ -n "$child" ]] || continue
    terminate_tree "$child"
  done < <(pgrep -P "$pid" 2>/dev/null || true)

  if kill -0 "$pid" >/dev/null 2>&1; then
    kill "$pid" >/dev/null 2>&1 || true
  fi
}

cleanup() {
  local exit_code=$?
  trap - EXIT INT TERM

  if ((${#PIDS[@]} > 0)); then
    echo
    echo "Stopping local development stack..."
    for pid in "${PIDS[@]}"; do
      terminate_tree "$pid"
    done
    sleep 1
    for pid in "${PIDS[@]}"; do
      if kill -0 "$pid" >/dev/null 2>&1; then
        kill -9 "$pid" >/dev/null 2>&1 || true
      fi
    done
    wait "${PIDS[@]}" 2>/dev/null || true
  fi

  exit "$exit_code"
}

parse_args() {
  while (($# > 0)); do
    case "$1" in
      --with-daemon)
        WITH_DAEMON=1
        ;;
      --no-daemon)
        WITH_DAEMON=0
        ;;
      --skip-install)
        SKIP_INSTALL=1
        ;;
      -h|--help)
        usage
        exit 0
        ;;
      *)
        echo "Unknown option: $1" >&2
        echo >&2
        usage >&2
        exit 1
        ;;
    esac
    shift
  done
}

parse_args "$@"

require_cmd go
require_cmd npm
require_cmd pgrep
require_cmd lsof
require_cmd curl

BACKEND_PORT="$(extract_port "$OPENSHOCK_API_ADDR" || true)"
if [[ -z "$BACKEND_PORT" ]]; then
  BACKEND_PORT="$(extract_port "$OPENSHOCK_API_BASE_URL" || true)"
fi

if [[ -n "$BACKEND_PORT" ]]; then
  ensure_port_free "$BACKEND_PORT" "Backend"
fi
ensure_port_free "$FRONTEND_PORT" "Frontend"

mkdir -p "$LOG_DIR"

if [[ ! -d "${ROOT_DIR}/apps/frontend/node_modules" ]]; then
  if [[ "$SKIP_INSTALL" == "1" ]]; then
    echo "apps/frontend/node_modules is missing and --skip-install was provided." >&2
    exit 1
  fi
  echo "Installing frontend dependencies..."
  (
    cd "${ROOT_DIR}/apps/frontend"
    npm install
  )
fi

trap cleanup EXIT INT TERM

export OPENSHOCK_API_ADDR
export OPENSHOCK_API_BASE_URL
export NEXT_PUBLIC_API_BASE_URL="${NEXT_PUBLIC_API_BASE_URL:-$OPENSHOCK_API_BASE_URL}"

start_service "backend" "${ROOT_DIR}/apps/backend" go run ./cmd/server
for _ in {1..40}; do
  if curl -sf "${OPENSHOCK_API_BASE_URL}/health" >/dev/null 2>&1; then
    break
  fi
  sleep 0.25
done
start_service "frontend" "${ROOT_DIR}/apps/frontend" npm run dev -- --port "$FRONTEND_PORT"

if [[ "$WITH_DAEMON" == "1" ]]; then
  start_service "daemon" "${ROOT_DIR}/apps/daemon" go run ./cmd/daemon
fi

echo
echo "Local development stack is starting."
echo "Backend:  ${OPENSHOCK_API_BASE_URL}"
echo "Frontend: http://localhost:${FRONTEND_PORT}"
if [[ "$WITH_DAEMON" == "1" ]]; then
  echo "Daemon:   enabled"
fi
echo
echo "Logs:"
echo "  tail -f ${LOG_DIR}/backend.log"
echo "  tail -f ${LOG_DIR}/frontend.log"
if [[ "$WITH_DAEMON" == "1" ]]; then
  echo "  tail -f ${LOG_DIR}/daemon.log"
fi
echo
echo "Press Ctrl+C to stop all processes."

wait

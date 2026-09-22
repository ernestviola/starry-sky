#!/bin/sh
set -eu

workspace=${SUPERSET_WORKSPACE_NAME:-workspace}
hash=$(printf '%s' "$workspace" | cksum | awk '{print $1}')
api_port=$((5200 + hash % 500))
client_port=$((4200 + hash % 500))

: "${PASSPORT_JS_SECRET:=dev-secret}"
export PASSPORT_JS_SECRET
export PORT="$api_port"
export STARRY_SKY_FRONTEND="http://127.0.0.1:$client_port"

cleanup() {
  trap - EXIT INT TERM
  kill "${client_pid:-}" "${server_pid:-}" 2>/dev/null || true
  pkill -P "${client_pid:-0}" 2>/dev/null || true
  pkill -P "${server_pid:-0}" 2>/dev/null || true
}

(cd server && exec node --watch app.js) &
server_pid=$!
trap cleanup EXIT INT TERM

VITE_STAR_API="http://127.0.0.1:$api_port/" \
  pnpm --dir client dev --host 0.0.0.0 --port "$client_port" &
client_pid=$!
wait "$client_pid"

#!/bin/sh
set -eu

workspace=${SUPERSET_WORKSPACE_NAME:-${SUPERSET_WORKSPACE_ID:-${SUPERSET_WORKSPACE_PATH:-$PWD}}}
hash=$(printf '%s' "$workspace" | cksum | awk '{print $1}')
api_port=$((5200 + hash % 500))
client_port=$((4200 + hash % 500))

env_file=server/.env
if [ ! -f "$env_file" ]; then
  branch=$(git branch --show-current)
  base_branch=$(git config --get "branch.$branch.base" || printf '%s' main)
  base_worktree=$(git worktree list --porcelain | awk -v branch="refs/heads/$base_branch" '
    /^worktree / { path = substr($0, 10) }
    $0 == "branch " branch { print path; exit }
  ')
  env_file="$base_worktree/server/.env"
fi

if [ ! -f "$env_file" ]; then
  printf '%s\n' 'Could not find server/.env in this or its base worktree.' >&2
  exit 1
fi

env_file=$(CDPATH= cd -- "$(dirname "$env_file")" && pwd)/$(basename "$env_file")
export DOTENV_CONFIG_PATH="$env_file"

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

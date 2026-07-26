#!/usr/bin/env bash

set -uo pipefail

if [[ $# -eq 0 ]]; then
  echo "usage: run-android-maestro.sh <flow.yaml> [...]" >&2
  exit 64
fi

adb_bin=${ADB_BIN:-adb}
maestro_bin=${MAESTRO_BIN:-"$HOME/.maestro/bin/maestro"}
diagnostics_dir=${ANDROID_MAESTRO_DIAGNOSTICS_DIR:-.artifacts/android-maestro}
mkdir -p "$diagnostics_dir"

if ! command -v "$adb_bin" >/dev/null 2>&1; then
  echo "adb is unavailable: $adb_bin" >&2
  exit 69
fi
if [[ ! -x "$maestro_bin" ]]; then
  echo "Maestro is unavailable or not executable: $maestro_bin" >&2
  exit 69
fi

sanitize_name() {
  local value
  value=$(basename "$1" .yaml)
  printf '%s' "$value" | tr -c 'A-Za-z0-9._-' '_'
}

capture_diagnostics() {
  local app_id=$1
  local stem=$2
  "$adb_bin" shell dumpsys activity activities >"$diagnostics_dir/$stem-activities.txt" 2>&1 || true
  "$adb_bin" shell dumpsys activity exit-info "$app_id" \
    >"$diagnostics_dir/$stem-exit-info.txt" 2>&1 || true
  "$adb_bin" shell dumpsys meminfo "$app_id" >"$diagnostics_dir/$stem-meminfo.txt" 2>&1 || true
  "$adb_bin" shell pidof "$app_id" >"$diagnostics_dir/$stem-pid.txt" 2>&1 || true
}

run_attempt() {
  local flow=$1
  local stem=$2
  "$adb_bin" logcat -c || true
  "$adb_bin" logcat -v threadtime >"$diagnostics_dir/$stem-logcat.txt" 2>&1 &
  local logcat_pid=$!

  "$maestro_bin" test "$flow"
  local status=$?

  kill "$logcat_pid" >/dev/null 2>&1 || true
  wait "$logcat_pid" >/dev/null 2>&1 || true
  return "$status"
}

overall_status=0
for flow in "$@"; do
  if [[ ! -f "$flow" ]]; then
    echo "Maestro flow does not exist: $flow" >&2
    overall_status=66
    continue
  fi

  app_id=$(awk '$1 == "appId:" { print $2; exit }' "$flow")
  if [[ -z "$app_id" ]]; then
    echo "Maestro flow has no appId: $flow" >&2
    overall_status=65
    continue
  fi

  name=$(sanitize_name "$flow")
  if run_attempt "$flow" "$name-attempt-1"; then
    continue
  fi

  capture_diagnostics "$app_id" "$name-attempt-1"
  pid=$("$adb_bin" shell pidof "$app_id" 2>/dev/null | tr -d '\r[:space:]')
  if [[ -z "$pid" ]]; then
    echo "$flow failed and $app_id has no live process; classified as app process termination." >&2
    overall_status=1
    continue
  fi

  echo "$flow failed while $app_id remained alive (pid $pid); retrying once as runner instability." >&2
  if ! run_attempt "$flow" "$name-attempt-2"; then
    capture_diagnostics "$app_id" "$name-attempt-2"
    echo "$flow failed its single infrastructure retry." >&2
    overall_status=1
  fi
done

exit "$overall_status"

#!/usr/bin/env bash
# boot-emu.sh — boot WRAP-test AVD cleanly on port 5554.
#
# Recovery for the recurring Day 9–12 emulator bug: `expo run:android`
# loses the device handle, leaves orphan qemu-system-aarch64 processes
# on non-standard ports plus stale locks at:
#   ~/.android/avd/WRAP-test.avd/hardware-qemu.ini.lock
#   ~/.android/avd/WRAP-test.avd/multiinstance.lock
#
# Idempotent: safe when nothing needs cleaning. Exits non-zero if the
# emulator fails to reach sys.boot_completed=1 within 120s.

set -euo pipefail

AVD_NAME="WRAP-test"
AVD_DIR="$HOME/.android/avd/${AVD_NAME}.avd"
ANDROID_HOME="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
EMULATOR="${ANDROID_HOME}/emulator/emulator"
ADB="${ANDROID_HOME}/platform-tools/adb"
PORT=5554
SERIAL="emulator-${PORT}"
LOG="/tmp/wrap-emu.log"

echo "→ Killing any orphan qemu-system-aarch64 processes..."
pkill -9 -f "qemu-system-aarch64" >/dev/null 2>&1 || true

echo "→ Sleeping 2s for cleanup..."
sleep 2

echo "→ Deleting stale lock files in ${AVD_DIR}..."
rm -f "${AVD_DIR}/hardware-qemu.ini.lock" \
      "${AVD_DIR}/multiinstance.lock"
# Glob sweep for any other *.lock files (e.g., per-snapshot locks).
shopt -s nullglob
for f in "${AVD_DIR}"/*.lock; do rm -f "$f"; done
shopt -u nullglob

echo "→ Restarting adb..."
"$ADB" kill-server >/dev/null 2>&1 || true
"$ADB" start-server >/dev/null 2>&1

echo "→ Booting ${AVD_NAME} on port ${PORT} (no snapshot, detached)..."
nohup "$EMULATOR" -avd "$AVD_NAME" -port "$PORT" -no-snapshot-load \
  >"$LOG" 2>&1 &
disown

echo "→ Waiting for sys.boot_completed=1 (up to 120s)..."
for i in $(seq 1 60); do
  ready=$("$ADB" -s "$SERIAL" shell getprop sys.boot_completed 2>/dev/null \
           | tr -d '\r' || true)
  if [ "$ready" = "1" ]; then
    echo "✅ Emulator ready (after $((i * 2))s on ${SERIAL})"
    "$ADB" devices
    exit 0
  fi
  sleep 2
done

echo "❌ Emulator did not finish booting within 120s."
echo "   Tail of ${LOG}:"
tail -20 "$LOG" || true
exit 1

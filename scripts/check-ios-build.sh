#!/usr/bin/env bash
# Diagnose xcodebuild error 70 — SDK vs simulator runtime mismatch
set -e

echo "=== Xcode ==="
xcodebuild -version

echo ""
echo "=== Installed SDKs ==="
xcodebuild -showsdks 2>&1 | grep -i ios || true

echo ""
echo "=== Simulator runtimes ==="
xcrun simctl list runtimes 2>&1 | grep -i ios || true

echo ""
echo "=== Available simulators ==="
xcrun simctl list devices available 2>&1 | grep -i iphone | head -8 || true

SDK=$(xcodebuild -showsdks 2>&1 | grep -o 'iphonesimulator[0-9.]*' | head -1 | tr -d 'iphonesimulator' || echo "?")
RUNTIME=$(xcrun simctl list runtimes 2>&1 | grep -o 'iOS [0-9.]*' | head -1 | sed 's/iOS //' || echo "?")

echo ""
if [ "$SDK" != "?" ] && [ "$RUNTIME" != "?" ] && [ "$SDK" != "$RUNTIME" ]; then
  echo "⚠️  Mismatch: Xcode SDK is iOS $SDK but simulators use iOS $RUNTIME"
  echo ""
  echo "Fix:"
  echo "  1. Open Xcode → Settings → Components (or Platforms)"
  echo "  2. Download iOS $SDK (Simulator + device support)"
  echo "  3. Or run:  xcodebuild -downloadPlatform iOS"
  echo "  4. List simulators:  xcrun simctl list devices available"
  echo "  5. Then:             npx expo run:ios -d \"<simulator name from list>\""
  exit 1
fi

echo "✓ SDK and simulator runtime look aligned."
echo "  Run: npx expo run:ios   (or pick a device with -d \"<name>\")"

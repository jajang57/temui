#!/bin/bash

# Detect Architecture
ARCH=$(uname -m)

echo "Detected System Architecture: $ARCH"

if [ "$ARCH" = "arm64" ]; then
    BINARY="./temui-mac-m1"
    echo "Running for Apple Silicon (M1/M2/M3)..."
elif [ "$ARCH" = "x86_64" ]; then
    BINARY="./temui-mac-intel"
    echo "Running for Intel Mac..."
else
    echo "Unknown architecture: $ARCH"
    echo "Please run ./temui-mac-intel or ./temui-mac-m1 manually."
    exit 1
fi

# Check if binary exists
if [ ! -f "$BINARY" ]; then
    echo "Error: Binary $BINARY not found!"
    exit 1
fi

# Fix Permissions automatically
echo "Fixing permissions..."
chmod +x "$BINARY"
xattr -d com.apple.quarantine "$BINARY" 2>/dev/null || true

# Run the app
echo "Starting Application..."
"$BINARY"

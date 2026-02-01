#!/bin/bash

# Get the directory where this script is located (Contents/MacOS)
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# The binary expects config and assets in the current working directory.
# In a .app bundle, let's treat Contents/Resources as the working directory.
cd "$DIR/../Resources"

# Detect Architecture
ARCH=$(uname -m)

if [ "$ARCH" = "arm64" ]; then
    BINARY="$DIR/temui-mac-m1"
    echo "Running for Apple Silicon (M1/M2/M3)..."
elif [ "$ARCH" = "x86_64" ]; then
    BINARY="$DIR/temui-mac-intel"
    echo "Running for Intel Mac..."
else
    echo "Unknown architecture: $ARCH"
    exit 1
fi

# Ensure binary is executable (permissions might be lost during transfer)
chmod +x "$BINARY"

# Remove quarantine attribute if present (prevents "App is damaged" error)
xattr -d com.apple.quarantine "$BINARY" 2>/dev/null || true

# Run the binary
exec "$BINARY"

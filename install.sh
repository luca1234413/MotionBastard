#!/bin/bash
# MotionBastard — One-click installer for macOS

set -e

INSTALL_DIR="/Library/Application Support/Adobe/CEP/extensions/motion-ai-panel"
REPO_URL="https://github.com/BerlinKing/MotionBastard.git"

echo ""
echo "🤬 MotionBastard Installer"
echo "=========================="
echo ""

# 1. Clone or update repo
if [ -d "$INSTALL_DIR" ]; then
    echo "→ Updating existing installation..."
    cd "$INSTALL_DIR"
    git pull origin main
else
    echo "→ Installing to $INSTALL_DIR ..."
    sudo git clone "$REPO_URL" "$INSTALL_DIR"
fi

# 2. Enable unsigned extensions
echo "→ Enabling unsigned CEP extensions..."
defaults write com.adobe.CSXS.12 PlayerDebugMode 1

echo ""
echo "✅ Done! Now:"
echo "   1. Restart After Effects"
echo "   2. Go to Window → Extensions → Motion AI Assistant"
echo "   3. Click ⚙ → Paste your API key → Save"
echo ""
echo "Get an API key at: https://openrouter.ai/settings/keys"
echo ""

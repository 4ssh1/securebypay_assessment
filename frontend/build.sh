#!/usr/bin/env bash
# Exit immediately if any command fails
set -e 

echo "Downloading the Flutter SDK..."
git clone https://github.com/flutter/flutter.git -b stable .flutter-sdk

# Add Flutter to the PATH for this build session
export PATH="$PATH:`pwd`/.flutter-sdk/bin"

echo "Installing dependencies..."
flutter pub get

echo "Building for Web..."
flutter build web

echo "Configuring SPA routing..."
# This generates the routing rule Cloudflare needs
echo "/* /index.html 200" > build/web/_redirects
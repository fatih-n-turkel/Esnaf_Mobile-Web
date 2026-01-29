#!/usr/bin/env bash
set -e
echo "Regenerating platform folders (android/ios/web) using Flutter..."
flutter create . --platforms=android,ios,web
echo "Done."

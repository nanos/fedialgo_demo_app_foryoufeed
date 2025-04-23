#!/usr/bin/env bash
set -e

echo "Linking local fedialgo package..."
pushd ../fedialgo
npm link
npm run build
popd
npm link fedialgo

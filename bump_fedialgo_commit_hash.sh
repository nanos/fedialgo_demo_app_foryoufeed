#!/bin/bash
# Script to bump the commit hash of the fedialgo package.
set -e

pushd ../fedialgo
git push
FEDIALGO_COMMIT_HASH=$(git log -1 --format=%H)
echo "Got FEDIALGO_COMMIT_HASH: $FEDIALGO_COMMIT_HASH"
npm link

popd
npm install github:michelcrypt4d4mus/fedialgo#${FEDIALGO_COMMIT_HASH}
git commit -am "Bump fedialgo commit hash to $FEDIALGO_COMMIT_HASH"
git push

echo "Re-linking local fedialgo package..."
npm link fedialgo

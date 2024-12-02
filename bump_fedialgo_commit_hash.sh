#!/bin/bash
# Script to bump the commit hash of the fedialgo package.
set -e

pushd ../fedialgo
git push
FEDIALGO_COMMIT_HASH=$(git log -1 --format=%H)
echo -e "\n\nGot FEDIALGO_COMMIT_HASH: $FEDIALGO_COMMIT_HASH"
npm link

popd
echo -e "\nRunning 'npm install github:michelcrypt4d4mus/fedialgo#${FEDIALGO_COMMIT_HASH}'..."
npm install github:michelcrypt4d4mus/fedialgo#${FEDIALGO_COMMIT_HASH}
git commit -am "Bump fedialgo commit hash to $FEDIALGO_COMMIT_HASH"
git push

echo -e "\nRe-linking local fedialgo package..."
npm link fedialgo

echo -e "\nDone."

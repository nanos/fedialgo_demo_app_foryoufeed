#!/usr/bin/env bash
set -e

pushd ../fedialgo
npm link
npm run build
popd
npm link fedialgo

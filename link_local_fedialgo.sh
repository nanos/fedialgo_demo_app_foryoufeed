#!/usr/bin/env bash
set -e

pushd ../fedialgo
npm link
popd
npm link fedialgo

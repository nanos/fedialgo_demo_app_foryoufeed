#!/bin/bash
set -e

mv .env .env.development  # Don't want these variables in the build
git checkout github_pages
git merge master
NODE_ENV=production FEDIALGO_DEBUG=false QUICK_MODE=false npx webpack --mode production
git commit -am"Build"
git push origin github_pages
git checkout master
mv .env.development .env

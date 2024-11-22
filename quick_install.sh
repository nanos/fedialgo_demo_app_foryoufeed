#!/bin/bash
set -e

# Simple script to run the setup for the fedialgo demo app.
git clone https://github.com/michelcrypt4d4mus/fedialgo_demo_app_foryoufeed
cd fedialgo_demo_app_foryoufeed
npm install
echo -e "You can ignore warnings above but not errors."
echo -e "\nRun 'npm run start' to start the app server, then point your browser at http://localhost:3000/"

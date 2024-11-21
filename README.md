# Description
This repo is primarily a simple demo application for the [`fedialgo`](https://github.com/pkreissel/fedialgo) package, a customizable algorithm for the federated social media platform [Mastodon](https://joinmastodon.org/) that can free you from the tyranny of Mastodon's reverse chronological order timeline.

* The interesting stuff that actually handles the feed is in the [`Feed.tsx`](src/pages/Feed.tsx) file.
* The bird UI of this app is based on the following repo: https://github.com/ronilaukkarinen/mastodon-bird-ui
* A live installation of this app is currently hosted here: https://foryoufeed.vercel.app

# Installation

### Prerequisites
* [`node.js`](https://nodejs.org/)

### Initial Setup
Run these commands in your preferred terminal application / shell console / whatever:
1. Clone this repo: `git clone https://github.com/pkreissel/foryoufeed`
1. Move into the `foryoufeed` project directory you just cloned: `cd foryoufeed`
1. Install dependencies: `npm install`

### Usage
1. Launch the webserver: `npm run start`
1. Point your web browser at [http://localhost:3000/](http://localhost:3000/)
1. Login to your Mastodon account. If your browser is already logged into a Mastodon server you will be able to authenticate using the existing session.
4. Have fun
5. Profit
6. ???

# Description
This repo is primarily a simple demo application for the [`fedialgo`](https://github.com/michelcrypt4d4mus/fedialgo) package, a customizable algorithm for the federated social media platform [Mastodon](https://joinmastodon.org/) that can free you from the tyranny of Mastodon's reverse chronological order timeline.

Both this repo and the `fedialgo` repo linked above were forked from [pkreissel's original implementation](https://github.com/pkreissel/fedialgo).

# Installation
### Prerequisites
* [`node.js`](https://nodejs.org/):
   * On Linux use `apt`, `yum`, or your favorite package manager. For example here's [guide on how to install `node.js` on Ubuntu linux](https://www.digitalocean.com/community/tutorials/how-to-install-node-js-on-ubuntu-20-04).
   * On macOS you can install `node.js` with [Homebrew](https://brew.sh/) by running `brew install node`.
* `git` (hopefully you have this already but if you're on a recent version of macOS you may need to `brew install git`)

### Quick Start
1. `git clone https://github.com/michelcrypt4d4mus/fedialgo_demo_app_foryoufeed`
1. `cd fedialgo_demo_app_foryoufeed`
1. `npm install`
1. `npm run start`
1. It should automatically change focus to your default browser and prompt you to login to Mastodon but if that doesn't happen you can point your browser at `http://localhost:3000/`.
1. After you've logged in to your Mastodon server (or if you're logged in in that browser) you'll be presented with a request for permissions. Accept them.
1. Wait for the magic. The first time you load the page it can take a while because it has to collect things like  trending posts on various other servers, everything in your feed for the last few days, and your recent Mastodon history (so it can tell which users you interact with the most which is by default an important part of the algorithm)
1. Have fun.
1. Profit.

### Usage
Once the initial load is complete you can adjust the way the algorithm weights various aspects of a toot when it decides what should be at or near the top of your feed. Hopefully these are self explanatory:

![Algorithm Weighting Sliders](./doc/algorithm_sliders.png)

One thing that's kind oa gotcha is the way the `topPosts - Favor posts that are trending in the Fediverse` slider works. Because trending posts often have tons of engagement in the form of replies, favorites, and retoots they can easily drown out the toots from people you are actually following. As a result the impact of this slider gets increasingly drastic _but only if the value is below 1.0_. At 1.0 and above it behaves like all the other weighting sliders.

# Contributing
You can install the local `fedialgo` package with `npm link` (fedialgo dir) / `npm link fedialgo` (this project dir) _or_ with `npm install path/to/fedialgo` but in order to pick up any code changes you will have to run `npm run build` in the `fedialgo` package dir. (TODO: why?)

#### Code Notes
* The interesting stuff that actually handles the feed is in the [`Feed.tsx`](src/pages/Feed.tsx) file.
* The bird UI of this app is based on the following repo: https://github.com/ronilaukkarinen/mastodon-bird-ui
* A live installation of this app is currently hosted here: https://foryoufeed.vercel.app


### TODO
* videos don't show up

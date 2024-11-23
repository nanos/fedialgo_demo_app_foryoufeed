# Description
This repo is primarily a simple demo application for the [`fedialgo`](https://github.com/michelcrypt4d4mus/fedialgo) package, a customizable algorithm for the federated social media platform [Mastodon](https://joinmastodon.org/) that can free you from the tyranny of Mastodon's reverse chronological order timeline.

Both this repo and the `fedialgo` package linked above were forked from [pkreissel's original implementations](https://github.com/pkreissel/fedialgo).

# Installation
### Prerequisites
* [`node.js`](https://nodejs.org/):
   * On Linux use `apt`, `yum`, or your favorite package manager. For example here's [guide on how to install `node.js` on Ubuntu linux](https://www.digitalocean.com/community/tutorials/how-to-install-node-js-on-ubuntu-20-04).
   * On macOS you can install `node.js` with [Homebrew](https://brew.sh/) by running `brew install node`.
* `git`
   * Hopefully you have `git` installed already but if you're on a recent version of macOS you may need to use Homebrew: `brew install git`

### Quick Start
There's [a script](./quick_install.sh) in this repo that will do all the steps for you if you're into that kind of thing, otherwise:

1. `git clone https://github.com/michelcrypt4d4mus/fedialgo_demo_app_foryoufeed`
1. `cd fedialgo_demo_app_foryoufeed`
1. `npm install` (you can ignore the various warnings)
1. `npm run start`
   * It should automatically change focus to your default browser and prompt you to login to Mastodon but if that doesn't happen you can point your browser at [`http://localhost:3000/`](http://localhost:3000/).
1. After you've logged in to your Mastodon server (or if you're logged in in that browser) your browser will request that you give `fedialgo` permission to access your Mastodon account. If you don't accept this app will not work.
1. Wait for the magic. The first time you load the page it can take a while because it has to collect a bunch of federated data: things like trending posts on other servers, toots in your feed for the last few days, and your recent Mastodon history so it can tell which users you interact with the most (which is by default an important part of the algorithm).
1. Have fun.
1. Profit.

# Usage
Once the initial load is complete you can adjust the way the algorithm weights various aspects of a toot when it decides what should be at or near the top of your feed. Hopefully these are self explanatory:

![Algorithm Weighting Sliders](./doc/algorithm_sliders.png)

One thing that's kind of a gotcha is the way the `topPosts - Favor posts that are trending in the Fediverse` slider works. Because trending posts often have tons of engagement in the form of replies, favorites, and retoots they can easily drown out the toots from people you are actually following. As a result the impact of this slider gets increasingly drastic _but only if the value is below 1.0_. At 1.0 and above it behaves like all the other weighting sliders.

### Shutdown
`Ctrl-C` in the terminal window you launched the `node.js` server will kill the server.

### Troubleshooting
* You may need to reload the webpage after updating the user weightings.
* Sometimes (often?) when starting the server up again after the first time you will find your Mastodon login has expired in which case the browser will probably present you with some very large, very red error message along the lines of `Uncaught runtime errors!` or similar. If you just ignore / close the error popup you should be presented with the option to relogin.
* Sometimes the infinite scroll kind of gets stuck if you're working with a cache of Mastodon data. Most browsers will you all to clear all the "site data" (cookies and cache) for a single site. [How to do that in Chrome](https://support.google.com/chrome/thread/16531954/clear-cache-for-specific-website-in-google-chrome?hl=en). Note that loading the `fedialgo` demo app will take some a while the first time you point your browser at it after clearing your browser's cache.
* Infinite scrolls isn't _really_ infinite (yet). If you scroll far enough you will run out of toots to peruse.

# Contributing
You can install the local `fedialgo` package by running `npm link`  in the `fedialgo` project dir and then`npm link fedialgo` in this project's dir _or_ you can do that kind of thing manually by running `npm install path/to/local/fedialgo` in this repo's dir but either way in order to pick up any code changes from `fedialgo` you will have to run `npm run build` in the `fedialgo` package dir. (TODO: why?)

#### Code Notes
* There's tons of info on how the scoring and weighting of toots is being done in your browser's javascript debug console logs.
* The interesting stuff that actually handles the feed is in the [`Feed.tsx`](src/pages/Feed.tsx) file.
* The bird UI of this app is based on the following repo: https://github.com/ronilaukkarinen/mastodon-bird-ui
* A live installation of this app is currently hosted here: https://foryoufeed.vercel.app


# TODO
* videos don't show up

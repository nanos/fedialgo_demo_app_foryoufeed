#!/usr/bin/env bash -l
set -e


assert_repo_is_ready() {
    git_check_master_branch

    if [[ ! any_uncommitted_changes ]]; then
        echo "There are uncommitted changes. Please commit or stash them before running this script."
        exit 1
    fi
}


# Set vars
MASTER_BRANCH="master"
VERSION_NUMBER=`git_get_tag_version`
assert_repo_is_ready  # Check this dir is clean before we start tagging etc

# Handle fedialgo dir
pushd ../fedialgo
assert_repo_is_ready
update_changelog "$VERSION_NUMBER"
git commit -am"Bump last CHANGELOG.md version to $VERSION_NUMBER"
git push origin "$MASTER_BRANCH"
git tag "$VERSION_NUMBER"
git push origin "$VERSION_NUMBER"

# Handle demo app dir (this dir)
popd
./bump_fedialgo_commit_hash.sh   # This will execute a commit
git push origin "$MASTER_BRANCH"
git tag "$VERSION_NUMBER"
git push origin "$VERSION_NUMBER"

#!/usr/bin/env bash -l
set -e


assert_repo_is_ready() {
    git_check_master_branch

    if [[ ! any_uncommitted_changes ]]; then
        echo "There are uncommitted changes. Please commit or stash them before running this script."
        exit 1
    fi
}


tag_repo() {
    local version_number="$1"
    local repo_dir=`basename $PWD`

    if [[ "$version_number" != v* ]]; then
        version_number="v$version_number"
    fi

    echo "Tagging repo $repo_dir with version: $version_number"
    git push origin "$MASTER_BRANCH"
    git tag "$version_number"
    git push origin "$version_number"
}


# Set vars
assert_repo_is_ready
MASTER_BRANCH="master"
VERSION_NUMBER=`git_get_tag_version`

# Handle fedialgo dir
pushd ../fedialgo
assert_repo_is_ready
update_changelog "$VERSION_NUMBER"
git commit -am"Bump last CHANGELOG.md version to $VERSION_NUMBER"
tag_repo "$VERSION_NUMBER"

# Handle demo app dir (this dir)
popd
./bump_fedialgo_commit_hash.sh   # This will execute a commit
tag_repo "$VERSION_NUMBER"

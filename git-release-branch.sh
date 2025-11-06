#!/bin/bash

current_branch=$(git symbolic-ref --short HEAD)

if [[ $current_branch != "develop" && ! $current_branch =~ ^release/[0-9]+\.[0-9]+\.[0-9]+(-rc)?$ ]]; then
  echo "The current Git branch ($current_branch) is not 'develop' or in the format 'release/X.Y.Z' or 'release/X.Y.Z-rc'."
  exit 1
fi

# Check if the parameter is provided
read -p "Mindbox Expo plugin version: " version

# Check if the version number matches the semver format
if ! [[ $version =~ ^[0-9]+\.[0-9]+\.[0-9]+(-rc)?$ ]]; then
  echo "The release version number does not match the semver format (X.Y.Z or X.Y.Z-rc)."
  exit 1
fi


branch_name="release/$version"
git branch $branch_name
git checkout $branch_name

echo "Branch $branch_name has been created."

package_json="package.json"
current_version=$(grep -Eo '"target-version": "[^"]+"' $package_json | cut -d '"' -f 4)
sed -i '' "s/\"target-version\": \".*\"/\"target-version\": \"$version\"/" $package_json

echo "Bump SDK version from $current_version to $version."

git add $package_json

changelog="CHANGELOG.md"

awk -v ver="$version" 'NR==3{print "## [Unreleased]\n\n ### Changes\n - Change: Bump mindbox plugin to version " ver "\n"}1' "$changelog" > "${changelog}.tmp" && mv "${changelog}.tmp" "$changelog"

echo "Insert Unreleased section to $changelog"

git add "$changelog"

echo "Branch $branch_name has been created."

git commit -m "Bump plugin version to $version" --no-verify

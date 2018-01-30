#!/usr/bin/env bash

repo=${1}
key=${2}

echo "set ${key} version to $TRAVIS_COMMIT"
echo "lpgui: $TRAVIS_COMMIT"

cat >> ~/.ssh/config << EOF
Host	github.com
	Hostname        github.com
	IdentityFile    "$TRAVIS_BUILD_DIR/github"
	IdentitiesOnly	yes
EOF

cat ~/.ssh/config
chmod 600 github
git clone git@github.com:Civil-Service-Human-Resources/${repo}.git
cd lpg-ansible-mvp-services
git checkout test
echo "lpgui: $TRAVIS_COMMIT" > group_vars/all/services
git commit -am "set ${key} version to $TRAVIS_COMMIT"
git push
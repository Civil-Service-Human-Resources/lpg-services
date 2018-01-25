#!/usr/bin/env bash

repo=${1}
key=${2}

cat > ~/.ssh/config << EOF
Host	github.com
	Hostname        github.com
	IdentityFile    "github"
	IdentitiesOnly	yes
EOF

chmod 600 github
ls -la
git clone git@github.com:Civil-Service-Human-Resources/${repo}.git
ls -la
cd lpg-ansible-mvp-services
ls -la
git checkout test
echo "lpgui: $TRAVIS_COMMIT" > group_vars/all/services
git commit -am "set ${key} version to $TRAVIS_COMMIT"
git push
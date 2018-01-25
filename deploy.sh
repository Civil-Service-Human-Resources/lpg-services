#!/usr/bin/env bash

repo=${1}
key=${2}

cat > ~.ssh/config << EOF
Host	github.com
	Hostname        github.com
	IdentityFile    "github"
	IdentitiesOnly	yes
EOF

git clone git@github.com:Civil-Service-Human-Resources/${repo}.git
cd lpg-ansible-mvp-services
git checkout test
git merge master
echo "lpgui: $TRAVIS_COMMIT" > group_vars/all/services
git commit -am "set ${key} version to $TRAVIS_COMMIT"
git push
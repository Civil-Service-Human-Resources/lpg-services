#!/usr/bin/env bash

SERVICE=${1}

#clone ansible repository
git clone https://github.com/Civil-Service-Human-Resources/lpg-ansible-mvp.git
cd lpg-ansible-mvp

#set application version, this is the version that will be deployed
echo "$SERVICE: $TRAVIS_COMMIT" > group_vars/all/${SERVICE} || exit 2

#run ansible
sudo pip install ansible || exit 2
echo $mvp_test | base64 -d | ./envVar.py > mvp_test && chmod 600 mvp_test
echo $vaultpassword | base64 -d | ./envVar.py > vault.yml
ansible-playbook site.yml -i environments/test -t ${SERVICE} || exit 2
echo "---------- $TRAVIS_COMMIT : deployed to  test ----------"
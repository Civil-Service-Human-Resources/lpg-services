#!/usr/bin/env bash

PREFIX=lpg-
ORGANISATION="cshr"

function pull {
    SERVICE=$1
    echo "Pulling ${ORGANISATION}/${PREFIX}${SERVICE}"
    docker pull ${ORGANISATION}/${PREFIX}${SERVICE} || true
}

function install {
    SERVICE=$1
    echo "Installing ${SERVICE}"
    pushd service/${SERVICE}
    npm install
    popd
}

function build {
    SERVICE=$1
    TAG=$2
    echo "Building ${ORGANISATION}/${PREFIX}${SERVICE}"

    pushd service/${SERVICE}
    npm run clean
    npm run sass
    npm run build
    popd

    docker build -t ${ORGANISATION}/${PREFIX}${SERVICE}:${TAG} -f service/${SERVICE}/Dockerfile .
}

function push {
    SERVICE=$1
    echo "Pushing ${ORGANISATION}/${PREFIX}${SERVICE}"
    docker push ${ORGANISATION}/${PREFIX}${SERVICE}
}

if [ "$1" = "install" ]; then
    npm install
fi

for service in service/*
do
    service=${service##*/}
    echo "Checking ${service}"

    if [ "$1" = "install" ]; then
        install ${service}
    elif [ -f service/${service}/Dockerfile ]; then
        if [ "$1" = "pull" ]; then
            pull ${service}
        elif [ "$1" = "build" ]; then
            build ${service} ${2}
        elif [ "$1" = "push" ]; then
            push ${service}
        else
            echo "Unknown command ${1}"
        fi
    fi
done

echo "Done"

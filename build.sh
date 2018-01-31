#!/usr/bin/env bash

PREFIX=lpg-
ORGANISATION="cshr"

function pull {
    IMAGE=$1
    echo "Pulling ${ORGANISATION}/${PREFIX}${IMAGE}"
    docker pull ${ORGANISATION}/${PREFIX}${IMAGE} || true
}

function install {
    SERVICE=$1
    echo "Installing ${SERVICE}"
    pushd service/${SERVICE}
    npm install
    popd
}

function build {
    IMAGE=$1
    TAG=$2
    echo "Building ${ORGANISATION}/${PREFIX}${IMAGE}"
    npm run clean
    npm run sass
    npm run build
    docker build -t ${ORGANISATION}/${PREFIX}${IMAGE}}:${TAG} -f service/${IMAGE}/Dockerfile .
}

function push {
    IMAGE=$1
    echo "Pushing ${ORGANISATION}/${PREFIX}${IMAGE}"
    docker push ${ORGANISATION}/${PREFIX}${IMAGE}
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

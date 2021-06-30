FROM node:16.3.0-slim as dependencies

WORKDIR /var/www/app

COPY . .

RUN npm install
RUN npm run build

EXPOSE 3001

ARG VERSION=dev
RUN echo ${VERSION} > ./VERSION.txt

# This needs to be specified after the `npm install`
ENV NODE_ICU_DATA=/var/www/app/node_modules/full-icu
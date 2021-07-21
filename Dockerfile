FROM node:16.3.0-slim as setup

WORKDIR /var/www/app
COPY . .
RUN npm install

FROM setup as build

RUN npm run build

FROM node:16.3.0-slim as prod

WORKDIR /var/www/app

COPY --from=build /var/www/app/dist ./
COPY --from=build /var/www/app/package* ./

EXPOSE 3001

# This needs to be specified after the `npm install`
ENV NODE_ICU_DATA=/var/www/app/node_modules/full-icu
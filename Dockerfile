FROM node:16.3.0-slim as dependencies

WORKDIR /var/www/app

COPY . .

FROM dependencies as build

RUN npm install
RUN npm run build

FROM build as final

EXPOSE 3001

COPY --from=build /var/www/app/node_modules /node_modules
COPY --from=build /var/www/app/dist /dist
COPY --from=build /var/www/app/src /src

ARG VERSION=dev
RUN echo ${VERSION} > ./VERSION.txt

# This needs to be specified after the `npm install`
ENV NODE_ICU_DATA=/var/www/app/node_modules/full-icu
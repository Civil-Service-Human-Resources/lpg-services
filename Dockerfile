FROM node:10.22.0-slim

EXPOSE 3001

# Copy app files
RUN mkdir -p /var/www/app
WORKDIR /var/www/app

COPY package.json package.json
COPY bin/setup-dist bin/setup-dist
COPY src src

# Runtime environment variables
ENV AUTHENTICATION_SERVICE_URL=http://identity.local.learn.civilservice.gov.uk:9443 \
  CONTENT_CONTAINER=lpgdevcontent \
  CONTENT_URL=http://cdn.local.learn.civilservice.gov.uk/lpgdevcontent \
  LEARNER_RECORD_URL=http://localhost:9000 \
  LEARNER_RECORD_USER=user \
  LEARNER_RECORD_PASS=password \
  LPG_UI_SERVER=http://local.learn.civilservice.gov.uk \
  NODE_ENV=production \
  PORT=3001 \
  SESSION_SECRET=topsecret

RUN npm install

ARG VERSION=dev
RUN echo ${VERSION} > ./VERSION.txt

COPY dist dist

# This needs to be specified after the `npm install`
ENV NODE_ICU_DATA=/var/www/app/node_modules/full-icu

ADD https://github.com/Civil-Service-Human-Resources/lpg-terraform-paas/releases/download/hammer-0.1/hammer /bin/hammer
RUN chmod +x /bin/hammer && echo "Hammer v0.1 Added"

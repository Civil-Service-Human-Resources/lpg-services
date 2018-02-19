FROM library/ubuntu

EXPOSE 3001

RUN apt-get update && \
  apt-get install --yes wget ssh sshpass g++ make && \
  apt-get clean && \
  rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

RUN wget -qO- https://raw.githubusercontent.com/creationix/nvm/v0.29.0/install.sh | bash

# Copy app files
RUN mkdir -p /var/www/app
WORKDIR /var/www/app

ENV NVM_DIR /root/.nvm
ENV NODE_VERSION 9.4.0
ENV NODE_PATH $NVM_DIR/versions/node/v$NODE_VERSION/lib/node_modules
ENV PATH $NVM_DIR/versions/node/v$NODE_VERSION/bin:$PATH

RUN . $NVM_DIR/nvm.sh \
  && nvm install $NODE_VERSION \
  && nvm alias default $NODE_VERSION \
  && nvm use default

COPY package.json package.json
COPY bin/setup-dist bin/setup-dist
COPY src src

# TODO(tav): Create an actual user so that we don't run this as root
RUN npm install --unsafe-perm

COPY dist dist

# Runtime environment variables. Most osf these should be overridden by the env
# variables passed in by the ops setup.
ENV AUTHENTICATION_SERVICE_URL=https://identity.dev.cshr.digital \
  ENV_PROFILE=dev \
  LEARNER_RECORD_SERVICE_URL=http://localhost:9000 \
  LPG_UI_SERVER=lpg.dev.cshr.digital \
  NODE_ENV=production \
  NODE_ICU_DATA=/var/www/app/node_modules/full-icu \
  PORT=3001 \
  SESSION_SECRET=topsecret

CMD [ "bash", "-c", "cd dist/ui && node ../node_modules/ui/server.js" ]

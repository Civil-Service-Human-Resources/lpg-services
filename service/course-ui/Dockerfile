FROM library/ubuntu

ENV NODE_ENV production
ENV SESSION_SECRET topsecret
ENV AUTHENTICATION_SERVICE_URL https://identity.dev.cshr.digital:9443

ENV XAPI_URL http://localhost:8081/data/xAPI
ENV XAPI_USER user
ENV XAPI_PASS pass

EXPOSE 3002

CMD [ "node", "dist/server.js" ]

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

COPY service/course-ui/package.json package.json
RUN npm install --unsafe-perm

COPY service/course-ui .

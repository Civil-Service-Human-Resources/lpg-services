FROM node@sha256:30f98963fd361b0241db107e68da88a1ebed0561e3ecc7bf221586901863e4b1

RUN apt-get update && apt-get install -y git apt-transport-https && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/* && \
    git config --global advice.detachedHead false

RUN git clone --branch v2.1.3 --depth 1 https://github.com/LearningLocker/learninglocker.git /opt/learning-locker

# NOTE: We use `npm` here instead of `yarn` because yarn enforces engine version
# requirements and dependencies have mismatching requirements.
RUN cd /opt/learning-locker && \
    touch .env && \
    npm install && \
    npm run build-api-server && \
    npm run build-cli-server && \
    npm run build-worker-server && \
    npm run build-ui-server && \
    npm run build-ui-client

RUN git clone --branch v2.1.4 --depth 1 https://github.com/LearningLocker/xapi-service /opt/xapi-service

RUN cd /opt/xapi-service && \
    touch .env && \
    npm install && \
    npm run build

COPY mkadmin.js /opt/learning-locker/

ENV API_HOST=learning-locker-api-server \
    API_PORT=8082 \
    APP_SECRET=51e6383e666c54f02ed1502df191e06a3cb53bdde94b2c7b580aa077bcf81c2f \
    EXPRESS_PORT=8083 \
    LOG_MIN_LEVEL=info \
    MONGO_URL=mongodb://mongodb:27017/learninglocker \
    MONGODB_PATH=mongodb://mongodb:27017/learninglocker \
    NODE_ENV=production \
    QUEUE_NAMESPACE=learninglocker \
    QUEUE_PROVIDER=REDIS \
    REDIS_DB=0 \
    REDIS_HOST=redis \
    REDIS_PORT=6379 \
    REDIS_PREFIX=learninglocker \
    REDIS_URL=redis://redis:6379/0 \
    SITE_URL=http://localhost:3000 \
    SMTP_HOST=mailhog \
    SMTP_PASS= \
    SMTP_PORT=1025 \
    SMTP_SECURED=false \
    SMTP_USER= \
    STORAGE_REPO=local \
    UI_HOST=learning-locker-ui \
    UI_PORT=3000

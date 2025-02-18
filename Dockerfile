FROM node:20.18.0-slim

WORKDIR /var/www/app

COPY node_modules ./node_modules
COPY dist ./dist

# Assets

## Locale
COPY locale ./locale

## Page
COPY views/component ./views/component
COPY views/page ./views/page
COPY views/nunjucks ./views/nunjucks

## Public assets
COPY views/assets/styles/main.css ./views/assets/styles/main.css
COPY views/assets/styles/video-js.min.css ./views/assets/styles/video-js.min.css
COPY views/assets/js/main-bundle.min.js ./views/assets/js/main-bundle.min.js
COPY views/assets/fonts ./views/assets/fonts
COPY views/assets/img ./views/assets/img

EXPOSE 3001

CMD ["node", "dist/server.js"]

FROM node:24.18-bookworm-slim AS app-build
ARG VUE_APP_BACKEND_URL
ARG VUE_APP_BRANDING_TITLE
ARG VUE_APP_BUILD_COMMIT
WORKDIR /build
# Copy only what is necessary for installing npm packages, to improve caching.
COPY package.json package-lock.json .npmrc ./
COPY app/package.json app/package.json
RUN npm ci
COPY app app
# Setting the timestamp like this (instead of passing it through ARG) will avoid
# rebuilds when only the timestamp has changed.
RUN VUE_APP_BUILD_TIMESTAMP=$(date +%s) npm run build -w andeo-lunch-app

FROM nginx:1.30
WORKDIR /srv/andeo-lunch/app
COPY --from=app-build /build/app/dist /srv/andeo-lunch/app
RUN rm /etc/nginx/conf.d/default.conf
COPY docker/andeolunch.conf /etc/nginx/conf.d/andeolunch.conf

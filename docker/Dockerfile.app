FROM node:24.13-bookworm-slim AS app-build
ARG VUE_APP_BACKEND_URL
ARG VUE_APP_BRANDING_TITLE
ARG VUE_APP_BUILD_COMMIT
WORKDIR /build
# Copy only what is necessary for installing Yarn packages, to improve caching.
COPY package.json yarn.lock .yarnrc.yml ./
COPY app/package.json app/package.json
COPY .yarn .yarn
RUN yarn workspaces focus andeo-lunch-app
COPY app app
# Setting the timestamp like this (instead of passing it through ARG) will avoid
# rebuilds when only the timestamp has changed.
RUN VUE_APP_BUILD_TIMESTAMP=$(date +%s) yarn workspace andeo-lunch-app build

FROM nginx:1.28
WORKDIR /srv/andeo-lunch/app
COPY --from=app-build /build/app/dist /srv/andeo-lunch/app
RUN rm /etc/nginx/conf.d/default.conf
COPY docker/andeolunch.conf /etc/nginx/conf.d/andeolunch.conf

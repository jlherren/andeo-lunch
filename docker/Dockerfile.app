FROM node:18.15-bullseye-slim AS app-build
ARG VUE_APP_BACKEND_URL
ARG VUE_APP_BRANDING_TITLE
ARG VUE_APP_BUILD_TIMESTAMP
WORKDIR /build
# Copy only what is necessary for installing Yarn packages, to improve caching.
COPY package.json yarn.lock .yarnrc.yml ./
COPY app/package.json app/package.json
COPY .yarn/releases .yarn/releases
COPY .yarn/plugins .yarn/plugins
RUN yarn workspaces focus andeo-lunch-app
COPY app app
RUN yarn workspace andeo-lunch-app build

FROM nginx:1.23
WORKDIR /srv/andeo-lunch/app
COPY --from=app-build /build/app/dist /srv/andeo-lunch/app
COPY docker/nginx.conf /etc/nginx/nginx.conf

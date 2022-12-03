# Cannot build on node 17+, due to the switch to OpenSSL 3, which removes some algorithms.
FROM node:16.18-bullseye-slim AS app-build
ARG VUE_APP_BACKEND_URL
ARG VUE_APP_BRANDING_TITLE
WORKDIR /build
COPY . .
RUN yarn workspaces focus andeo-lunch-app
RUN yarn workspace andeo-lunch-app build

FROM nginx:1.23
RUN mkdir -p /srv/andeo-lunch
WORKDIR /srv/andeo-lunch/app
COPY --from=app-build /build/app/dist /srv/andeo-lunch/app
COPY docker/nginx.conf /etc/nginx/nginx.conf

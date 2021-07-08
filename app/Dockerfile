FROM node:14-buster-slim as app-build
ARG VUE_APP_BACKEND_URL
ARG VUE_APP_BRANDING_TITLE
WORKDIR /build
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY . .
RUN yarn build

FROM nginx:1.20 AS app
RUN mkdir -p /srv/andeo-lunch
COPY --from=app-build /build/dist /srv/andeo-lunch/app
COPY nginx.conf /etc/nginx/nginx.conf

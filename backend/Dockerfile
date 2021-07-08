FROM node:14-buster-slim AS backend
RUN mkdir -p /srv/andeo-lunch/backend
WORKDIR /srv/andeo-lunch/backend
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production=true
COPY . .
RUN mv config-docker.json config.json
EXPOSE 3000
CMD ["yarn", "serve"]

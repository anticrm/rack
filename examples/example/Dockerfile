FROM node as builder
WORKDIR /app
COPY package.json yarn.lock ./
COPY dist ./dist
RUN yarn install --prod
FROM alpine
COPY --from=astefanutti/scratch-node /bin/node /bin/node
COPY --from=builder /app /app
ENTRYPOINT ["/bin/sh"]

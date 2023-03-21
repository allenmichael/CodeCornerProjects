FROM --platform=linux/amd64 public.ecr.aws/docker/library/node:18 AS build

WORKDIR /srv
RUN chown -R node:node /srv
ADD package.json .
ADD tsconfig.json .
ADD src /srv/src
RUN npm install
RUN npm run build

FROM --platform=linux/amd64 public.ecr.aws/docker/library/node:18-slim
COPY --from=build /srv/dist ./dist
COPY --from=build /srv/package.json .
COPY --from=build /srv/node_modules ./node_modules
USER node
EXPOSE 3000

CMD [ "npm", "run", "start" ]
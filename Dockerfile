FROM node:22-alpine AS build

WORKDIR /app

COPY package.json /app/

RUN npm install --omit=dev

COPY . .

FROM node:22-alpine AS production

WORKDIR /app

COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/package.json /app/package.json
COPY --from=build /app/src /app/src 

EXPOSE 7554

CMD ["npm", "start"]


FROM node:18-alpine as build

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install

COPY . .

RUN npm run build

FROM node:18-alpine

RUN npm install -g http-server

WORKDIR /app

COPY --from=build /app/dist ./dist

EXPOSE 5173

CMD ["http-server", "dist", "-p", "5173"]

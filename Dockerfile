FROM node:16.15.1

ENV PORT=3001

WORKDIR /app

COPY ["package.json", "package-lock.json*", "./"]

RUN npm install

COPY . .

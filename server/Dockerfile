FROM node:18-alpine
ENV PORT="8000"

WORKDIR /app
COPY package.json package-lock.json /app/
RUN npm install
COPY . /app
RUN npx tsc
CMD node ./bin/www.js

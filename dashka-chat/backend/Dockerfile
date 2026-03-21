FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

RUN mkdir -p uploads cache logs temp tmp

EXPOSE 8080

CMD ["node", "src/server.js"]
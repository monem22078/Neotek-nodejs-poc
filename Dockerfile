FROM node:lts-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . /app

RUN chmod -R 775 /app/

EXPOSE 3000

CMD ["node", "index.js"]

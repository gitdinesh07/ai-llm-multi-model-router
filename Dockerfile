FROM node:22-alpine

WORKDIR /app

COPY package.json package.json
COPY tsconfig.json tsconfig.json
COPY prisma prisma
COPY src src

RUN npm install
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start"]

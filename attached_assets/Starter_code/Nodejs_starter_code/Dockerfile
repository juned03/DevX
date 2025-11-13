FROM node:20-alpine
WORKDIR /app
COPY package.json ./
RUN npm ci || npm install
COPY prisma ./prisma
COPY src ./src
ENV NODE_ENV=production
EXPOSE 4000
CMD ["sh", "-c", "npx prisma generate && npx prisma migrate deploy && node src/server.js"]



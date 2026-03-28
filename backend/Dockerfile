FROM node:20-slim
WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY prisma ./prisma
RUN npx prisma generate

COPY dist ./dist

EXPOSE 3002
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]

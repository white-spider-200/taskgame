# Simple, single-stage Dockerfile mirroring the existing PM2 deploy flow
# (npm ci -> prisma generate -> next build -> next start), just containerized.
FROM node:20-alpine

WORKDIR /app

# Install deps first for better layer caching
COPY package.json package-lock.json ./
RUN npm ci

# Copy the rest of the app and build
COPY . .
RUN npx prisma generate
RUN npm run build

ENV NODE_ENV=production
ENV PORT=3012
EXPOSE 3012

# Apply pending migrations, then start the server.
# DATABASE_URL should point at a path inside a mounted volume so the
# SQLite file survives redeploys (see Dokploy volume setup).
CMD ["sh", "-c", "npx prisma migrate deploy && npm run start"]

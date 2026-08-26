# Production Dockerfile for NPC Tracker (Node.js 22)
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy codebase
COPY . .

# Build Vite React SPA & Express backend
RUN npm run build

# Runtime Stage
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV DB_PATH=/app/data/tracker.sqlite

# Copy build artifacts
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Create persistent storage folder for SQLite
RUN mkdir -p /app/data

# Volume mount point for persistent SQLite DB
VOLUME /app/data

EXPOSE 3000

CMD ["node", "dist/server.cjs"]

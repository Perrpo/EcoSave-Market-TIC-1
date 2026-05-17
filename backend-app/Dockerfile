# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN node ace build

# Stage 2: Run
FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/build ./
RUN npm ci --omit=dev
EXPOSE 3333
CMD ["node", "bin/server.js"]

# --- Build Stage ---
FROM node:22-alpine AS build
LABEL authors="bouchla-varna"

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

# --- Production Stage ---
FROM node:22-alpine AS production

WORKDIR /app

COPY --from=build /app/dist ./dist
COPY --from=0 /app/node_modules ./node_modules
COPY --from=0 /app/package*.json ./

CMD ["node", "dist/main.js"]
# Stage 1: Сборка приложения
FROM node:18-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install --no-optional
COPY . .
RUN npm run build

# Stage 2: Запуск через Nginx
FROM nginx:stable-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

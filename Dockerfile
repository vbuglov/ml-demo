# Stage 1: Сборка приложения
FROM node:18-slim AS builder
WORKDIR /app
COPY package*.json ./
# Удаляем package-lock.json, если он существует, и устанавливаем зависимости
RUN rm -f package-lock.json && npm install --no-optional
COPY . .
RUN npm run build

# Stage 2: Запуск через Nginx
FROM nginx:stable-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

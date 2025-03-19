# Stage 1: Сборка приложения
FROM node:20-slim AS builder
WORKDIR /app
# Копируем файлы зависимостей
COPY package*.json ./
# Удаляем package-lock.json, чтобы избежать проблем с опциональными зависимостями,
# и устанавливаем зависимости без опциональных пакетов
RUN rm -f package-lock.json && npm install --no-optional
# Копируем весь исходный код
COPY . .
# Собираем приложение (по умолчанию Vite кладёт сборку в папку dist)
RUN npm run build

# Stage 2: Запуск через Nginx
FROM nginx:stable-alpine
# Копируем собранные файлы в директорию, которую обслуживает Nginx
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

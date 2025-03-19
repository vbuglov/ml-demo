# Stage 1: Сборка приложения
FROM node:18-alpine AS builder
WORKDIR /app
# Копируем файлы зависимостей
COPY package*.json ./
# Если используете yarn, раскомментируйте следующую строку и закомментируйте npm install
# COPY yarn.lock ./
RUN npm install
# Копируем все файлы проекта
COPY . .
# Собираем проект (по умолчанию Vite кладёт сборку в папку dist)
RUN npm run build

# Stage 2: Запуск через Nginx
FROM nginx:stable-alpine
# Копируем собранные файлы в папку, которую обслуживает Nginx
COPY --from=builder /app/dist /usr/share/nginx/html
# Если нужно, можно добавить свой конфиг nginx (по умолчанию порт 80)
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

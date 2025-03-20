# Stage 1: Сборка приложения
FROM node:20 AS builder

WORKDIR /app

# Копируем package.json и package-lock.json (если есть)
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем исходный код приложения
COPY . .

# Собираем проект (убедитесь, что в package.json определён скрипт "build", например "vite build")
RUN npm run build

# Stage 2: Обслуживание с помощью nginx
FROM nginx:alpine

# Удаляем дефолтный конфиг nginx
RUN rm /etc/nginx/conf.d/default.conf

# Копируем собранные файлы из builder-стадии в стандартную директорию nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Копируем кастомный конфигурационный файл nginx, который настраивает сервер на порт 5000
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Открываем порт 5000
EXPOSE 5000

CMD ["nginx", "-g", "daemon off;"]

# 1. Используем официальный образ Node.js версии 20 для сборки
FROM node:20 AS build

# 2. Создаем рабочую директорию
WORKDIR /app

# 3. Копируем package.json и package-lock.json (если есть) в контейнер
COPY package*.json ./

# 4. Устанавливаем зависимости
RUN npm install

# 5. Копируем остальной исходный код в контейнер
COPY . .

# 6. Создаем сборку
RUN npm run build

# 7. Переключаемся на продакшн-слой
FROM nginx:stable-alpine
# Копируем собранные файлы в директорию, которую обслуживает Nginx
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 5000
CMD ["nginx", "-g", "daemon off;"]
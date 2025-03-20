# --- ЭТАП 1: СБОРКА ПРИЛОЖЕНИЯ ---
FROM node:20 AS build

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json и package-lock.json (если есть)
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем оставшиеся файлы проекта
COPY . .

# Сборка проекта
RUN npm run build

# --- ЭТАП 2: СЕРВИС НА NGINX ---
FROM nginx:stable

# Копируем свой конфиг Nginx (с настройкой на порт 5000)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Копируем собранное приложение из этапа сборки
COPY --from=build /app/dist /usr/share/nginx/html

# Открываем порт 5000
EXPOSE 5000

# Запускаем Nginx
CMD ["nginx", "-g", "daemon off;"]

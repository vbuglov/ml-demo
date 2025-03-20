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
FROM node:20 AS serve

# 8. Устанавливаем небольшую утилиту для сервировки статических файлов
RUN npm install -g serve

# 9. Копируем директорию dist из этапа build
COPY --from=build /app/dist /app/dist

# 10. Открываем порт 5000
EXPOSE 5000

# 11. Запускаем наше React-приложение на порту 5000
CMD ["serve", "-s", "dist", "-l", "5000"]

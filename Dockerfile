FROM node:20 AS build
WORKDIR /app

COPY package*.json ./
COPY yarn.lock ./

RUN yarn

COPY . .

RUN yarn build

FROM node:20 AS serve

# 8. Устанавливаем небольшую утилиту для сервировки статических файлов
RUN npm install -g serve

# 9. Копируем директорию dist из этапа build
COPY --from=build /app/dist /app/dist

# 10. Открываем порт 5000
EXPOSE 5000

# 11. Запускаем наше React-приложение на порту 5000
CMD ["serve", "-s", "dist", "-l", "5000"]
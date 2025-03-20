FROM node:20 AS build
WORKDIR /app

COPY package*.json ./
COPY yarn.lock ./

RUN yarn

COPY . .

RUN yarn build

# ---- Этап запуска (serve) на Nginx ----
FROM nginx:stable-alpine

RUN mkdir /etc/nginx/certs

COPY nginx.crt /etc/nginx/certs/nginx.crt
COPY nginx.key /etc/nginx/certs/nginx.key

# Удаляем дефолтный конфиг, чтобы использовать свой
RUN rm /etc/nginx/conf.d/default.conf

# Копируем свой конфиг, который слушает порт 5000
COPY default.conf /etc/nginx/conf.d/default.conf

# Копируем собранные файлы из build-этапа
COPY --from=build /app/dist /usr/share/nginx/html

# Открываем в контейнере 5000-й порт
EXPOSE 5000

# Запускаем Nginx в форёground-режиме
CMD ["nginx", "-g", "daemon off;"]
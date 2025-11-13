# --- Build stage ---
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json vite.config.js ./
COPY index.html .
COPY src ./src
COPY public ./public
RUN npm ci || npm install
RUN npm run build

# --- Runtime stage ---
FROM nginx:1.27-alpine
WORKDIR /usr/share/nginx/html
COPY --from=build /app/dist ./
COPY ./nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]



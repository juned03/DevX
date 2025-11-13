# --- Build stage ---
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json angular.json tsconfig.json jest.config.cjs ./
COPY src ./src
RUN npm ci || npm install
RUN npx ng build --configuration production

# --- Runtime stage ---
FROM nginx:1.27-alpine
WORKDIR /usr/share/nginx/html
COPY --from=build /app/dist/insurance-portal ./
COPY ./nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]



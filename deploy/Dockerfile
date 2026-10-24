# Build: docker build -f deploy/Dockerfile -t cstam-frontend .
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.27-alpine
# Unprivileged port; the official image renders /etc/nginx/templates/*.template at start.
ENV NGINX_ENVSUBST_FILTER=^CPD_UPSTREAM$
RUN rm /etc/nginx/conf.d/default.conf
COPY deploy/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080

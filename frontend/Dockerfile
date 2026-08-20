# Stage 1: Build the application
FROM node:20-slim AS build

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source
COPY . .

# Accept VITE_API_URL as build argument
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Build the app
RUN npm run build

# Stage 2: Serve with Nginx on dynamic port (for Cloud Run)
FROM nginx:stable-alpine

# Copy build output
COPY --from=build /app/dist /usr/share/nginx/html

# Custom nginx config that uses $PORT env var from Cloud Run
RUN echo 'server { \
  listen $PORT; \
  root /usr/share/nginx/html; \
  index index.html; \
  location / { \
    try_files $uri $uri/ /index.html; \
  } \
}' > /etc/nginx/templates/default.conf.template

# Use envsubst to inject $PORT at container start (provided by nginx-envsubst in official image)
ENV PORT=8080
EXPOSE 8080

CMD ["/bin/sh", "-c", "export PORT=${PORT:-8080} && envsubst '$PORT' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]

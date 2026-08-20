# Stage 1: Build the application
FROM node:20-slim AS build

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source (includes .env.production with VITE_API_URL)
COPY . .

# Build the app (Vite reads .env.production automatically)
RUN npm run build

# Stage 2: Serve with Nginx on dynamic port (for Cloud Run)
FROM nginx:stable-alpine

# Copy build output
COPY --from=build /app/dist /usr/share/nginx/html

# Create templates directory and nginx config that uses $PORT
RUN mkdir -p /etc/nginx/templates && \
    printf 'server {\n  listen ${PORT};\n  root /usr/share/nginx/html;\n  index index.html;\n  location / {\n    try_files $uri $uri/ /index.html;\n  }\n}\n' > /etc/nginx/templates/default.conf.template

ENV PORT=8080
EXPOSE 8080

CMD ["/bin/sh", "-c", "export PORT=${PORT:-8080} && envsubst '$PORT' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]

# Stage 1: Build the application
FROM node:20-slim AS build

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source
COPY . .

# Build the app - use build-time variables if needed
# ARG VITE_API_URL
# ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Stage 2: Serve the application with Nginx
FROM nginx:stable-alpine

# Copy build files from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom nginx config if you have one, or use default
# EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

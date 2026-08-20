# Use Node.js LTS version
FROM node:20-slim

# Install curl for dynamic DB IP resolution
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm install --production

# Bundle app source
COPY . .

# Expose the port
EXPOSE 8080

# Use APP_PORT or default to 8080 for Cloud Run
ENV APP_PORT=8080

# Start the application
CMD [ "npm", "start" ]

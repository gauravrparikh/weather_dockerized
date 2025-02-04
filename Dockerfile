# Use an official Node.js image
FROM node:18

# Set the working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy the rest of the app
COPY . .

# Install TypeScript globally
RUN npm install -g typescript

# Install Redis (for lightweight development use)
RUN apt-get update && apt-get install -y redis-server

# Expose the necessary ports
EXPOSE 3000
EXPOSE 6379

# Start Redis and the server
CMD redis-server --daemonize yes && tsc && node server.js

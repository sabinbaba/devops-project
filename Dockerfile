# Use official Node.js runtime as base image
FROM node:18-alpine

# Create and set working directory
WORKDIR /app

# Install dependencies first (for better caching)
COPY package*.json ./
RUN npm ci --only=production

# Copy application source code
COPY . .

# Create necessary directories if they don't exist
RUN mkdir -p public-section system

# Copy your specific directory structure
COPY public-section/ ./public-section/
COPY system/ ./system/

# Expose the port your app runs on (adjust if needed)
EXPOSE 3000

# Command to run the application
CMD ["node", "main.js"]
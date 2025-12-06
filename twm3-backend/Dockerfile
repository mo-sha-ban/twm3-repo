FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci --production

# Copy application code
COPY . .

# Expose the port (adjust if your app uses a different port)
EXPOSE 5000

# Start the application
CMD ["npm", "start"]

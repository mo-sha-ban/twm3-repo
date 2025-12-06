FROM node:22-alpine

WORKDIR /app

# Copy package files first
COPY package*.json ./

# Install dependencies with verbose output
RUN npm ci --omit=dev

# Copy the rest of the application code
COPY . .

# Copy entrypoint script
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Create uploads directory if it doesn't exist
RUN mkdir -p uploads

# Expose the port (Railway uses dynamic port from environment variable)
EXPOSE 5000

# Start the application using entrypoint script
CMD ["/app/entrypoint.sh"]

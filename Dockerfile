# Use the official Node.js 18 (or latest LTS) image based on Alpine Linux for a smaller footprint
FROM node:18-alpine

# Create and set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy the rest of the application code
COPY . .

# Expose the application port
EXPOSE 5000

# Set Node environment to production
ENV NODE_ENV=production

# Start the application
CMD ["npm", "start"]

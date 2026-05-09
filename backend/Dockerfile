# ── Backend Dockerfile ──────────────────────
# Builds the Node.js + Express API image

# Start from the official Node.js image (lightweight alpine version)
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json first (Docker caches this layer for faster rebuilds)
COPY package.json .

# Install dependencies
RUN npm install --production

# Copy the rest of the backend code
COPY . .

# Expose port 5000 so other containers (nginx) can reach this one
EXPOSE 5000

# Command to start the backend server
CMD ["node", "server.js"]

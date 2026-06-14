# ---- Backend Dockerfile ----
# Node.js Express API with PM2 for auto-restart inside Docker

FROM node:20-alpine

# Install PM2 globally
RUN npm install -g pm2

# Set working directory
WORKDIR /app

# Copy package files first for better layer caching
COPY package*.json ./

# Install all dependencies (PM2 needs devDeps like nodemon excluded, prod only)
RUN npm ci --omit=dev

# Copy the rest of the source code
COPY . .

# Expose the port
EXPOSE 3001

# Run with PM2 in no-daemon mode so Docker sees it as a foreground process
# --no-daemon keeps the container alive
# restart_delay and max_memory_restart come from ecosystem.config.js
CMD ["pm2-runtime", "ecosystem.config.js"]

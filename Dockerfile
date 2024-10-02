FROM node:18

WORKDIR /app

# Copy package.json and install dependencies
COPY ./package.json ./package-lock.json ./
RUN npm install

# Copy project files
COPY . .

# Set environment variables
ENV PORT=3000
ENV DATABASE=akp_system
ENV DATABASE_HOST=43.249.35.202
ENV DATABASE_USER=billion
ENV DATABASE_PASSWORD=59522214
ENV DATABASE_PORT=3306
ENV JWT_SECRET=707329d93a8fdc2557d3645edde98eed66cf77372a35f63276498df7c9455c1bc4981711a62e5cd2d7afae965e6bca3345ab5ceecf8aa93b740c002e923ae540

EXPOSE 3000
CMD ["npm", "start"]
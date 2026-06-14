module.exports = {
  apps: [
    {
      name: "mybackend",
      script: "./server.js",
      
      // --- High-Performance Cluster Topology ---
      instances: 3,             // 3 instances leaves 1 vCPU core dedicated to your Database/OS
      exec_mode: "cluster",     // Run in load-balanced cluster mode to maximize throughput
      
      // --- Memory Management for 16GB VPS ---
      // 3 instances x 2G = 6GB max RAM allocation for the backend, leaving plenty for DB & Frontend
      max_memory_restart: "2G", 
      
      // --- Production Stability Settings ---
      watch: false,             // Set to false to prevent accidental restarts on your VPS
      max_restarts: 15,         // Safeguard against infinite crash loops
      restart_delay: 4000,      // 4-second buffer gives your local database time to breathe if it restarts
      autorestart: true,
      
      // --- Environment Variables Configuration ---
      // This combined object handles both your app data and Node performance optimization flags
      env: {
        NODE_ENV: "production",
        UV_THREADPOOL_SIZE: 64,                    // Enhances internal Node.js background thread capacity
        NODE_OPTIONS: "--max-old-space-size=2048", // Grants the V8 engine access to use up to 2GB of RAM
        
        // Your Original App Configurations
        PORT: 3000,
        DATABASE: "akp_db",
        DATABASE_HOST: "187.77.131.4",
        DATABASE_USER: "akp",
        DATABASE_PASSWORD: "r7ZT4DWU6GP7ig9",
        DATABASE_PORT: 3306,
        JWT_SECRET: "707329d93a8fdc2557d3645edde98eed66cf77372a35f63276498df7c9455c1bc4981711a62e5cd2d7afae965e6bca3345ab5ceecf8aa93b740c002e923ae540"
      }
    }
  ]
};
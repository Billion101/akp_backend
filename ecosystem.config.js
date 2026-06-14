module.exports = {
  apps: [
    {
      name: "akp-backend",
      script: "./server.js",

      // --- Cluster mode: 2 instances on a 4-core VPS ---
      // Leaves 2 cores free for MySQL, MinIO, Dokploy, and the OS.
      // Each instance handles requests independently (load balanced).
      instances: 2,
      exec_mode: "cluster",

      // --- Memory limit per instance ---
      // 2 instances x 1.5GB = 3GB max for backend
      // Leaves ~13GB for DB (~3GB), MinIO (~512MB), frontend, Dokploy, and OS overhead
      max_memory_restart: "1500M",

      // --- Stability settings ---
      watch: false,          // Never watch files inside Docker
      autorestart: true,     // Auto-restart on crash
      max_restarts: 15,      // Stop trying after 15 consecutive crashes (prevents CPU spin)
      restart_delay: 4000,   // Wait 4s before restart — gives DB time to recover if it restarted
      min_uptime: "10s",     // Only count as a crash if the process dies before 10s

      // --- Node.js V8 tuning ---
      env: {
        NODE_ENV: "production",

        // Each instance gets up to 1.5GB of V8 heap
        NODE_OPTIONS: "--max-old-space-size=1536",

        // Increase libuv thread pool for heavy I/O (DB queries, file ops)
        // 4 threads per instance x 2 instances = 8 active threads
        UV_THREADPOOL_SIZE: 16,

        // All secret env vars (PORT, DATABASE_*, JWT_SECRET)
        // are injected by Dokploy at runtime — NOT hardcoded here
      }
    }
  ]
};

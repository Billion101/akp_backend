module.exports = {
    apps: [
        {
            name: "myapp2", // Application name
            script: "./server.js", // Entry point script
            max_memory_restart: '150M', // Restart if memory usage exceeds 150MB
            restart_delay: 5000,        // Wait 5 seconds before restarting
            watch: true,                // Watch for file changes
            env: {
                PORT: 3000, // Port number
                DATABASE: "akp_db", // Database name
                DATABASE_HOST: "akp-db.c56ie22ow1cy.ap-southeast-1.rds.amazonaws.com", // Database host
                DATABASE_USER: "admin", // Database user
                DATABASE_PASSWORD: "r7ZT4DWU6GP7ig9", // Database password
                DATABASE_PORT: 3306, // Database port
                JWT_SECRET: "707329d93a8fdc2557d3645edde98eed66cf77372a35f63276498df7c9455c1bc4981711a62e5cd2d7afae965e6bca3345ab5ceecf8aa93b740c002e923ae540" // JWT secret key
            },
        },
    ],
};
const mysql = require('mysql2');
const dotenv = require('dotenv');

dotenv.config();

// Use a connection POOL instead of a single connection.
// A pool automatically manages reconnects, handles concurrent requests,
// and never crashes the process on a dropped connection.
const pool = mysql.createPool({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE,
    port: process.env.DATABASE_PORT,
    waitForConnections: true,    // Queue queries when all connections are busy
    connectionLimit: 10,         // 10 per instance x 2 instances = 20 total DB connections
    queueLimit: 0,               // No queue limit
    enableKeepAlive: true,       // Prevent idle drops (important for local MySQL on same VPS)
    keepAliveInitialDelay: 10000 // Start keep-alive pings after 10s idle
});

// Test connectivity on startup so we fail fast if DB is unreachable
pool.getConnection((err, connection) => {
    if (err) {
        console.error('Failed to connect to database on startup:', err.message);
        process.exit(1); // Let PM2 / Docker restart the container
    } else {
        console.log('Database pool connected. Thread ID:', connection.threadId);
        connection.release();
    }
});

// Export the callback-based pool directly so all existing controllers
// using db.query(..., callback) and db.beginTransaction(..., callback) work unchanged.
module.exports = pool;

const mysql = require('mysql2');
const dotenv = require('dotenv');
dotenv.config();  // Load environment variables from .env file

// Create a connection pool
const pool = mysql.createPool({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE,
    port: process.env.DATABASE_PORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

// Get a connection from the pool and log the threadId
pool.getConnection((err, connection) => {
    if (err) {
        console.error('Database connection error: ', err);
        return;
    }
    console.log('Connected to the database as id ' + connection.threadId);
    connection.release();  // Don't forget to release the connection back to the pool
});

// Listen for any connection pool errors
pool.on('error', (err) => {
    console.error('Database connection error: ', err);
    // Optionally, implement a reconnection strategy here
});

// Export the pool
module.exports = pool;



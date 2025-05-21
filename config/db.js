const mysql = require('mysql2');
const dotenv = require('dotenv');

dotenv.config();

let db;

function handleDisconnect() {
    db = mysql.createConnection({
        host: process.env.DATABASE_HOST,
        user: process.env.DATABASE_USER,
        password: process.env.DATABASE_PASSWORD,
        database: process.env.DATABASE,
        port: process.env.DATABASE_PORT,
    });

    // Connect to the database
    db.connect((err) => {
        if (err) {
            console.error('Error connecting to the database:', err);
            setTimeout(handleDisconnect, 2000); // Retry after 2 seconds
        } else {
            console.log('Connected to the database as id ' + db.threadId);
        }
    });

    // Handle connection errors
    db.on('error', (err) => {
        console.error('Database error:', err);
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            console.log('Database connection lost. Reconnecting...');
            handleDisconnect(); // Reconnect on connection loss
        } else {
            throw err; // Throw other errors to prevent silent failure
        }
    });
}

// Initialize the connection
handleDisconnect();

module.exports = db;